'use client';
import { useState } from 'react';
import JobDetailsOverlay from './JobDetailsOverlay';
import { Pencil, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import JobApplyOverlay from './JobApplyOverlay';
import { useUser } from '@/context/UserContext';

export default function JobCard({ job, onEdit, onDelete }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [jobs, setJobs] = useState(job)
  const { user, loading } = useUser()

  console.log("Job Entity: ",job)

  const fetchJobs = async () => {
    const res = await axios.get("/api/job-vacancy/");
    setJobs(res.data);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col justify-between transition-transform hover:scale-[1.02] hover:shadow-lg">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{job.job_title}</h2>

          <div className="mt-3 space-y-1 text-sm text-gray-700">
            <p><strong>Experience:</strong> {job.work_experience}</p>
            <p><strong>Mode:</strong> {job.mode}</p>
            {job.mode === 'IN_OFFICE' || job.mode === 'HYBRID' && (
              <p><strong>Location:</strong> {job.location}</p>
            )}
            <p><strong>Applicants:</strong> {job?.applicants_count || 0}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDetails(true)}>
              <Info size={16} className="mr-1" /> More Info
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-[#F6490D] hover:bg-[#d23e0b] text-white"
              onClick={() => setShowApply(true)}
            >
              Apply
            </Button>
          </div>

          <div className="flex gap-3">
            <Pencil
              size={18}
              className="text-gray-500 hover:text-blue-500 cursor-pointer"
              onClick={onEdit} // ✅ fixed: no need to pass job manually
            />
            <Trash2
              size={18}
              className="text-gray-500 hover:text-red-500 cursor-pointer"
              onClick={onDelete} // ✅ fixed: no need to pass job_id manually
            />
          </div>
        </div>
      </div>

      {showDetails && (
        <JobDetailsOverlay job={job} onClose={() => setShowDetails(false)} />
      )}
      {showApply && (
        <JobApplyOverlay
            job={job}
            user={user} // pass logged-in user
            onClose={() => setShowApply(false)}
            onApplicationSubmitted={fetchJobs} // refresh job/applicants list
        />
        )}
    </>
  );
}
