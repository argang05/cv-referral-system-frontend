"use client";
import { useState } from "react";
import { Pencil, Info, MapPin, Users, BriefcaseBusiness, CalendarDays, Send, Play, LockKeyhole, RotateCcw, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import JobDetailsOverlay from "./JobDetailsOverlay";
import IJPReferralForm from "./IJPReferralForm";

const STATUS_STYLES = {
  OPEN: "bg-green-100 text-green-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
  CLOSED: "bg-gray-100 text-gray-700",
  ARCHIVED: "bg-red-100 text-red-700"
};

export default function JobCard({ job, canManage = false, onEdit, onAction, onReferralSubmitted, actionLoading }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showRefer, setShowRefer] = useState(false);
  const closingPassed = job.closing_date && new Date(`${job.closing_date}T23:59:59`).getTime() < Date.now();
  const canRefer = job.status === "OPEN" && !closingPassed;
  const experience = job.min_experience != null && job.max_experience != null ? `${job.min_experience}–${job.max_experience} years` : job.work_experience || "Not specified";
  const busy = Boolean(actionLoading);

  const handleLifecycleAction = action => {
    if (!onAction || busy) return;
    onAction(action);
  };

  const handleReferralSuccess = details => {
    setShowRefer(false);
    setShowDetails(false);
    onReferralSubmitted?.({
      candidateName: details?.candidateName || "Referred Candidate",
      jobTitle: details?.jobTitle || job.job_title || "Internal Job Posting"
    });
  };

  return (
    <>
      <div className="flex h-full flex-col justify-between rounded-2xl bg-white p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div>
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-gray-900">{job.job_title || "Untitled Draft"}</h2>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[job.status] || "bg-gray-100 text-gray-600"}`}>{job.status}</span>
          </div>
          <div className="space-y-2.5 text-sm text-gray-700">
            <p className="flex items-center gap-2"><BriefcaseBusiness size={16} className="shrink-0 text-[#F6490D]" /><span><strong>SBU:</strong> {job.department_name || "Not assigned"}</span></p>
            <p className="flex items-center gap-2"><Users size={16} className="shrink-0 text-[#F6490D]" /><span><strong>Type:</strong> {job.employment_type === "FULL_TIME" ? "Full Time" : job.employment_type === "INTERNSHIP" ? "Internship" : "Not specified"}</span></p>
            <p className="flex items-center gap-2"><BriefcaseBusiness size={16} className="shrink-0 text-[#F6490D]" /><span><strong>Experience:</strong> {experience}</span></p>
            <p className="flex items-center gap-2"><MapPin size={16} className="shrink-0 text-[#F6490D]" /><span><strong>Location:</strong> {job.location || "Not specified"}</span></p>
            <p className="flex items-center gap-2"><CalendarDays size={16} className="shrink-0 text-[#F6490D]" /><span><strong>Closing:</strong> {job.closing_date ? new Date(`${job.closing_date}T00:00:00`).toLocaleDateString("en-IN") : "Not specified"}</span></p>
            <p className="text-xs text-gray-500">Referrals received: {job.referrals_count ?? 0}</p>
          </div>
          {job.key_skills && <p className="mt-4 line-clamp-2 text-sm text-gray-500"><strong>Skills:</strong> {job.key_skills}</p>}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDetails(true)}><Info size={16} className="mr-1" /> More Info</Button>
            {canRefer && <Button size="sm" className="bg-[#F6490D] text-white hover:bg-[#d23e0b]" onClick={() => setShowRefer(true)}><Send size={15} className="mr-1" /> Refer Candidate</Button>}
          </div>
          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              {job.status !== "ARCHIVED" && <button type="button" onClick={onEdit} title="Edit posting" className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600"><Pencil size={18} /></button>}
              {job.status === "DRAFT" && <button type="button" disabled={busy} onClick={() => handleLifecycleAction("publish")} title="Publish" className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 disabled:opacity-50"><Play size={18} /></button>}
              {job.status === "OPEN" && <button type="button" disabled={busy} onClick={() => handleLifecycleAction("close")} title="Close" className="rounded-lg p-1.5 text-orange-600 hover:bg-orange-50 disabled:opacity-50"><LockKeyhole size={18} /></button>}
              {job.status === "CLOSED" && <button type="button" disabled={busy} onClick={() => handleLifecycleAction("reopen")} title="Reopen" className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 disabled:opacity-50"><RotateCcw size={18} /></button>}
              {["CLOSED", "DRAFT"].includes(job.status) && <button type="button" disabled={busy} onClick={() => handleLifecycleAction("archive")} title="Archive" className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"><Archive size={18} /></button>}
            </div>
          )}
        </div>
      </div>

      {showDetails && <JobDetailsOverlay job={job} onClose={() => setShowDetails(false)} onApplicantsChange={onReferralSubmitted} onAction={handleLifecycleAction} actionLoading={actionLoading} />}
      {showRefer && <IJPReferralForm job={job} onClose={() => setShowRefer(false)} onSubmitted={handleReferralSuccess} />}
    </>
  );
}