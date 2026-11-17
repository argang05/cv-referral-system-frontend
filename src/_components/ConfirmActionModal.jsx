"use client";
import { useEffect, useRef } from "react";
import { AlertTriangle, Archive, CheckCircle2, LockKeyhole, Loader2, RotateCcw, X } from "lucide-react";

const ACTION_CONFIG = {
  publish: { title: "Publish Job Posting?", description: "This posting will become visible to employees, and a new job notification will be created.", label: "Publish Job", icon: CheckCircle2, color: "bg-[#F6490D] hover:bg-[#d63f09]", iconColor: "bg-orange-50 text-[#F6490D]" },
  close: { title: "Close Job Posting?", description: "Employees will no longer be able to submit referrals for this posting.", label: "Close Job", icon: LockKeyhole, color: "bg-[#F6490D] hover:bg-[#d63f09]", iconColor: "bg-orange-50 text-[#F6490D]" },
  reopen: { title: "Reopen Job Posting?", description: "This posting will become active again, allowing employees to submit referrals.", label: "Reopen Job", icon: RotateCcw, color: "bg-green-600 hover:bg-green-700", iconColor: "bg-green-50 text-green-600" },
  archive: { title: "Archive Job Posting?", description: "This posting will be archived and cannot be edited or reopened. Its historical records will be preserved.", label: "Archive Job", icon: Archive, color: "bg-red-600 hover:bg-red-700", iconColor: "bg-red-50 text-red-600" }
};

export default function ConfirmActionModal({ isOpen, action, job, loading = false, onConfirm, onClose }) {
  const confirmRef = useRef(null);
  const config = ACTION_CONFIG[action];

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => confirmRef.current?.focus(), 50);
    const handleEscape = event => { if (event.key === "Escape" && !loading) onClose?.(); };
    document.addEventListener("keydown", handleEscape);
    return () => { clearTimeout(timer); document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleEscape); };
  }, [isOpen, loading, onClose]);

  if (!isOpen || !config) return null;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget && !loading) onClose?.(); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-action-title" aria-describedby="confirm-action-description" className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 p-6 pb-0">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${config.iconColor}`}><Icon size={27} /></div>
          <button type="button" onClick={onClose} disabled={loading} aria-label="Close dialog" className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"><X size={20} /></button>
        </div>
        <div className="px-6 pb-5 pt-5">
          <h2 id="confirm-action-title" className="text-xl font-bold text-gray-900">{config.title}</h2>
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Job Posting</p>
            <p className="mt-1 break-words text-sm font-semibold text-gray-900">{job?.job_title || "Untitled Posting"}</p>
            {job?.department_name && <p className="mt-1 text-xs text-gray-500">{job.department_name}</p>}
          </div>
          <p id="confirm-action-description" className="mt-4 text-sm leading-6 text-gray-600">{config.description}</p>
          {action === "archive" && <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700"><AlertTriangle size={17} className="mt-0.5 shrink-0" /><span>This action cannot be reversed through the application.</span></div>}
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50">Cancel</button>
          <button ref={confirmRef} type="button" onClick={onConfirm} disabled={loading} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-wait disabled:opacity-70 ${config.color}`}>
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Icon size={17} />}
            {loading ? "Processing..." : config.label}
          </button>
        </div>
      </div>
    </div>
  );
}