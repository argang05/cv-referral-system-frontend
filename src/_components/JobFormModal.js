"use client";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

export default function JobFormModal({ isOpen, onClose, onSubmit, job }) {
  const [formData, setFormData] = useState({
    job_title: job?.job_title || "",
    job_description: job?.job_description || "",
    work_experience: job?.work_experience || "",
    mode: job?.mode || "WFH",
    location: job?.location || "",
    document: null,
  });

  const [isUploading, setIsUploading] = useState(false);
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let documentUrl = job?.job_desc_document_url || "";

      // If new document uploaded
      if (formData.document) {
        setIsUploading(true);
        const fileData = new FormData();
        fileData.append("file", formData.document);

        const res = await axios.post("/api/job-vacancy/upload-job-desc", fileData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        documentUrl = res.data?.file_url || "";
        console.log("Uploaded Job Description URL:", documentUrl);
        setIsUploading(false);
      }

      const payload = {
        job_title: formData.job_title,
        job_description: formData.job_description,
        work_experience: formData.work_experience,
        mode: formData.mode,
        location:
          formData.mode === "OFFICE" || formData.mode === "HYBRID"
            ? formData.location
            : "",
        job_desc_document_url: documentUrl,
      };

      console.log("Final Payload:", payload);

      await onSubmit(payload);
      toast.success(job ? "Job updated successfully!" : "Job created successfully!");
      onClose();
    } catch (error) {
      console.error("Submit error:", error.response?.data || error.message);
      toast.error("Error submitting job form!");
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-[95%] md:w-[600px] relative">
        <h2 className="text-xl font-semibold mb-4">
          {job ? "Edit Job Vacancy" : "Create Job Vacancy"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="job_title"
            placeholder="Job Title"
            value={formData.job_title}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />

          <textarea
            name="job_description"
            placeholder="Job Description"
            value={formData.job_description}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />

          <input
            type="text"
            name="work_experience"
            placeholder="Work Experience"
            value={formData.work_experience}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />

          <select
            name="mode"
            value={formData.mode}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="WFH">Work From Home</option>
            <option value="OFFICE">In Office</option>
            <option value="HYBRID">Hybrid</option>
          </select>

          {(formData.mode === "OFFICE" || formData.mode === "HYBRID") && (
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          )}

          <input
            type="file"
            name="document"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <span className="text-sm text-gray-500">
            Accepted formats: PDF, DOC, DOCX. Max size: 5MB.
          </span>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700"
            >
              {isUploading ? "Uploading..." : job ? "Update Job" : "Create Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
