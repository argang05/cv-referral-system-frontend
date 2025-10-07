'use client';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { X } from 'lucide-react';

export default function JobApplyOverlay({ job, onClose, onApplicationSubmitted, user }) {
  const [formData, setFormData] = useState({
    name: "",
    cv: null,
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => {
    const { name, files, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cv) return toast.error('Please upload your CV!');
    if (!formData.name) return toast.error('Please enter your name!');
  
    try {
      setIsUploading(true);
  
      // --- Step 1: Upload CV first ---
      const cvFormData = new FormData();
      cvFormData.append("file", formData.cv);  // ✅ Match proxy expectation
      cvFormData.append("name", formData.name); // ✅ Proxy also expects this
  
      const cvRes = await axios.post(
        "/api/job-vacancy/upload-applicant-cv",
        cvFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
  
      console.log("✅ CV Upload Response:", cvRes.data);
  
      // --- Step 2: Submit application ---
      const payload = {
        job: job.job_id,
        name: formData.name,
        cv_url: cvRes.data.cv_url, // ✅ backendRes.data.cv_url should exist
        appliers_emp_id: user.emp_id,
      };
  
      console.log("📦 Application Payload:", payload);
  
      await axios.post("/api/job-vacancy/apply", payload);
  
      toast.success("Application submitted!");
      onApplicationSubmitted(); // Refresh parent list
      onClose();
    } catch (err) {
      console.error("❌ Application submission error:", err.response?.data || err.message);
      toast.error("Failed to submit application.");
    } finally {
      setIsUploading(false);
    }
  };
  

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-[90%] p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-4">
          Apply for {job.job_title}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />

          <input
            type="file"
            name="cv"
            onChange={handleChange}
            className="w-full border p-2 rounded"
            accept=".pdf,.doc,.docx"
            required
          />
          <span className="text-sm text-gray-500">
            Accepted formats: PDF, DOC, DOCX. Max size: 5MB.
          </span>

          <button
            type="submit"
            disabled={isUploading}
            className="mt-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            {isUploading ? 'Uploading...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
