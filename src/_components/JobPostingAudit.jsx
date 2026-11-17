'use client'
import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { useUser } from '@/context/UserContext'
import { X, Search, RefreshCw, Eye, History, BriefcaseBusiness, FileText, CalendarDays, Clock, Archive, CheckCircle2, Edit3, UserRound, ExternalLink, ChevronLeft, ChevronRight, Filter, ShieldCheck, ArrowRight, LockKeyhole, Loader2, Trash2, AlertTriangle } from 'lucide-react'

const API = '/api/admin-config/job-posting-audit'
const ADMIN_EMAILS = ['abhishek.ganguly@tor.ai', 'admin2@gmail.com', 'admin3@gmail.com']
const STATUS_LABELS = { DRAFT: 'Draft', OPEN: 'Open', CLOSED: 'Closed', ARCHIVED: 'Archived' }
const ACTION_LABELS = { CREATED: 'Created', UPDATED: 'Updated', PUBLISHED: 'Published', CLOSED: 'Closed', REOPENED: 'Reopened', ARCHIVED: 'Archived' }
const FIELD_LABELS = { job_title: 'Job Title', job_description: 'Job Description', work_experience: 'Work Experience', job_desc_document_url: 'Job Description Document', mode: 'Work Mode', location: 'Location', department: 'Department', department_id: 'Department', employment_type: 'Employment Type', education_summary: 'Education', key_skills: 'Key Skills', min_experience: 'Minimum Experience', max_experience: 'Maximum Experience', functional_background: 'Functional Background', preferred_industry: 'Preferred Industry', behavioural_attributes: 'Behavioural Attributes', closing_date: 'Closing Date' }

