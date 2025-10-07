"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import EditApplicationModal from "./EditApplicationModal";
import { useUser } from "@/context/UserContext";
import { X } from "lucide-react";
import ApplicantItem from "./ApplicantItem";

export default function JobDetailsOverlay({ job, onClose }) {
  const [visibleCount, setVisibleCount] = useState(5);
  const [applicants, setApplicants] = useState([]);
  const [editingApp, setEditingApp] = useState(null);
  const { user } = useUser();

  // ✅ Fetch applicants from backend
  const fetchApplicants = async () => {
    try {
      const res = await axios.get(`/api/job-vacancy/applicants?job_id=${job.job_id}`);
      setApplicants(res.data || []);
    } catch (err) {
      console.error("Failed to fetch applicants:", err.response?.data || err.message);
    }
  };

  // ✅ Auto-fetch on mount
  useEffect(() => {
    fetchApplicants();
  }, [job.job_id]);

  // ✅ Refresh after edit or delete
  const handleUpdate = () => fetchApplicants();
  const handleDelete = () => fetchApplicants();

  const handleViewMore = () => setVisibleCount((prev) => prev + 50);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-[90%] p-6 relative animate-fadeIn my-10">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          {job.job_title}
        </h2>

        {/* Job info */}
        <div className="space-y-2 text-gray-700 text-sm">
          <p><strong>Description:</strong> {job.job_description}</p>
          <p><strong>Experience:</strong> {job.work_experience}</p>
          <p><strong>Mode:</strong> {job.mode}</p>
          {job.mode === 'IN_OFFICE' && <p><strong>Location:</strong> {job.location}</p>}
          {job.job_desc_document_url && (
            <p>
              <strong>Job Description Doc:</strong>{' '}
              <a
                href={job.job_desc_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View File
              </a>
            </p>
          )}
        </div>

        {/* Applicants */}
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-3 text-gray-800">
            Applicants ({applicants.length})
          </h3>

          {applicants.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {applicants.slice(0, visibleCount).map((app) => (
                <ApplicantItem
                  key={app.applicant_id}
                  app={app}
                  jobId={job.job_id}
                  onDelete={handleDelete}
                  appliers_emp_id={app.appliers_emp_id}
                  user_emp_id={user.emp_id}
                  onEditOpen={setEditingApp}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No applications yet.</p>
          )}

          {applicants.length > visibleCount && (
            <div className="text-center mt-3">
              <button
                onClick={handleViewMore}
                className="text-orange-600 hover:underline text-sm font-medium"
              >
                View More Applications
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editingApp && (
        <EditApplicationModal
          app={editingApp}
          onClose={() => setEditingApp(null)}
          onUpdate={handleUpdate} // ✅ refresh list automatically
        />
      )}
    </div>
  );
}
