'use client';

import { ArrowRight, CalendarDays, GraduationCap, LockKeyhole, PencilLine, UserRound } from 'lucide-react';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: GraduationCap
  },
  DRAFT: {
    label: 'Draft Saved',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: PencilLine
  },
  COMPLETED: {
    label: 'Completed & Locked',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: LockKeyhole
  }
};

function formatDate(value) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AcademicDetailsCard({ referral, onOpen }) {
  const status = STATUS_CONFIG[referral.academic_details_status] || STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;
  const isLocked = referral.academic_details_status === 'COMPLETED';

  return (
    <article className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-orange-50 flex items-center justify-center">
            <UserRound size={21} className="text-[#F6490D]" />
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 break-words">
              {referral.candidate_name || 'Unnamed Candidate'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {referral.candidate_type === 'INTERN_FRESHER' ? 'Internship Fresher' : 'Full-Time Fresher'}
            </p>
          </div>
        </div>

        <span className={`inline-flex self-start items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${status.className}`}>
          <StatusIcon size={14} />
          {status.label}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Referred By</p>
          <p className="font-medium text-gray-800 mt-0.5">
            {referral.referrer?.name || 'Not available'}
          </p>
        </div>

        <div>
          <p className="text-gray-500">Assigned SBUs</p>
          <p className="font-medium text-gray-800 mt-0.5">
            {referral.sbus?.length || 0} reviewer(s)
          </p>
        </div>

        <div className="sm:col-span-2 flex items-center gap-2 text-gray-500">
          <CalendarDays size={15} />
          <span>Submitted {formatDate(referral.submitted_at)}</span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
        <button
          type="button"
          onClick={() => onOpen(referral)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F6490D] text-white text-sm font-semibold hover:bg-[#df400b] transition-colors"
        >
          {isLocked ? 'View Details' : referral.academic_details_status === 'DRAFT' ? 'Continue Draft' : 'Collect Details'}
          {isLocked ? <LockKeyhole size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>
    </article>
  );
}