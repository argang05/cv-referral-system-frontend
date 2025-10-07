'use client';
import { X, Upload } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export default function EditApplicationModal({ app, onClose, onUpdate }) {
  const [name, setName] = useState(app.name);
  const [cvFile, setCvFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    setCvFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      let updatedCvUrl = app.cv_url;
  
      // Upload new CV if selected
      if (cvFile) {
        const formData = new FormData();
        formData.append('file', cvFile);
        formData.append('name', name); // matches upload proxy expectation
  
        const uploadRes = await axios.post('/api/job-vacancy/upload-applicant-cv', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
  
        updatedCvUrl = uploadRes.data.url;
      }
  
      // Send PUT to proxy — include applicant_id in body if proxy expects it
      const payload = {
        applicant_id: app.applicant_id, // ✅ ensure proxy can read it
        name,
        cv_url: updatedCvUrl,
      };
  
      const res = await axios.put(`/api/job-vacancy/application`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
  
      toast.success('Application updated successfully');
      onUpdate(res.data);
      onClose();
    } catch (err) {
      console.error('Update application error:', err.response?.data || err.message);
      toast.error('Failed to update application');
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Edit Application
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Applicant Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {/* CV Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload New CV (optional)
            </label>
            <label
              className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 cursor-pointer hover:border-orange-500 hover:text-orange-600 transition"
            >
              <Upload size={18} />
              {cvFile ? cvFile.name : 'Choose PDF File'}
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                hidden
              />
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}