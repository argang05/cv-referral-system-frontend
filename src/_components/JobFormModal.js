"use client";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { X, UploadCloud } from "lucide-react";

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const ALLOWED_EXTENSIONS = /\.(pdf|doc|docx)$/i;

const INITIAL_FORM = {
  job_title: "", job_description: "", location: "", department: "",
  employment_type: "FULL_TIME", education_summary: "", key_skills: "",
  min_experience: "", max_experience: "", functional_background: "",
  preferred_industry: "", behavioural_attributes: "", document: null
};

const getError = error => {
  const data = error.response?.data;
  return data?.error || data?.detail || (data && typeof data === "object"
    ? Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join(" | ")
    : error.message) || "Failed to save job posting.";
};

const isValidDocument = file => Boolean(file && ALLOWED_EXTENSIONS.test(file.name) && file.size <= MAX_FILE_SIZE);

export default function JobFormModal({ isOpen, onClose, onSubmit, onRefresh, onJobSaved, job }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    setFormData(job ? {
      ...INITIAL_FORM,
      ...Object.fromEntries(Object.keys(INITIAL_FORM).filter(key => key !== "document").map(key => [key, job[key] ?? INITIAL_FORM[key]])),
      department: job.department || "",
      min_experience: job.min_experience ?? "",
      max_experience: job.max_experience ?? "",
      document: null
    } : { ...INITIAL_FORM });

    let active = true;

    axios.get("/api/departments/").then(res => {
      if (active) setDepartments(Array.isArray(res.data) ? res.data : res.data?.results || []);
    }).catch(() => {
      if (active) toast.error("Failed to load SBU list.");
    });

    return () => { active = false; };
  }, [job, isOpen]);

  if (!isOpen) return null;

  const handleChange = e => {
    const { name, value, files } = e.target;

    if (files) {
      const file = files[0] || null;

      if (file && !ALLOWED_EXTENSIONS.test(file.name)) {
        toast.error("Only PDF, DOC and DOCX files are accepted.");
        e.target.value = "";
        setFormData(prev => ({ ...prev, document: null }));
        return;
      }

      if (file && file.size > MAX_FILE_SIZE) {
        toast.error("Job description file cannot exceed 3 MB.");
        e.target.value = "";
        setFormData(prev => ({ ...prev, document: null }));
        return;
      }

      setFormData(prev => ({ ...prev, [name]: file }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const hasDocument = isValidDocument(formData.document) || Boolean(job?.job_desc_document_url);

  const requiredFieldsValid = Boolean(
    formData.job_title.trim() &&
    formData.location.trim() &&
    formData.department &&
    formData.employment_type &&
    formData.education_summary.trim() &&
    formData.key_skills.trim() &&
    formData.min_experience !== "" &&
    Number.isInteger(Number(formData.min_experience)) &&
    Number(formData.min_experience) >= 0 &&
    (formData.max_experience === "" || (
      Number.isInteger(Number(formData.max_experience)) &&
      Number(formData.max_experience) >= Number(formData.min_experience)
    ))
  );

  const canSave = requiredFieldsValid && hasDocument && !saving;

  const handleSubmit = async (e, publish = false) => {
    e.preventDefault();

    if (submittingRef.current) return;

    if (!requiredFieldsValid) {
      toast.error("Please complete all mandatory fields correctly.");
      return;
    }

    if (!hasDocument) {
      toast.error("Please upload a valid JD document (PDF, DOC or DOCX, maximum 3 MB).");
      return;
    }

    if (formData.document && !isValidDocument(formData.document)) {
      toast.error("Invalid JD document. Only PDF, DOC and DOCX files up to 3 MB are accepted.");
      return;
    }

    submittingRef.current = true;
    setSaving(true);

    try {
      let documentUrl = job?.job_desc_document_url || "";

      if (formData.document) {
        const upload = new FormData();
        upload.append("file", formData.document);

        const res = await axios.post("/api/job-vacancy/upload-job-desc", upload);
        documentUrl = res.data?.file_url;

        if (!documentUrl) throw new Error("JD upload failed to return a document URL.");
      }

      if (!documentUrl) throw new Error("A job description document is required.");

      const minimum = formData.min_experience === "" ? null : Number(formData.min_experience);
      const maximum = formData.max_experience === "" ? null : Number(formData.max_experience);

      const payload = {
        job_title: formData.job_title.trim(),
        job_description: formData.job_description.trim(),
        work_experience: minimum !== null ? maximum !== null ? `${minimum}-${maximum} Years` : `${minimum}+ Years` : "",
        mode: "OFFICE",
        location: formData.location.trim(),
        job_desc_document_url: documentUrl,
        department: formData.department || null,
        employment_type: formData.employment_type,
        education_summary: formData.education_summary.trim(),
        key_skills: formData.key_skills.trim(),
        min_experience: minimum,
        max_experience: maximum,
        functional_background: formData.functional_background.trim(),
        preferred_industry: formData.preferred_industry.trim(),
        behavioural_attributes: formData.behavioural_attributes.trim()
      };

      let savedJob;

      if (job) {
        const result = await onSubmit(payload);
        savedJob = result?.data?.job || result?.data;

        if (publish && job.status === "DRAFT") {
          const publishResponse = await axios.post(`/api/job-vacancy/${job.job_id}/publish`);
          savedJob = publishResponse.data?.job || publishResponse.data;
        }
      } else {
        const result = await onSubmit({ ...payload, publish });
        savedJob = result?.data?.job || result?.data;
      }

      if (savedJob?.job_id && onJobSaved) onJobSaved(savedJob);

      toast.success(publish ? "Job published successfully!" : job ? "Job updated successfully!" : "Draft saved successfully!");
      onClose();

      if (onRefresh) {
        try { await onRefresh(); }
        catch (refreshError) { console.error("Job list refresh failed:", refreshError); }
      }
    } catch (error) {
      toast.error(getError(error));

      if (onRefresh) {
        try { await onRefresh(); }
        catch (refreshError) { console.error("Job list refresh failed:", refreshError); }
      }
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20";

  const field = (label, name, type = "text", props = {}) => (
    <label className="block text-sm font-medium text-gray-700">
      <span className="mb-1.5 block">{label}</span>
      <input type={type} name={name} value={formData[name]} onChange={handleChange} disabled={saving} className={inputClass} {...props} />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="relative flex max-h-[94vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{job ? "Edit Job Posting" : "Create Job Posting"}</h2>
            <p className="mt-1 text-xs text-gray-500">Complete all mandatory fields and upload a JD document before saving or publishing.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="text-gray-500 hover:text-gray-900 disabled:opacity-50" aria-label="Close job form"><X size={22} /></button>
        </div>

        <form onSubmit={e => handleSubmit(e, false)} className="overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("Job Title *", "job_title", "text", { placeholder: "e.g. Backend Software Engineer", required: true })}</div>

            <label className="block text-sm font-medium text-gray-700">
              <span className="mb-1.5 block">SBU / Department *</span>
              <select name="department" value={formData.department} onChange={handleChange} disabled={saving} className={inputClass} required>
                <option value="">Select SBU</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              <span className="mb-1.5 block">Employment Type *</span>
              <select name="employment_type" value={formData.employment_type} onChange={handleChange} disabled={saving} className={inputClass} required>
                <option value="FULL_TIME">Full Time</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </label>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                <span className="mb-1.5 block">Job Description (Optional)</span>
                <textarea name="job_description" rows={5} value={formData.job_description} onChange={handleChange} disabled={saving} className={inputClass} placeholder="Describe the role, responsibilities and expectations..." />
              </label>
            </div>

            {field("Office Location *", "location", "text", { placeholder: "e.g. Mumbai", required: true })}
            {field("Minimum Experience (Years) *", "min_experience", "number", { min: 0, step: 1, placeholder: "0", required: true })}
            {field("Maximum Experience (Years) (Optional)", "max_experience", "number", { min: 0, step: 1, placeholder: "5" })}

            <div className="sm:col-span-2">{field("Education Requirements *", "education_summary", "text", { placeholder: "e.g. B.Tech / MCA / equivalent", required: true })}</div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                <span className="mb-1.5 block">Key Skills *</span>
                <textarea name="key_skills" rows={3} value={formData.key_skills} onChange={handleChange} disabled={saving} className={inputClass} placeholder="e.g. Python, Django, PostgreSQL, REST APIs" required />
              </label>
            </div>

            {field("Functional Background", "functional_background", "text", { placeholder: "Optional" })}
            {field("Preferred Industry", "preferred_industry", "text", { placeholder: "Optional" })}

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                <span className="mb-1.5 block">Behavioural Attributes</span>
                <textarea name="behavioural_attributes" rows={3} value={formData.behavioural_attributes} onChange={handleChange} disabled={saving} className={inputClass} placeholder="Optional" />
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                <span className="mb-1.5 block">Job Description Document *</span>
                <div className="relative">
                  <UploadCloud size={20} className="pointer-events-none absolute right-3 top-3 text-gray-400" />
                  <input type="file" name="document" accept=".pdf,.doc,.docx" onChange={handleChange} disabled={saving} className={inputClass} />
                </div>
                <p className="mt-1 text-xs text-gray-500">PDF, DOC or DOCX. Maximum 3 MB. {job?.job_desc_document_url && "Existing document will be retained unless replaced."}</p>
              </label>

              {job?.job_desc_document_url && (
                <a href={job.job_desc_document_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-[#F6490D] underline">View current document</a>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 mt-6 flex flex-wrap justify-end gap-3 border-t bg-white pt-4">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-300 disabled:opacity-50">Cancel</button>

            <button type="submit" disabled={!canSave} className="rounded-lg border border-[#F6490D] px-5 py-2.5 text-sm font-medium text-[#F6490D] hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Saving..." : job ? "Save Changes" : "Save as Draft"}
            </button>

            {(!job || job.status === "DRAFT") && (
              <button type="button" disabled={!canSave} onClick={e => handleSubmit(e, true)} className="rounded-lg bg-[#F6490D] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#d63f09] disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? "Processing..." : "Save & Publish"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}