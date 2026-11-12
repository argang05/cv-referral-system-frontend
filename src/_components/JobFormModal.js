"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

export default function JobFormModal({
  isOpen,
  onClose,
  onSubmit,
  job,
}) {
  const [formData, setFormData] = useState({
    job_title: "",
    job_description: "",
    work_experience: "",
    location: "",
    document: null,
  });

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (job) {
      setFormData({
        job_title: job.job_title || "",
        job_description: job.job_description || "",
        work_experience: job.work_experience || "",
        location: job.location || "",
        document: null,
      });
    } else {
      setFormData({
        job_title: "",
        job_description: "",
        work_experience: "",
        location: "",
        document: null,
      });
    }
  }, [job, isOpen]);

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
      setIsUploading(true);

      let documentUrl = job?.job_desc_document_url || "";

      // Upload new document if selected
      if (formData.document) {
        const fileData = new FormData();
        fileData.append("file", formData.document);

        const res = await axios.post(
          "/api/job-vacancy/upload-job-desc",
          fileData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        documentUrl = res.data.file_url;
      }

      const payload = {
        job_title: formData.job_title,
        job_description: formData.job_description,
        work_experience: formData.work_experience,
        mode: "OFFICE", // Always Office
        location: formData.location,
        job_desc_document_url: documentUrl,
      };

      await onSubmit(payload);

      toast.success(
        job
          ? "Job updated successfully!"
          : "Job created successfully!"
      );

      onClose();
    } catch (error) {
      console.error(
        "Submit error:",
        error.response?.data || error.message
      );
      toast.error("Error submitting job form!");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-[95%] max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-6 text-2xl font-semibold text-gray-900">
          {job ? "Edit Job Vacancy" : "Create Job Vacancy"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            name="job_title"
            placeholder="Job Title"
            value={formData.job_title}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            required
          />

          <textarea
            name="job_description"
            placeholder="Job Description"
            value={formData.job_description}
            onChange={handleChange}
            rows={5}
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            required
          />

          <input
            type="text"
            name="work_experience"
            placeholder="Work Experience (e.g. 2-4 Years)"
            value={formData.work_experience}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            required
          />

          <input
            type="text"
            name="location"
            placeholder="Office Location"
            value={formData.location}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            required
          />

          <div>
            <input
              type="file"
              name="document"
              accept=".pdf,.doc,.docx"
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-3"
            />
            <p className="mt-1 text-sm text-gray-500">
              Accepted formats: PDF, DOC, DOCX (Maximum 5 MB)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-200 px-5 py-2.5 font-medium text-gray-800 transition hover:bg-gray-300"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading}
              className="rounded-lg bg-[#F6490D] px-5 py-2.5 font-medium text-white transition hover:bg-[#d63f09] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading
                ? "Uploading..."
                : job
                ? "Update Job"
                : "Create Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}