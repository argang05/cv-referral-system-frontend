"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useUser } from "@/context/UserContext";

const INITIAL_FORM = {
  candidate_name: "", candidate_email: "", candidate_phone: "",
  candidate_type: "", additional_comment: "", cv: null
};

export default function IJPReferralForm({ job, onClose, onSubmitted }) {
  const { user } = useUser();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [reviewers, setReviewers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const isInternship = job.employment_type === "INTERNSHIP";
  const typeOptions = isInternship ? [
    { value: "INTERN_FRESHER", label: "Internship - Fresher" },
    { value: "INTERN_EXPERIENCED", label: "Internship - Experienced" }
  ] : [
    { value: "FULL_TIME_FRESHER", label: "Full Time - Fresher" },
    { value: "FULL_TIME_EXPERIENCED", label: "Full Time - Experienced" }
  ];

  useEffect(() => {
    setFormData({ ...INITIAL_FORM, candidate_type: typeOptions[0].value });
    let cancelled = false;
    axios.get("/api/departments/").then(res => {
      if (cancelled) return;
      const departments = Array.isArray(res.data) ? res.data : res.data?.results || [];
      const department = departments.find(d => String(d.id) === String(job.department));
      setReviewers(Array.isArray(department?.reviewers) ? department.reviewers : []);
    }).catch(() => { if (!cancelled) setReviewers([]); });
    return () => { cancelled = true; };
  }, [job.job_id]);

  const handleChange = e => {
    const { name, value, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: files ? files[0] || null : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (submitting) return;
    if (!user?.emp_id) return toast.error("Please log in again.");
    if (!formData.candidate_name.trim() || !formData.candidate_type || !formData.cv) return toast.error("Complete all required fields.");
    if (!formData.candidate_email.trim() && !formData.candidate_phone.trim()) return toast.error("Provide at least one candidate contact detail.");
    if (formData.cv.size > 5 * 1024 * 1024) return toast.error("CV cannot exceed 5 MB.");
    if (!/\.(pdf|doc|docx)$/i.test(formData.cv.name)) return toast.error("Only PDF, DOC and DOCX files are accepted.");
    try {
      setSubmitting(true);
      const upload = new FormData();
      upload.append("cv", formData.cv);
      const uploaded = await axios.post("/api/upload-cv", upload);
      if (!uploaded.data?.url) throw new Error("CV upload did not return a URL.");
      await axios.post("/api/referrals/ijp", {
        emp_id: user.emp_id,
        job_id: job.job_id,
        candidate_name: formData.candidate_name.trim(),
        candidate_email: formData.candidate_email.trim(),
        candidate_phone: formData.candidate_phone.trim(),
        candidate_type: formData.candidate_type,
        referral_reason_type: "DIRECT_ROLE_FIT",
        cv_url: uploaded.data.url,
        additional_comment: formData.additional_comment
      });
      onSubmitted?.({ candidateName: formData.candidate_name.trim(), jobTitle: job.job_title });
    } catch (error) {
      const data = error.response?.data;
      toast.error(data?.error || data?.detail || error.message || "Failed to submit referral.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3">
      <div className="flex max-h-[94vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Refer Candidate</h2>
            <p className="mt-1 text-sm text-gray-500">Referral for an internal job posting</p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} className="text-gray-500 hover:text-gray-900 disabled:opacity-50" aria-label="Close referral form"><X size={22} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-5">
          <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm">
            <p className="font-semibold text-gray-900">{job.job_title}</p>
            <p className="mt-1 text-gray-600">SBU: {job.department_name || "Not assigned"}</p>
            <p className="text-gray-600">Location: {job.location || "Not specified"}</p>
            <p className="text-gray-600">Employment: {isInternship ? "Internship" : "Full Time"}</p>
          </div>
          <label className="block text-sm font-medium text-gray-700">Candidate Name *
            <input name="candidate_name" value={formData.candidate_name} onChange={handleChange} disabled={submitting} className={`${inputClass} mt-1.5`} required placeholder="Candidate full name" />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">Candidate Email
              <input type="email" name="candidate_email" value={formData.candidate_email} onChange={handleChange} disabled={submitting} className={`${inputClass} mt-1.5`} placeholder="Email address" />
            </label>
            <label className="block text-sm font-medium text-gray-700">Candidate Phone
              <input name="candidate_phone" value={formData.candidate_phone} onChange={handleChange} disabled={submitting} className={`${inputClass} mt-1.5`} maxLength={20} placeholder="Phone number" />
            </label>
          </div>
          <label className="block text-sm font-medium text-gray-700">Candidate Type *
            <select name="candidate_type" value={formData.candidate_type} onChange={handleChange} disabled={submitting} className={`${inputClass} mt-1.5`} required>
              {typeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <p className="font-medium text-gray-700">Referral Category</p>
            <p className="mt-1 text-gray-600">Direct Role Fit (automatically selected)</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <p className="font-medium text-gray-700">Assigned SBU Reviewers</p>
            {reviewers.length ? (
              <div className="mt-2 space-y-1">
                {reviewers.map((reviewer, i) => <p key={`${reviewer.email}-${i}`} className="text-gray-600">{reviewer.name || "Reviewer"} {reviewer.email ? `(${reviewer.email})` : ""}</p>)}
              </div>
            ) : <p className="mt-1 text-gray-500">Reviewers will be assigned automatically based on the job SBU.</p>}
          </div>
          <label className="block text-sm font-medium text-gray-700">Upload Candidate CV *
            <input type="file" name="cv" accept=".pdf,.doc,.docx" onChange={handleChange} disabled={submitting} className={`${inputClass} mt-1.5`} required />
            <span className="mt-1 block text-xs font-normal text-gray-500">PDF, DOC or DOCX. Maximum 5 MB.</span>
          </label>
          <label className="block text-sm font-medium text-gray-700">Additional Comments
            <textarea name="additional_comment" value={formData.additional_comment} onChange={handleChange} disabled={submitting} rows={3} className={`${inputClass} mt-1.5`} placeholder="Why is this candidate suitable for the role?" />
          </label>
          <div className="flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={onClose} disabled={submitting} className="rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-300 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-[#F6490D] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#d63f09] disabled:opacity-50">{submitting ? "Submitting..." : "Submit Referral"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}