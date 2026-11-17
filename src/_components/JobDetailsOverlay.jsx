"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import { X, MapPin, BriefcaseBusiness, CalendarDays, Download, Users, Clock3, GraduationCap, Building2, Play, LockKeyhole, RotateCcw, Archive, Loader2 } from "lucide-react";

const STATUS_COLORS = {
  OPEN: "bg-green-100 text-green-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
  CLOSED: "bg-gray-100 text-gray-700",
  ARCHIVED: "bg-red-100 text-red-700"
};

const formatDate = value => {
  if (!value) return "Not specified";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not specified" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatValue = value => value === null || value === undefined || value === "" ? "Not specified" : value;

const InfoField = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-800">{formatValue(value)}</p>
  </div>
);

export default function JobDetailsOverlay({ job, onClose, onApplicantsChange, onAction, actionLoading }) {
  const { user } = useUser();
  const canManage = user?.role === "ADMIN" || user?.role === "HR" || user?.is_hr === true;
  const [details, setDetails] = useState(job);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);
  const [activeTab, setActiveTab] = useState("REFERRALS");

  useEffect(() => {
    let active = true;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/job-vacancy/${job.job_id}`);
        if (active) setDetails(res.data);
      } catch (error) {
        console.error("Failed to load job details:", error.response?.data || error.message);
        if (active) toast.error("Failed to load complete job details.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDetails();
    return () => { active = false; };
  }, [job.job_id]);

  useEffect(() => { setDetails(prev => ({ ...prev, ...job })); }, [job]);

  useEffect(() => {
    const handleEscape = event => { if (event.key === "Escape" && !actionLoading) onClose?.(); };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, actionLoading]);

  const referrals = canManage && Array.isArray(details.referrals) ? details.referrals : [];
  const history = canManage && Array.isArray(details.history) ? details.history : [];
  const experience = details.min_experience != null && details.max_experience != null ? `${details.min_experience}–${details.max_experience} years` : details.work_experience || "Not specified";
  const busy = Boolean(actionLoading);
  const currentStatus = job.status || details.status;

  const actionButtons = {
    DRAFT: [{ action: "publish", label: "Publish Job", icon: Play, className: "bg-[#F6490D] text-white hover:bg-[#d63f09]" }, { action: "archive", label: "Archive", icon: Archive, className: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" }],
    OPEN: [{ action: "close", label: "Close Posting", icon: LockKeyhole, className: "bg-[#F6490D] text-white hover:bg-[#d63f09]" }],
    CLOSED: [{ action: "reopen", label: "Reopen Posting", icon: RotateCcw, className: "bg-green-600 text-white hover:bg-green-700" }, { action: "archive", label: "Archive", icon: Archive, className: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" }]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-label="Job posting details" className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">{details.job_title || "Untitled Posting"}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[currentStatus] || "bg-gray-100 text-gray-600"}`}>{currentStatus}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{details.department_name || "SBU not assigned"}</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close details" className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"><X size={22} /></button>
        </div>

        <div className="space-y-6 overflow-y-auto p-5">
          {loading && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 size={15} className="animate-spin" /> Refreshing job information...</div>}

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-orange-100 bg-orange-50 p-4 sm:grid-cols-4">
            <div className="flex items-start gap-2"><Building2 size={18} className="mt-0.5 shrink-0 text-[#F6490D]" /><InfoField label="SBU" value={details.department_name} /></div>
            <div className="flex items-start gap-2"><BriefcaseBusiness size={18} className="mt-0.5 shrink-0 text-[#F6490D]" /><InfoField label="Employment" value={details.employment_type === "FULL_TIME" ? "Full Time" : details.employment_type === "INTERNSHIP" ? "Internship" : null} /></div>
            <div className="flex items-start gap-2"><MapPin size={18} className="mt-0.5 shrink-0 text-[#F6490D]" /><InfoField label="Location" value={details.location} /></div>
            <div className="flex items-start gap-2"><Clock3 size={18} className="mt-0.5 shrink-0 text-[#F6490D]" /><InfoField label="Experience" value={experience} /></div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-2"><CalendarDays size={18} className="mt-0.5 text-[#F6490D]" /><InfoField label="Closing Date" value={formatDate(details.closing_date)} /></div>
            <div className="flex items-start gap-2"><Users size={18} className="mt-0.5 text-[#F6490D]" /><InfoField label="Referrals Received" value={details.referrals_count ?? 0} /></div>
          </div>

          <section>
            <h3 className="mb-2 text-base font-semibold text-gray-900">Job Description</h3>
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">{formatValue(details.job_description)}</p>
          </section>

          <section>
            <h3 className="mb-3 text-base font-semibold text-gray-900">Candidate Requirements</h3>
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
              <div className="flex items-start gap-2"><GraduationCap size={18} className="mt-0.5 text-[#F6490D]" /><InfoField label="Education" value={details.education_summary} /></div>
              <InfoField label="Key Skills" value={details.key_skills} />
              <InfoField label="Functional Background" value={details.functional_background} />
              <InfoField label="Preferred Industry" value={details.preferred_industry} />
              <div className="sm:col-span-2"><InfoField label="Behavioural Attributes" value={details.behavioural_attributes} /></div>
            </div>
          </section>

          {details.job_desc_document_url && (
            <a href={details.job_desc_document_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#F6490D] px-4 py-2.5 text-sm font-semibold text-[#F6490D] hover:bg-orange-50"><Download size={17} /> Download Job Description PDF</a>
          )}

          {canManage && (
            <section className="border-t pt-5">
              <div className="mb-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => { setActiveTab("REFERRALS"); setVisibleCount(5); }} className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === "REFERRALS" ? "bg-[#F6490D] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Referrals ({referrals.length})</button>
                <button type="button" onClick={() => { setActiveTab("HISTORY"); setVisibleCount(5); }} className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === "HISTORY" ? "bg-[#F6490D] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Posting History ({history.length})</button>
              </div>

              {activeTab === "REFERRALS" && (
                <div className="space-y-3">
                  {referrals.length ? referrals.slice(0, visibleCount).map(referral => (
                    <div key={referral.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900">{referral.candidate_name}</p>
                          <p className="mt-1 text-xs text-gray-500">Referred by {referral.referrer_name || "Unknown"} ({referral.referrer_emp_id || "N/A"})</p>
                        </div>
                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-[#F6490D]">{referral.current_status || "Pending"}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-600 sm:grid-cols-2">
                        <p><strong>Candidate Type:</strong> {referral.candidate_type?.replaceAll("_", " ") || "Not specified"}</p>
                        <p><strong>Submitted:</strong> {formatDate(referral.submitted_at)}</p>
                        <p><strong>SBU Decision:</strong> {formatValue(referral.sbu_decision)}</p>
                        <p><strong>HR Decision:</strong> {formatValue(referral.hr_decision)}</p>
                        <p><strong>Offer Released:</strong> {referral.offer_released ? "Yes" : "No"}</p>
                        <p><strong>Offer Outcome:</strong> {formatValue(referral.offer_outcome)}</p>
                        <p><strong>Joining Date:</strong> {formatDate(referral.joining_date)}</p>
                      </div>
                    </div>
                  )) : <p className="text-sm text-gray-500">No referrals received for this posting yet.</p>}
                  {referrals.length > visibleCount && <button type="button" onClick={() => setVisibleCount(v => v + 20)} className="text-sm font-medium text-[#F6490D] hover:underline">View More Referrals</button>}
                </div>
              )}

              {activeTab === "HISTORY" && (
                <div className="space-y-3">
                  {history.length ? history.slice(0, visibleCount).map(item => (
                    <div key={item.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="font-semibold text-gray-900">{item.action?.replaceAll("_", " ")}</p>
                        <span className="text-xs text-gray-500">{formatDate(item.created_at)}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">By: {item.performed_by_name || "System"}</p>
                      {item.changes && Object.keys(item.changes).length > 0 && (
                        <div className="mt-3 space-y-1 border-t pt-2 text-xs text-gray-600">
                          {Object.entries(item.changes).map(([field, change]) => <p key={field}><strong>{field.replaceAll("_", " ")}:</strong> {String(change?.old ?? "Empty")} → {String(change?.new ?? "Empty")}</p>)}
                        </div>
                      )}
                    </div>
                  )) : <p className="text-sm text-gray-500">No posting history available.</p>}
                  {history.length > visibleCount && <button type="button" onClick={() => setVisibleCount(v => v + 20)} className="text-sm font-medium text-[#F6490D] hover:underline">View More History</button>}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-white p-4">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50">Close</button>
          {canManage && (actionButtons[currentStatus] || []).map(({ action, label, icon: Icon, className }) => (
            <button key={action} type="button" disabled={busy || loading} onClick={() => onAction?.(action)} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
              {actionLoading === `${job.job_id}-${action}` ? <Loader2 size={17} className="animate-spin" /> : <Icon size={17} />}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}