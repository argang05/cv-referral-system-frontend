"use client";
import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Search, BriefcaseBusiness, CheckCircle2, LockKeyhole, Archive } from "lucide-react";
import { useUser } from "@/context/UserContext";
import JobFormModal from "@/_components/JobFormModal";
import JobCard from "@/_components/JobCard";
import ConfirmActionModal from "@/_components/ConfirmActionModal";
import ReferralSuccessModal from "@/_components/ReferralSuccessModal";

const ACTION_LABELS = { publish: "published", close: "closed", reopen: "reopened", archive: "archived" };
const ALLOWED_ACTIONS = { DRAFT: ["publish", "archive"], OPEN: ["close"], CLOSED: ["reopen", "archive"] };

function JobVacancyContent() {
  const searchParams = useSearchParams();
  const notificationJobId = searchParams.get("job_id");
  const { user, loading: userLoading } = useUser();
  const canManage = user?.role === "ADMIN" || user?.role === "HR" || user?.is_hr === true;
  const [jobs, setJobs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [highlightedJobId, setHighlightedJobId] = useState(null);
  const [referralSuccess, setReferralSuccess] = useState(null);
  const jobRefs = useRef({});
  const highlightTimer = useRef(null);
  const processedNotification = useRef(null);
  const actionLock = useRef(false);
  const fetchSequence = useRef(0);

  const fetchJobs = useCallback(async (silent = false) => {
    const sequence = ++fetchSequence.current;
    try {
      if (!silent) setLoadingJobs(true);
      const res = await axios.get("/api/job-vacancy/", { headers: { "Cache-Control": "no-cache" } });
      if (sequence === fetchSequence.current) setJobs(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (error) {
      if (sequence === fetchSequence.current) toast.error(error.response?.data?.error || "Failed to fetch jobs");
      throw error;
    } finally {
      if (!silent && sequence === fetchSequence.current) setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    if (userLoading) return;
    if (user) void fetchJobs().catch(() => {});
    else { fetchSequence.current++; setJobs([]); setLoadingJobs(false); }
  }, [userLoading, user?.emp_id, fetchJobs]);

  useEffect(() => () => { if (highlightTimer.current) clearTimeout(highlightTimer.current); }, []);

  const syncJob = useCallback(updatedJob => {
    if (!updatedJob?.job_id) return;
    fetchSequence.current++;
    setJobs(previous => {
      const exists = previous.some(item => String(item.job_id) === String(updatedJob.job_id));
      if (exists) return previous.map(item => String(item.job_id) === String(updatedJob.job_id) ? { ...item, ...updatedJob } : item);
      return [updatedJob, ...previous];
    });
  }, []);

  const filteredJobs = useMemo(() => jobs.filter(job => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [job.job_title, job.department_name, job.location, job.key_skills].some(value => String(value || "").toLowerCase().includes(term));
    return matchesSearch && (statusFilter === "ALL" || job.status === statusFilter) && (typeFilter === "ALL" || job.employment_type === typeFilter);
  }), [jobs, search, statusFilter, typeFilter]);

  useEffect(() => {
    if (loadingJobs || !user || !notificationJobId || processedNotification.current === notificationJobId) return;
    const target = jobs.find(job => String(job.job_id) === String(notificationJobId));
    processedNotification.current = notificationJobId;
    if (!target) { toast.error("This job posting is unavailable or you do not have access."); return; }
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setHighlightedJobId(String(notificationJobId));
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlightedJobId(null), 4000);
  }, [notificationJobId, loadingJobs, jobs, user?.emp_id]);

  useEffect(() => {
    if (!highlightedJobId || loadingJobs) return;
    const timer = setTimeout(() => jobRefs.current[highlightedJobId]?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    return () => clearTimeout(timer);
  }, [highlightedJobId, filteredJobs, loadingJobs]);

  const handleCreate = async payload => {
    return await axios.post("/api/job-vacancy/", payload);
  };

  const handleEdit = async payload => {
    if (!editJob?.job_id) throw new Error("No job selected for editing.");
    return await axios.put(`/api/job-vacancy/${editJob.job_id}`, payload);
  };

  const handleReferralSubmitted = details => {
    setReferralSuccess({
      candidateName: details?.candidateName || "Referred Candidate",
      jobTitle: details?.jobTitle || "Internal Job Posting"
    });
    void fetchJobs(true).catch(() => {});
  };

  const requestAction = (job, action) => {
    if (!canManage || actionLock.current || !ALLOWED_ACTIONS[job.status]?.includes(action)) return;
    setConfirmation({ job, action });
  };

  const confirmAction = async () => {
    if (!confirmation || actionLock.current) return;
    const { job, action } = confirmation;
    actionLock.current = true;
    setActionLoading(`${job.job_id}-${action}`);
    try {
      const response = await axios.post(`/api/job-vacancy/${job.job_id}/${action}`);
      if (response.data?.job) syncJob(response.data.job);
      toast.success(`Job ${ACTION_LABELS[action]} successfully.`);
      setConfirmation(null);
      try { await fetchJobs(true); }
      catch (refreshError) { console.error("Job list refresh failed:", refreshError); }
    } catch (error) {
      const data = error.response?.data;
      const message = data?.error || data?.detail || (data && typeof data === "object" ? Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join(" | ") : "Action failed.");
      toast.error(message);
    } finally {
      actionLock.current = false;
      setActionLoading(null);
    }
  };

  const stats = {
    total: jobs.length,
    open: jobs.filter(j => j.status === "OPEN").length,
    closed: jobs.filter(j => j.status === "CLOSED").length,
    draft: jobs.filter(j => j.status === "DRAFT").length
  };

  if (userLoading) return <div className="p-6 text-gray-500">Loading your account...</div>;
  if (!user) return <div className="p-6 text-gray-600">Please log in to view internal job postings.</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Internal Job Postings</h1>
          <p className="mt-1 text-sm text-gray-500">Explore internal opportunities and refer suitable candidates.</p>
        </div>
        {canManage && (
          <button type="button" onClick={() => { setEditJob(null); setModalOpen(true); }} className="flex items-center justify-center gap-2 rounded-xl bg-[#F6490D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d63f09]">
            <Plus size={18} /> Create Job Posting
          </button>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Postings", value: stats.total, icon: BriefcaseBusiness },
          { label: "Open", value: stats.open, icon: CheckCircle2 },
          { label: "Closed", value: stats.closed, icon: LockKeyhole },
          { label: canManage ? "Drafts" : "Available to View", value: canManage ? stats.draft : stats.total, icon: Archive }
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">{label}</span>
              <Icon size={18} className="text-[#F6490D]" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by job title, SBU, skills or location..." className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          {canManage && <option value="DRAFT">Draft</option>}
          {canManage && <option value="ARCHIVED">Archived</option>}
        </select>
        <select value={typeFilter} onChange={event => setTypeFilter(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
          <option value="ALL">All Employment Types</option>
          <option value="FULL_TIME">Full Time</option>
          <option value="INTERNSHIP">Internship</option>
        </select>
      </div>

      {loadingJobs ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="animate-pulse rounded-2xl bg-gray-100 p-5 shadow-sm">
              <div className="mb-4 h-6 w-3/4 rounded bg-gray-300" />
              <div className="mb-3 h-4 w-full rounded bg-gray-200" />
              <div className="mb-3 h-4 w-5/6 rounded bg-gray-200" />
              <div className="h-10 w-1/2 rounded bg-gray-300" />
            </div>
          ))}
        </div>
      ) : filteredJobs.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredJobs.map(job => (
            <div key={job.job_id} ref={element => { if (element) jobRefs.current[job.job_id] = element; else delete jobRefs.current[job.job_id]; }} className={`rounded-2xl transition-all duration-300 ${highlightedJobId === String(job.job_id) ? "ring-2 ring-[#F6490D] ring-offset-4" : ""}`}>
              <JobCard job={job} canManage={canManage} actionLoading={actionLoading} onEdit={() => { setEditJob(job); setModalOpen(true); }} onAction={action => requestAction(job, action)} onReferralSubmitted={handleReferralSubmitted} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
          {jobs.length ? "No postings match your filters." : "No job postings available."}
        </div>
      )}

      {canManage && <JobFormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditJob(null); }} onSubmit={editJob ? handleEdit : handleCreate} onJobSaved={syncJob} onRefresh={() => fetchJobs(true)} job={editJob} />}

      <ConfirmActionModal isOpen={Boolean(confirmation)} job={confirmation?.job} action={confirmation?.action} loading={Boolean(actionLoading)} onClose={() => { if (!actionLock.current) setConfirmation(null); }} onConfirm={confirmAction} />

      <ReferralSuccessModal isOpen={Boolean(referralSuccess)} candidateName={referralSuccess?.candidateName} jobTitle={referralSuccess?.jobTitle} onClose={() => setReferralSuccess(null)} />
    </div>
  );
}

export default function JobVacancyPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading job postings...</div>}>
      <JobVacancyContent />
    </Suspense>
  );
}