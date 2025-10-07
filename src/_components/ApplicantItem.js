'use client';
import { Pencil, Trash2, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useState } from 'react';

export default function ApplicantItem({ app, appliers_emp_id, user_emp_id, onDelete, onUpdate }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localApp, setLocalApp] = useState({ ...app });
  const [cvFile, setCvFile] = useState(null);

  // ✅ Fetch fresh applicant data after update
  const fetchApplicant = async () => {
    try {
      const res = await axios.get(`/api/job-vacancy/applicants?job_id=${localApp.job_id}`);
      const updated = res.data.find(a => a.applicant_id === localApp.applicant_id);
      if (updated) setLocalApp(updated);
      onUpdate(updated);
    } catch (err) {
      console.error('Failed to fetch updated applicant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    toast((t) => (
        <div className="flex flex-col">
          <p>Delete application of <strong>{localApp.name}</strong>?</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(); // ✅ this must be t.id
                try {
                  setIsDeleting(true);
                  await axios.delete(`/api/job-vacancy/application`, {
                    data: { applicant_id: localApp.applicant_id }, // DELETE payload must be in `data`
                  });
                  toast.success(`${localApp.name}'s application deleted`);
                  onDelete(localApp.applicant_id);
                } catch (err) {
                  toast.error('Failed to delete application');
                  console.error(err);
                } finally {
                  setIsDeleting(false);
                }
              }}
              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss()}
              className="px-3 py-1 bg-gray-300 rounded-md hover:bg-gray-400 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ));
      
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      let updatedCvUrl = localApp.cv_url;
  
      if (cvFile) {
        const formData = new FormData();
        formData.append('file', cvFile);
        formData.append('name', localApp.name);
  
        const uploadRes = await axios.post('/api/job-vacancy/upload-applicant-cv', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updatedCvUrl = uploadRes.data.url;
      }
  
      // Send update request
      await axios.put(`/api/job-vacancy/application`, {
        applicant_id: localApp.applicant_id,
        name: localApp.name,
        cv_url: updatedCvUrl,
      });
  
      // ✅ Instantly reflect new data in UI before re-fetch
      setLocalApp((prev) => ({
        ...prev,
        name: localApp.name,
        cv_url: updatedCvUrl,
      }));
  
      // ✅ Optionally verify fresh data from backend
      setTimeout(fetchApplicant, 400);
  
      toast.success('Application updated successfully');
      setIsEditing(false);
      setCvFile(null);
    } catch (err) {
      console.error('Update error:', err.response?.data || err.message);
      toast.error('Failed to update application');
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <>
      <div className="flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition rounded-lg px-4 py-3 shadow-sm border border-gray-200">
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 text-base">
            {isLoading ? 'Loading...' : localApp.name}
          </span>
          <a
            href={localApp.cv_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-xs hover:underline"
          >
            Download Resume
          </a>
        </div>

        {appliers_emp_id === user_emp_id && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-500 hover:text-blue-600 transition"
              title="Edit Application"
              disabled={isLoading}
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
              className="text-gray-500 hover:text-red-600 transition disabled:opacity-40"
              title="Delete Application"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-md p-6 relative">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-black"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Edit Application
            </h2>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Applicant Name
                </label>
                <input
                  type="text"
                  value={localApp.name}
                  onChange={(e) =>
                    setLocalApp((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New CV (optional)
                </label>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 cursor-pointer hover:border-orange-500 hover:text-orange-600 transition">
                  <Upload size={18} />
                  {cvFile ? cvFile.name : 'Choose PDF File'}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setCvFile(e.target.files[0])}
                    hidden
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