const formatDate = value => {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const formatDateOnly = value => {
  if (!value) return 'Not available'
  const parts = String(value).split('-')
  if (parts.length !== 3) return String(value)
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
const getError = (error, fallback) => {
  const data = error.response?.data
  return data?.error || data?.detail || (data && typeof data === 'object' ? Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' | ') : fallback)
}
const statusClass = status => ({
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  OPEN: 'bg-green-50 text-green-700 border-green-200',
  CLOSED: 'bg-red-50 text-red-700 border-red-200',
  ARCHIVED: 'bg-gray-100 text-gray-600 border-gray-200'
})[status] || 'bg-gray-100 text-gray-600 border-gray-200'
const actionClass = action => ({
  CREATED: 'bg-blue-50 text-blue-700',
  UPDATED: 'bg-violet-50 text-violet-700',
  PUBLISHED: 'bg-green-50 text-green-700',
  CLOSED: 'bg-red-50 text-red-700',
  REOPENED: 'bg-emerald-50 text-emerald-700',
  ARCHIVED: 'bg-gray-100 text-gray-700'
})[action] || 'bg-gray-100 text-gray-700'
const actionIcon = action => ({
  CREATED: BriefcaseBusiness, UPDATED: Edit3, PUBLISHED: CheckCircle2,
  CLOSED: LockKeyhole, REOPENED: RefreshCw, ARCHIVED: Archive
})[action] || History
const displayValue = value => {
  if (value === null || value === undefined || value === '') return 'Not specified'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function Badge({ status }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(status)}`}>{STATUS_LABELS[status] || status || 'Unknown'}</span>
}

function Info({ label, value }) {
  return <div className="min-w-0"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p><p className="whitespace-pre-wrap break-words text-sm text-gray-800">{value ?? 'Not available'}</p></div>
}

function Section({ title, icon: Icon, children }) {
  return <section className="rounded-xl border border-gray-200 bg-white p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900"><Icon size={18} className="text-[#F6490D]" />{title}</h3>{children}</section>
}

function AuditEvent({ event, index, total }) {
  const Icon = actionIcon(event.action)
  const changes = event.changes && typeof event.changes === 'object' ? Object.entries(event.changes) : []
  return (
    <div className="relative flex gap-4">
      {index < total - 1 && <div className="absolute bottom-0 left-[19px] top-10 w-0.5 bg-orange-100" />}
      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-[#F6490D]"><Icon size={18} /></div>
      <div className="mb-5 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${actionClass(event.action)}`}>{event.action_display || ACTION_LABELS[event.action] || event.action}</span><p className="mt-2 text-sm font-semibold text-gray-900">{event.performed_by?.name || 'Unknown employee'}</p><p className="mt-0.5 text-xs text-gray-500">{event.performed_by?.email || 'Employee information unavailable'}</p></div>
          <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={13} />{formatDate(event.created_at)}</span>
        </div>
        {(event.previous_status || event.new_status) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-3">
            {event.previous_status ? <Badge status={event.previous_status} /> : <span className="text-xs text-gray-500">Initial state</span>}
            <ArrowRight size={16} className="text-gray-400" />
            {event.new_status ? <Badge status={event.new_status} /> : <span className="text-xs text-gray-500">Not recorded</span>}
          </div>
        )}
        {changes.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{changes.length} Field{changes.length !== 1 ? 's' : ''} Modified</p>
            {changes.map(([field, value]) => {
              const oldValue = value && typeof value === 'object' && 'old' in value ? value.old : null
              const newValue = value && typeof value === 'object' && 'new' in value ? value.new : value
              return (
                <div key={field} className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="border-b bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">{FIELD_LABELS[field] || field.replaceAll('_', ' ')}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    <div className="border-b bg-red-50/40 p-3 sm:border-b-0 sm:border-r"><p className="mb-1 text-[11px] font-semibold uppercase text-red-600">Previous Value</p><p className="whitespace-pre-wrap break-all text-xs text-gray-700">{displayValue(oldValue)}</p></div>
                    <div className="bg-green-50/40 p-3"><p className="mb-1 text-[11px] font-semibold uppercase text-green-700">Updated Value</p><p className="whitespace-pre-wrap break-all text-xs text-gray-700">{displayValue(newValue)}</p></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function AuditDetails({ job, onDelete }) {
  const history = job.history || []
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 className="text-xl font-bold text-gray-900">{job.job_title}</h3><p className="mt-1 text-xs text-gray-500">Posting ID: {job.job_id}</p></div>
          <Badge status={job.status} />
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Department / SBU" value={job.department_name} />
          <Info label="Employment Type" value={job.employment_type?.replaceAll('_', ' ')} />
          <Info label="Work Mode" value={job.mode} />
          <Info label="Location" value={job.location} />
          <Info label="Created By" value={job.posted_by?.name} />
          <Info label="Employee ID" value={job.posted_by?.emp_id} />
          <Info label="Created On" value={formatDate(job.created_at)} />
          <Info label="Last Updated" value={formatDate(job.updated_at)} />
          <Info label="Closing Date" value={formatDateOnly(job.closing_date)} />
        </div>
      </div>

      <Section title="Job Description" icon={FileText}>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">{job.job_description || 'No description available.'}</p>
        {job.job_desc_document_url && <a href={job.job_desc_document_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#F6490D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d63f09]"><FileText size={16} /> View Job Description PDF <ExternalLink size={14} /></a>}
      </Section>

      <Section title="Job Requirements" icon={FileText}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Info label="Work Experience" value={job.work_experience} />
          <Info label="Education" value={job.education_summary} />
          <Info label="Minimum Experience" value={job.min_experience != null ? `${job.min_experience} years` : null} />
          <Info label="Maximum Experience" value={job.max_experience != null ? `${job.max_experience} years` : null} />
          <Info label="Key Skills" value={job.key_skills} />
          <Info label="Functional Background" value={job.functional_background} />
          <Info label="Preferred Industry" value={job.preferred_industry} />
          <Info label="Behavioural Attributes" value={job.behavioural_attributes} />
        </div>
      </Section>

      <Section title="Posting Lifecycle" icon={CalendarDays}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Info label="Created" value={formatDate(job.created_at)} />
          <Info label="First Published" value={formatDate(job.published_at)} />
          <Info label="Last Closed" value={formatDate(job.closed_at)} />
          <Info label="Archived" value={formatDate(job.archived_at)} />
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5"><div className="flex items-center gap-2 text-sm font-semibold text-blue-700"><UserRound size={18} /> Total Referrals</div><p className="mt-2 text-3xl font-bold text-blue-900">{job.referral_count ?? 0}</p></div>
        <div className="rounded-xl border border-orange-100 bg-orange-50 p-5"><div className="flex items-center gap-2 text-sm font-semibold text-orange-700"><History size={18} /> Recorded Audit Events</div><p className="mt-2 text-3xl font-bold text-orange-900">{job.history_count ?? history.length}</p></div>
      </div>

      <Section title="Complete Administrative Audit Trail" icon={History}>
        {history.length ? <div className="mt-2">{history.map((event, index) => <AuditEvent key={event.id} event={event} index={index} total={history.length} />)}</div> : <div className="py-8 text-center text-sm text-gray-500">No administrative actions have been recorded for this posting.</div>}
      </Section>

      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={22} className="mt-0.5 shrink-0 text-red-600" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-900">Danger Zone — Permanent Job Posting Deletion</h3>
            <p className="mt-2 text-xs leading-relaxed text-red-800">Permanently delete this job posting and its administrative audit history. Existing candidate referrals, SBU reviews, HR evaluations, and candidate CV references will be preserved. Job-specific notifications and legacy applications will be removed.</p>
            <button type="button" onClick={onDelete} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"><Trash2 size={16} /> Permanently Delete Job Posting</button>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-green-700" /><div><p className="text-sm font-semibold text-green-900">Administrative Audit Record</p><p className="mt-1 text-xs leading-relaxed text-green-800">Job posting information and lifecycle history are read-only. Permanent deletion is restricted to authorized administrators and requires explicit confirmation.</p></div></div>
    </div>
  )
}

function DeleteConfirmation({ job, deleting, onClose, onConfirm }) {
  const [titleInput, setTitleInput] = useState('')
  const [confirmationInput, setConfirmationInput] = useState('')
  const canDelete = titleInput.trim() === job.job_title.trim() && confirmationInput === 'DELETE' && !deleting

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 sm:p-6">
      <div role="dialog" aria-modal="true" aria-labelledby="delete-job-title" className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-5 py-4">
          <h2 id="delete-job-title" className="flex items-center gap-2 text-lg font-bold text-red-800"><AlertTriangle size={22} /> Permanently Delete Job Posting</h2>
          <button type="button" disabled={deleting} onClick={onClose} className="rounded-lg p-1.5 text-red-700 hover:bg-red-100 disabled:opacity-40"><X size={20} /></button>
        </div>
        <div className="space-y-5 p-5">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-sm font-bold text-red-900">This action cannot be undone.</p><p className="mt-2 text-xs leading-relaxed text-red-800">The job posting and its audit history will be permanently deleted. Associated notifications and legacy job applications will also be removed.</p></div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="break-words text-sm font-bold text-gray-900">{job.job_title}</p>
            <p className="mt-1 break-all text-xs text-gray-500">ID: {job.job_id}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 p-3"><p className="text-xs font-semibold text-green-700">Referrals Preserved</p><p className="mt-1 text-xl font-bold text-green-900">{job.referral_count ?? 0}</p></div>
              <div className="rounded-lg bg-red-50 p-3"><p className="text-xs font-semibold text-red-700">Audit Events Deleted</p><p className="mt-1 text-xl font-bold text-red-900">{job.history_count ?? job.history?.length ?? 0}</p></div>
            </div>
          </div>
          <div><label className="mb-2 block text-sm font-semibold text-gray-700">Type the exact job title to confirm:</label><p className="mb-2 break-words rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700">{job.job_title}</p><input type="text" value={titleInput} disabled={deleting} onChange={e => setTitleInput(e.target.value)} autoComplete="off" placeholder="Enter exact job title" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-red-500 disabled:opacity-50" /></div>
          <div><label className="mb-2 block text-sm font-semibold text-gray-700">Type <span className="font-bold text-red-600">DELETE</span> to permanently delete:</label><input type="text" value={confirmationInput} disabled={deleting} onChange={e => setConfirmationInput(e.target.value)} autoComplete="off" placeholder="DELETE" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-red-500 disabled:opacity-50" /></div>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" disabled={deleting} onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50">Cancel</button>
          <button type="button" disabled={!canDelete} onClick={() => onConfirm({ confirmation: confirmationInput, job_title: titleInput.trim() })} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">{deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}{deleting ? 'Deleting Permanently...' : 'Permanently Delete'}</button>
        </div>
      </div>
    </div>
  )
}

export default function JobPostingAudit({ onClose }) {
  const { user } = useUser()
  const isAdmin = ADMIN_EMAILS.some(email => email === (user?.email || '').trim().toLowerCase())
  const [jobs, setJobs] = useState([])
  const [summary, setSummary] = useState({ total: 0, draft: 0, open: 0, closed: 0, archived: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selected, setSelected] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [deleteJob, setDeleteJob] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchJobs = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return }
    setLoading(true)
    try {
      const { data } = await axios.get(API, { params: { search, status: statusFilter, action: actionFilter, start_date: startDate, end_date: endDate, page, page_size: 10 }, withCredentials: true })
      setJobs(data.results || [])
      setSummary(data.summary || { total: 0, draft: 0, open: 0, closed: 0, archived: 0 })
      setTotalPages(data.total_pages || 1)
      setTotalCount(data.count || 0)
    } catch (error) {
      setJobs([])
      toast.error(getError(error, 'Failed to load job posting audit records.'))
    } finally {
      setLoading(false)
    }
  }, [isAdmin, search, statusFilter, actionFilter, startDate, endDate, page])

  useEffect(() => {
    const timer = setTimeout(fetchJobs, 300)
    return () => clearTimeout(timer)
  }, [fetchJobs])

  useEffect(() => { setPage(1) }, [search, statusFilter, actionFilter, startDate, endDate])

  const openDetails = async jobId => {
    if (detailsLoading || deleting) return
    setDetailsLoading(true)
    try {
      const { data } = await axios.get(`${API}/${jobId}`, { withCredentials: true })
      setSelected(data)
    } catch (error) {
      toast.error(getError(error, 'Failed to load job posting audit details.'))
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleDelete = async payload => {
    if (!deleteJob || deleting || !isAdmin) return
    setDeleting(true)
    try {
      const { data } = await axios.delete(`${API}/${deleteJob.job_id}`, { data: payload, withCredentials: true })
      toast.success(data.message || 'Job posting permanently deleted.')
      setDeleteJob(null)
      setSelected(null)
      if (page > 1 && jobs.length === 1) setPage(value => value - 1)
      else await fetchJobs()
    } catch (error) {
      toast.error(getError(error, 'Failed to permanently delete job posting.'))
    } finally {
      setDeleting(false)
    }
  }

  const stats = [
    { label: 'Total Postings', value: summary.total, icon: BriefcaseBusiness, color: 'bg-blue-50 text-blue-600' },
    { label: 'Draft', value: summary.draft, icon: FileText, color: 'bg-amber-50 text-amber-600' },
    { label: 'Open', value: summary.open, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
    { label: 'Closed', value: summary.closed, icon: LockKeyhole, color: 'bg-red-50 text-red-600' },
    { label: 'Archived', value: summary.archived, icon: Archive, color: 'bg-gray-100 text-gray-600' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-2xl">
        <div className="flex items-center justify-between border-b bg-white px-5 py-4">
          <div><h2 className="flex items-center gap-2 text-xl font-bold text-gray-900"><History size={22} className="text-[#F6490D]" /> Job Posting Audit Trail</h2><p className="mt-1 text-xs text-gray-500">Administrative lifecycle history • All posting statuses • Admin-only permanent deletion</p></div>
          <button type="button" disabled={deleting} onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50" aria-label="Close job posting audit"><X size={22} /></button>
        </div>

        {!isAdmin ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><ShieldCheck size={44} className="mb-3 text-red-500" /><h3 className="text-lg font-bold text-gray-900">Access Restricted</h3><p className="mt-2 text-sm text-gray-500">Only authorized administrators can access job posting audit records.</p></div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
              {stats.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-gray-500">{label}</span><span className={`rounded-lg p-2 ${color}`}><Icon size={18} /></span></div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700"><Filter size={16} className="text-[#F6490D]" /> Search & Filters</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="relative md:col-span-2"><Search size={17} className="absolute left-3 top-3 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, department, creator, location..." className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-400" /></div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400"><option value="ALL">All Statuses</option><option value="DRAFT">Draft</option><option value="OPEN">Open</option><option value="CLOSED">Closed</option><option value="ARCHIVED">Archived</option></select>
                <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400"><option value="ALL">All Actions</option>{Object.entries(ACTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                <div><label className="mb-1 block text-xs font-medium text-gray-500">Created From</label><input type="date" value={startDate} max={endDate || undefined} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400" /></div>
                <div><label className="mb-1 block text-xs font-medium text-gray-500">Created Until</label><input type="date" value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400" /></div>
                <div className="flex items-end gap-2 md:col-span-2">
                  <button type="button" onClick={fetchJobs} disabled={loading || deleting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
                  <button type="button" onClick={() => { setSearch(''); setStatusFilter('ALL'); setActionFilter('ALL'); setStartDate(''); setEndDate(''); setPage(1) }} disabled={deleting} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Clear Filters</button>
                </div>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold text-gray-700">{totalCount} posting{totalCount !== 1 ? 's' : ''} found</p><p className="text-xs text-gray-500">Page {page} of {totalPages}</p></div>
            {loading ? (
              <div className="flex items-center justify-center gap-3 rounded-xl border bg-white py-20 text-gray-500"><Loader2 size={22} className="animate-spin text-[#F6490D]" /> Loading audit records...</div>
            ) : jobs.length === 0 ? (
              <div className="rounded-xl border bg-white py-20 text-center"><History size={42} className="mx-auto mb-3 text-gray-300" /><p className="font-semibold text-gray-700">No job postings found</p><p className="mt-1 text-sm text-gray-500">Try adjusting your filters or create a job posting first.</p></div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-4 font-semibold">Job Posting</th><th className="px-4 py-4 font-semibold">Department</th><th className="px-4 py-4 font-semibold">Status</th><th className="px-4 py-4 font-semibold">Created By</th><th className="px-4 py-4 font-semibold">Referrals</th><th className="px-4 py-4 font-semibold">Last Updated</th><th className="px-4 py-4 font-semibold">Action</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {jobs.map(job => (
                        <tr key={job.job_id} className="transition-colors hover:bg-orange-50/30">
                          <td className="px-4 py-4"><p className="max-w-[220px] truncate font-semibold text-gray-900">{job.job_title}</p><p className="mt-1 text-xs text-gray-500">{job.employment_type?.replaceAll('_', ' ') || 'Not specified'}</p></td>
                          <td className="px-4 py-4 text-gray-700">{job.department_name || 'Not assigned'}</td>
                          <td className="px-4 py-4"><Badge status={job.status} /></td>
                          <td className="px-4 py-4"><p className="font-medium text-gray-800">{job.posted_by?.name || 'Unknown'}</p><p className="text-xs text-gray-500">{job.posted_by?.emp_id || ''}</p></td>
                          <td className="px-4 py-4"><span className="rounded-lg bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">{job.referral_count ?? 0}</span></td>
                          <td className="px-4 py-4 text-xs text-gray-600">{formatDate(job.updated_at)}</td>
                          <td className="px-4 py-4"><button type="button" disabled={detailsLoading || deleting} onClick={() => openDetails(job.job_id)} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-[#F6490D] disabled:opacity-50"><Eye size={15} /> View Audit</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between rounded-xl border bg-white px-4 py-3">
                <p className="text-xs text-gray-500">Showing page {page} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={page <= 1 || loading || deleting} onClick={() => setPage(value => Math.max(1, value - 1))} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft size={16} /> Previous</button>
                  <button type="button" disabled={page >= totalPages || loading || deleting} onClick={() => setPage(value => Math.min(totalPages, value + 1))} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40">Next <ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 sm:p-6">
          <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-2xl">
            <div className="flex items-center justify-between border-b bg-white px-5 py-4">
              <div><h2 className="flex items-center gap-2 text-lg font-bold text-gray-900"><History size={20} className="text-[#F6490D]" /> Job Posting Audit Details</h2><p className="mt-1 text-xs text-gray-500">Complete posting information and administrative history</p></div>
              <button type="button" disabled={deleting} onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50" aria-label="Close audit details"><X size={22} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6"><AuditDetails job={selected} onDelete={() => setDeleteJob(selected)} /></div>
          </div>
        </div>
      )}
      {deleteJob && <DeleteConfirmation key={deleteJob.job_id} job={deleteJob} deleting={deleting} onClose={() => { if (!deleting) setDeleteJob(null) }} onConfirm={handleDelete} />}
    </div>
  )
}