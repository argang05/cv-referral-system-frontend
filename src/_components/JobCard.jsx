'use client';

import { useState } from 'react';
import { Pencil, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';

import JobDetailsOverlay from './JobDetailsOverlay';
import JobApplyOverlay from './JobApplyOverlay';

export default function JobCard({
  job,
  onEdit,
  onDelete,
  onApplicationSubmitted,
}) {
  const { user } = useUser();

  const [showDetails, setShowDetails] = useState(false);
  const [showApply, setShowApply] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {job.job_title}
          </h2>

          <div className="mt-4 space-y-2 text-sm text-gray-700">
            <p>
              <strong>Experience:</strong> {job.work_experience}
            </p>

            <p>
              <strong>Location:</strong> {job.location}
            </p>

            <p>
              <strong>Applicants:</strong> {job.applicants_count ?? 0}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(true)}
            >
              <Info size={16} className="mr-1" />
              More Info
            </Button>

            <Button
              size="sm"
              className="bg-[#F6490D] hover:bg-[#d23e0b] text-white"
              onClick={() => setShowApply(true)}
            >
              Apply
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Pencil
              size={18}
              onClick={onEdit}
              className="cursor-pointer text-gray-500 hover:text-blue-600 transition-colors"
            />

            <Trash2
              size={18}
              onClick={onDelete}
              className="cursor-pointer text-gray-500 hover:text-red-600 transition-colors"
            />
          </div>
        </div>
      </div>

      {showDetails && (
        <JobDetailsOverlay
          job={job}
          onClose={() => setShowDetails(false)}
          onApplicantsChange={onApplicationSubmitted}
        />
      )}

      {showApply && (
        <JobApplyOverlay
          job={job}
          user={user}
          onClose={() => setShowApply(false)}
          onApplicationSubmitted={() => {
            setShowApply(false);
            onApplicationSubmitted?.();
          }}
        />
      )}
    </>
  );
}