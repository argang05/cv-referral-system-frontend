"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { X, UploadCloud } from "lucide-react";

const INITIAL_FORM = {
  job_title: "", job_description: "", location: "", department: "",
  employment_type: "FULL_TIME", education_summary: "", key_skills: "",
  min_experience: "", max_experience: "", functional_background: "",
  preferred_industry: "", behavioural_attributes: "", closing_date: "",
  document: null
};

export default function JobFormModal({ isOpen, onClose, onSubmit, job }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);

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
    axios.get("/api/departments/").then(res => setDepartments(Array.isArray(res.data) ? res.data : res.data.results || [])).catch(() => toast.error("Failed to load SBU list."));
  }, [job, isOpen]);

  if (!isOpen) return null;

  const handleChange = e => {
    const { name, value, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: files ? files[0] || null : value }));
  };

  const handleSubmit = async (e, publish = false) => {
    e.preventDefault();
    if (formData.min_experience !== "" && formData.max_experience !== "" && Number(formData.max_experience) < Number(formData.min_experience)) {
      toast.error("Maximum experience cannot be less than minimum experience.");
      return;
    }
    if (formData.document && (formData.document.type !== "application/pdf" || formData.document.size > 5 * 1024 * 1024)) {
      toast.error("Please upload a PDF of maximum 5 MB.");
      return;
    }
    try {
      setSaving(true);
      let documentUrl = job?.job_desc_document_url || "";
      if (formData.document) {
        const upload = new FormData();
        upload.append("file", formData.document);
        const res = await axios.post("/api/job-vacancy/upload-job-desc", upload);
        documentUrl = res.data.file_url;
      }
      const payload = {
        job_title: formData.job_title,
        job_description: formData.job_description,
        work_experience: formData.min_experience !== "" && formData.max_experience !== "" ? `${formData.min_experience}-${formData.max_experience} Years` : "",
        mode: "OFFICE",
        location: formData.location,
        job_desc_document_url: documentUrl,
        department: formData.department || null,
        employment_type: formData.employment_type,
        education_summary: formData.education_summary,
        key_skills: formData.key_skills,
        min_experience: formData.min_experience === "" ? null : Number(formData.min_experience),
        max_experience: formData.max_experience === "" ? null : Number(formData.max_experience),
        functional_background: formData.functional_background,
        preferred_industry: formData.preferred_industry,
        behavioural_attributes: formData.behavioural_attributes,
        closing_date: formData.closing_date || null
      };
      const result = await onSubmit(payload);
      const savedJob = result?.data?.job || result?.data;
      if (publish) {
        const jobId = job?.job_id || savedJob?.job_id;
        if (!jobId) throw new Error("Job ID missing after saving draft.");
        await axios.post(`/api/job-vacancy/${jobId}/publish`);
      }
      toast.success(publish ? "Job published successfully!" : job ? "Job updated successfully!" : "Draft saved successfully!");
      onClose();
    } catch (error) {
      const data = error.response?.data;
      const message = data?.error || data?.detail || (data && typeof data === "object" ? Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join(" | ") : error.message);
      toast.error(message || "Failed to save job posting.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20";
  const field = (label, name, type = "text", props = {}) => (
    <label className="block text-sm font-medium text-gray-700">
      <span className="mb-1.5 block">{label}</span>
      <input type={type} name={name} value={formData[name]} onChange={handleChange} className={inputClass} {...props} />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="relative flex max-h-[94vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{job ? "Edit Job Posting" : "Create Job Posting"}</h2>
            <p className="mt-1 text-xs text-gray-500">Save as draft or publish when all mandatory fields are complete.</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-900"><X size={22} /></button>
        </div>
        <form onSubmit={e => handleSubmit(e, false)} className="overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("Job Title", "job_title", "text", { placeholder: "e.g. Backend Software Engineer" })}</div>
            <label className="block text-sm font-medium text-gray-700">
              <span className="mb-1.5 block">SBU / Department</span>
              <select name="department" value={formData.department} onChange={handleChange} className={inputClass}>
                <option value="">Select SBU</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              <span className="mb-1.5 block">Employment Type</span>
              <select name="employment_type" value={formData.employment_type} onChange={handleChange} className={inputClass}>
                <option value="FULL_TIME">Full Time</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </label>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                <span className="mb-1.5 block">Job Description</span>
                <textarea name="job_description" rows={5} value={formData.job_description} onChange={handleChange} className={inputClass} placeholder="Describe the role, responsibilities and expectations..." />
              </label>
            </div>
            {field("Office Location", "location", "text", { placeholder: "e.g. Mumbai" })}
            {field("Closing Date", "closing_date", "date")}
            {field("Minimum Experience (Years)", "min_experience", "number", { min: 0, step: 1, placeholder: "0" })}
            {field("Maximum Experience (Years)", "max_experience", "number", { min: 0, step: 1, placeholder: "5" })}
            <div className="sm:col-span-2">{field("Education Requirements", "education_summary", "text", { placeholder: "e.g. B.Tech / MCA / equivalent" })}</div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                <span className="mb-1.5 block">Key Skills</span>
                <textarea name="key_skills" rows={3} value={formData.key_skills} onChange={handleChange} className={inputClass} placeholder="e.g. Python, Django, PostgreSQL, REST APIs" />
              </label>
            </div>
            {field("Functional Background", "functional_background", "text", { placeholder: "Optional" })}
            {field("Preferred Industry", "preferred_industry", "text", { placeholder: "Optional" })}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                <span className="mb-1.5 block">Behavioural Attributes</span>
                <textarea name="behavioural_attributes" rows={3} value={formData.behavioural_attributes} onChange={handleChange} className={inputClass} placeholder="Optional" />
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                <span className="mb-1.5 block">Job Description PDF</span>
                <input type="file" name="document" accept=".pdf,application/pdf" onChange={handleChange} className={inputClass} />
                <p className="mt-1 text-xs text-gray-500">PDF only, maximum 5 MB. {job?.job_desc_document_url && "Existing document will be retained unless replaced."}</p>
              </label>
              {job?.job_desc_document_url && <a href={job.job_desc_document_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-[#F6490D] underline">View current PDF</a>}
            </div>
          </div>
          <div className="sticky bottom-0 mt-6 flex flex-wrap justify-end gap-3 border-t bg-white pt-4">
            <button type="button" onClick={onClose} className="rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg border border-[#F6490D] px-5 py-2.5 text-sm font-medium text-[#F6490D] hover:bg-orange-50 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
            {(!job || job.status === "DRAFT") && <button type="button" disabled={saving} onClick={e => handleSubmit(e, true)} className="rounded-lg bg-[#F6490D] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#d63f09] disabled:opacity-50">{saving ? "Processing..." : "Save & Publish"}</button>}
          </div>
        </form>
      </div>
    </div>
  );
}