"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import JobFormModal from "@/_components/JobFormModal";
import JobCard from "@/_components/JobCard";

export default function JobVacancyPage() {
  const [jobs, setJobs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const res = await axios.get("/api/job-vacancy/");
      setJobs(res.data);
    } catch (error) {
      toast.error("Failed to fetch jobs");
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleCreate = async (payload) => {
    await axios.post("/api/job-vacancy/", payload);
    fetchJobs();
  };

  const handleEdit = async (payload) => {
    await axios.put(`/api/job-vacancy/${editJob.job_id}`, payload);
    fetchJobs();
  };

  const handleDelete = async (jobId) => {
    const toastId = toast.custom((t) => (
      <div className="p-3 bg-white rounded-lg shadow-md">
        <p className="font-medium">Are you sure you want to delete this job?</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={async () => {
              setDeleteLoading(true);
              try {
                await axios.delete(`/api/job-vacancy/${jobId}`);
                toast.dismiss(toastId);
                toast.success("Job deleted successfully!");
                fetchJobs();
              } catch {
                toast.error("Failed to delete job!");
              } finally {
                setDeleteLoading(false);
              }
            }}
            className={`bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 ${
              deleteLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={deleteLoading}
          >
            {deleteLoading ? "Deleting..." : "Yes, Delete"}
          </button>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-semibold">Internal Job Vacancies</h1>
        <button
          onClick={() => {
            setEditJob(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-orange-600 text-white text-sm rounded-xl hover:bg-orange-700"
        >
          {"+ Upload Job Vacancy Details".toUpperCase()}
        </button>
      </div>

      {loadingJobs ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="animate-pulse p-5 bg-gray-100 rounded-xl shadow">
                <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="flex gap-3">
                  <div className="h-8 w-20 bg-gray-300 rounded" />
                  <div className="h-8 w-20 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard
              key={job.job_id}
              job={job}
              onEdit={() => {
                setEditJob(job);
                setModalOpen(true);
              }}
              onApplicationSubmitted={fetchJobs}
              onDelete={() => handleDelete(job.job_id)}
            />
          ))}
        </div>
      )}

      <JobFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={editJob ? handleEdit : handleCreate}
        job={editJob}
      />
    </div>
  );
}
