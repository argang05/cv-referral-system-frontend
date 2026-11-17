'use client'
import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { useUser } from '@/context/UserContext'
import {
  X, Search, RefreshCw, FileText, Eye, Trash2, Users,
  CheckCircle2, XCircle, UserRound, GraduationCap,
  History, ShieldAlert, ExternalLink, ChevronDown, ChevronUp,
  BriefcaseBusiness, CalendarDays, ClipboardCheck, Clock, Lock
} from 'lucide-react'

const API = '/api/admin-config/completed-referrals'
const ADMIN_EMAILS = ['abhishek.ganguly@tor.ai', 'admin2@gmail.com', 'admin3@gmail.com']
const OFFER_OUTCOME_LABELS = { OFFER_DECLINED: 'Offer Declined', DID_NOT_JOIN: 'Did Not Join', JOINED: 'Joined' }

const formatDate = (value) => {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const formatJoiningDate = (value) => {
  if (!value) return 'Not available'
  const parts = String(value).split('-')
  if (parts.length !== 3) return String(value)
  const [year, month, day] = parts.map(Number)
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return String(value)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

const getError = (error, fallback) => error.response?.data?.error || error.response?.data?.detail || fallback

const decisionLabel = (status) => {
  if (status === 'FINAL_ACCEPTED' || status === 'ACCEPTED') return 'Selected'
  if (status === 'FINAL_REJECTED' || status === 'REJECTED') return 'Rejected'
  if (status === 'IN_PROGRESS') return 'In Progress'
  return status || 'Unknown'
}

const candidateTypeLabel = (type) => ({
  INTERN_FRESHER: 'Internship - Fresher',
  INTERN_EXPERIENCED: 'Internship - Experienced',
  FULL_TIME_FRESHER: 'Full Time - Fresher',
  FULL_TIME_EXPERIENCED: 'Full Time - Experienced'
})[type] || type || 'Not available'

const stageLabel = (stage) => ({
  TEST: 'Test', T1: 'Technical Round 1', T2: 'Technical Round 2',
  T3: 'Technical Round 3', HR: 'HR Round', OTHER: 'Other Reason'
})[stage] || stage || 'Not applicable'

const offerOutcomeLabel = (outcome) => OFFER_OUTCOME_LABELS[outcome] || (outcome ? String(outcome).replaceAll('_', ' ') : 'Not recorded')

const getOfferStatus = (evaluation) => {
  if (!evaluation || evaluation.status !== 'ACCEPTED') return 'Not applicable'
  if (!evaluation.offer_released) return 'Offer Not Released'
  if (!evaluation.offer_outcome) return 'Offer Released — Awaiting Outcome'
  return offerOutcomeLabel(evaluation.offer_outcome)
}

const offerBadgeClass = (outcome) => {
  if (outcome === 'JOINED') return 'bg-green-100 text-green-800 border-green-200'
  if (outcome === 'OFFER_DECLINED' || outcome === 'DID_NOT_JOIN') return 'bg-red-100 text-red-800 border-red-200'
  return 'bg-amber-100 text-amber-800 border-amber-200'
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="break-words whitespace-pre-wrap text-sm text-gray-800">{value ?? 'Not available'}</p>
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
        <Icon size={18} className="text-orange-600" />{title}
      </h3>
      {children}
    </section>
  )
}

function HistoryItem({ title, subtitle, comment, badge, badgeClass, children }) {
  return (
    <div className="border-l-2 border-orange-200 py-2 pl-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass || 'bg-gray-100 text-gray-700'}`}>{badge}</span>
      </div>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-700">{comment || 'No comment'}</p>
      {children}
    </div>
  )
}

function OfferDetails({ evaluation, isHistory = false }) {
  if (!evaluation || evaluation.status !== 'ACCEPTED') return null
  const outcome = evaluation.offer_outcome
  const offerReleased = Boolean(evaluation.offer_released)
  return (
    <div className={`rounded-xl border ${isHistory ? 'mt-3 bg-gray-50 p-3' : 'bg-orange-50/40 p-4 sm:p-5'} border-orange-200`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <ClipboardCheck size={17} className="text-orange-600" />
          {isHistory ? 'Offer Details at This Revision' : 'Final Offer & Joining Details'}
        </h4>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${offerBadgeClass(outcome)}`}>
          {getOfferStatus(evaluation)}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Info label="Offer Released" value={offerReleased ? 'Yes' : 'No'} />
        <Info label="Offer Outcome" value={offerReleased ? (outcome ? offerOutcomeLabel(outcome) : 'Awaiting Outcome') : 'Not applicable'} />
        {outcome === 'JOINED' && (
          <Info label="Date of Joining" value={formatJoiningDate(evaluation.joining_date)} />
        )}
      </div>
      {!isHistory && offerReleased && outcome === 'JOINED' && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>The candidate has joined. The recorded joining date is <strong>{formatJoiningDate(evaluation.joining_date)}</strong>.</p>
        </div>
      )}
      {!isHistory && offerReleased && outcome === 'OFFER_DECLINED' && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <XCircle size={18} className="mt-0.5 shrink-0" />
          <p>The candidate was selected by HR but subsequently declined the offer.</p>
        </div>
      )}
      {!isHistory && offerReleased && outcome === 'DID_NOT_JOIN' && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <XCircle size={18} className="mt-0.5 shrink-0" />
          <p>The candidate was selected by HR and an offer was released, but the candidate did not join.</p>
        </div>
      )}
      {!isHistory && !offerReleased && (
        <p className="mt-3 text-xs text-amber-700">No offer release was recorded for this evaluation.</p>
      )}
    </div>
  )
}

function AuditDetails({ referral, onDelete, isAdmin }) {
  const [showSbuHistory, setShowSbuHistory] = useState(true)
  const [showHrHistory, setShowHrHistory] = useState(true)
  const evaluation = referral.hr_evaluation
  const sbuHistory = referral.review_history || []
  const hrHistory = referral.hr_evaluation_history || []
  const isFresher = referral.candidate_type?.endsWith('_FRESHER')
  const isSelected = evaluation?.status === 'ACCEPTED'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-gray-50 p-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{referral.candidate_name}</h3>
          <p className="text-sm text-gray-500">{candidateTypeLabel(referral.candidate_type)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${isSelected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {decisionLabel(evaluation?.status)}
          </span>
          {isSelected && (
            <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${offerBadgeClass(evaluation?.offer_outcome)}`}>
              {getOfferStatus(evaluation)}
            </span>
          )}
        </div>
      </div>

      <Section title="Candidate Information" icon={UserRound}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Info label="Candidate Name" value={referral.candidate_name} />
          <Info label="Candidate Type" value={candidateTypeLabel(referral.candidate_type)} />
          <Info label="Email" value={referral.candidate_email} />
          <Info label="Phone" value={referral.candidate_phone} />
          <Info label="Referral Reason" value={referral.referral_reason_type?.replaceAll('_', ' ')} />
          <Info label="Submitted On" value={formatDate(referral.submitted_at)} />
          <Info label="Referrer" value={referral.referrer?.name} />
          <Info label="Referrer Employee ID" value={referral.referrer?.emp_id} />
          <Info label="Referrer Email" value={referral.referrer?.email} />
          <Info label="Assigned SBUs" value={referral.sbus?.map(s => s.name).join(', ') || 'Not available'} />
        </div>
        {referral.additional_comment && (
          <div className="mt-4"><Info label="Additional Comments" value={referral.additional_comment} /></div>
        )}
        {referral.cv_url && (
          <a href={referral.cv_url} target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
            <FileText size={16} /> View Candidate CV <ExternalLink size={14} />
          </a>
        )}
      </Section>

      {isFresher && (
        <Section title="Finalized Academic Details" icon={GraduationCap}>
          {referral.academic_details_status === 'COMPLETED' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Info label="Class 10 Percentage" value={referral.tenth_percentage != null ? `${referral.tenth_percentage}%` : null} />
              <Info label="Class 12 Percentage" value={referral.twelfth_percentage != null ? `${referral.twelfth_percentage}%` : null} />
              <Info label="Graduation CGPA" value={referral.graduation_cgpa} />
            </div>
          ) : <p className="text-sm text-gray-500">Academic details not finalized.</p>}
        </Section>
      )}

      <Section title="Latest SBU Review" icon={Users}>
        {referral.review ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Info label="Decision" value={referral.review.decision} />
            <Info label="Reviewed By" value={referral.review.reviewed_by?.name} />
            <Info label="Reviewed On" value={formatDate(referral.review.reviewed_at)} />
            <Info label="Comment" value={referral.review.comment} />
          </div>
        ) : <p className="text-sm text-gray-500">No SBU review available.</p>}
      </Section>

      <Section title="Final HR Evaluation" icon={BriefcaseBusiness}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Info label="Final Decision" value={decisionLabel(evaluation?.status)} />
          <Info label="Rejection Stage" value={evaluation?.status === 'REJECTED' ? stageLabel(evaluation?.stage) : 'Not applicable'} />
          <Info label="Last Updated By" value={evaluation?.updated_by} />
          <Info label="Last Updated On" value={formatDate(evaluation?.updated_at)} />
          <Info label="Finalized By" value={referral.finalized_by?.name} />
          <Info label="Finalized On" value={formatDate(referral.finalized_at)} />
          <Info label="Evaluation Status" value="Completed & Permanently Locked" />
          <Info label="Final Comment" value={evaluation?.comment} />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-800">
          <Lock size={15} className="shrink-0" /> This HR evaluation has been finalized and permanently locked.
        </div>
      </Section>

      {isSelected && (
        <Section title="Final Offer & Joining Details" icon={CalendarDays}>
          <OfferDetails evaluation={evaluation} />
        </Section>
      )}

      <Section title="Complete SBU Review History" icon={History}>
        <button type="button" onClick={() => setShowSbuHistory(v => !v)}
          className="mb-3 flex w-full cursor-pointer items-center justify-between text-sm font-semibold text-gray-700"
          aria-expanded={showSbuHistory}>
          <span>{sbuHistory.length} recorded review(s)</span>
          {showSbuHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showSbuHistory && (
          <div className="space-y-3">
            {sbuHistory.length ? sbuHistory.map(item => (
              <HistoryItem key={item.id}
                title={item.reviewed_by?.name || 'Unknown reviewer'}
                subtitle={`${item.reviewed_by?.email || ''} • ${formatDate(item.reviewed_at)}`}
                comment={item.comment}
                badge={item.decision}
                badgeClass={item.decision === 'CONSIDERED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
              />
            )) : <p className="text-sm text-gray-500">No SBU history recorded.</p>}
          </div>
        )}
      </Section>

      <Section title="Complete HR Evaluation History" icon={History}>
        <button type="button" onClick={() => setShowHrHistory(v => !v)}
          className="mb-3 flex w-full cursor-pointer items-center justify-between text-sm font-semibold text-gray-700"
          aria-expanded={showHrHistory}>
          <span>{hrHistory.length} recorded revision(s)</span>
          {showHrHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showHrHistory && (
          <div className="space-y-3">
            {hrHistory.length ? hrHistory.map(item => (
              <HistoryItem key={item.id}
                title={`Revision ${item.revision} • ${item.updated_by?.name || 'Unknown HR employee'}`}
                subtitle={`${formatDate(item.created_at)} • ${item.action === 'FINALIZE' ? 'Finalized & Locked' : 'Saved Draft'} • ${stageLabel(item.stage)}`}
                comment={item.comment}
                badge={decisionLabel(item.status)}
                badgeClass={item.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : item.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                {item.status === 'ACCEPTED' && <OfferDetails evaluation={item} isHistory />}
              </HistoryItem>
            )) : <p className="text-sm text-gray-500">No HR history recorded.</p>}
          </div>
        )}
      </Section>

      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="mb-2 flex items-center gap-2 font-semibold text-red-700">
          <ShieldAlert size={18} /> Administrative Danger Zone
        </div>
        <p className="mb-4 text-sm text-red-700">
          Permanently deleting this referral also removes its SBU reviews, HR evaluations, and evaluation history from the database. This cannot be undone.
        </p>
        <button type="button" onClick={onDelete} disabled={!isAdmin}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
          <Trash2 size={16} /> Permanently Delete Referral
        </button>
        {!isAdmin && (
          <p className="mt-2 text-xs text-red-600">Only authorized administrators can perform this action.</p>
        )}
      </div>
    </div>
  )
}

export default function CompletedReferrals({ onClose }) {
  const { user } = useUser()
  const [referrals, setReferrals] = useState([])
  const [summary, setSummary] = useState({ total_completed: 0, selected: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [decision, setDecision] = useState('ALL')
  const [selected, setSelected] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteName, setDeleteName] = useState('')
  const [deleteKeyword, setDeleteKeyword] = useState('')
  const [deleting, setDeleting] = useState(false)

  const isAdmin = ADMIN_EMAILS.some(email => email.toLowerCase() === (user?.email || '').trim().toLowerCase())

  const fetchReferrals = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(API, { params: { search, decision }, withCredentials: true })
      setReferrals(data.results || [])
      setSummary(data.summary || { total_completed: 0, selected: 0, rejected: 0 })
    } catch (error) {
      toast.error(getError(error, 'Failed to load completed referrals.'))
    } finally {
      setLoading(false)
    }
  }, [search, decision])

  useEffect(() => {
    const timer = setTimeout(fetchReferrals, 300)
    return () => clearTimeout(timer)
  }, [fetchReferrals])

  const openDetails = async (referralId) => {
    if (detailsLoading) return
    setDetailsLoading(true)
    try {
      const { data } = await axios.get(`${API}/${referralId}`, { withCredentials: true })
      setSelected(data)
    } catch (error) {
      toast.error(getError(error, 'Failed to load referral details.'))
    } finally {
      setDetailsLoading(false)
    }
  }

  const closeDetails = () => {
    if (deleting) return
    setSelected(null)
    setDeleteOpen(false)
    setDeleteName('')
    setDeleteKeyword('')
  }

  const openDelete = () => {
    if (!isAdmin) {
      toast.error('Access denied. Only administrators can permanently delete referrals.')
      return
    }
    if (!selected || deleting) return
    setDeleteName('')
    setDeleteKeyword('')
    setDeleteOpen(true)
  }

  const closeDetailsAfterDelete = () => {
    setSelected(null)
    setDeleteOpen(false)
    setDeleteName('')
    setDeleteKeyword('')
  }

  const confirmDelete = async () => {
    if (!isAdmin) {
      toast.error('Access denied. Administrator privileges are required.')
      return
    }
    if (!selected || deleting) return
    if (deleteKeyword !== 'DELETE' || deleteName.trim() !== selected.candidate_name.trim()) {
      toast.error('Enter DELETE and the exact candidate name to continue.')
      return
    }
    setDeleting(true)
    try {
      await axios.delete(`${API}/${selected.id}`, {
        withCredentials: true,
        data: { confirmation: 'DELETE', candidate_name: deleteName }
      })
      toast.success('Referral and its related database records permanently deleted.')
      closeDetailsAfterDelete()
      await fetchReferrals()
    } catch (error) {
      toast.error(getError(error, 'Failed to delete referral.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-2xl">
        <div className="flex items-center justify-between border-b bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Completed Referrals & Audit Trail</h2>
            <p className="mt-1 text-xs text-gray-500">HR-finalized referrals • Read-only recruitment records</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close completed referrals">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Total Completed', value: summary.total_completed, icon: Users, color: 'text-blue-600 bg-blue-50' },
              { label: 'Selected', value: summary.selected, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
              { label: 'Rejected', value: summary.rejected, icon: XCircle, color: 'text-red-600 bg-red-50' }
            ].map(item => (
              <div key={item.label} className="flex items-center gap-4 rounded-xl border bg-white p-4">
                <div className={`rounded-xl p-3 ${item.color}`}><item.icon size={22} /></div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search candidate, email, referrer..."
                className="w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-orange-200" />
            </div>
            <select value={decision} onChange={e => setDecision(e.target.value)}
              className="rounded-lg border bg-white px-4 py-2.5 outline-none">
              <option value="ALL">All Decisions</option>
              <option value="ACCEPTED">Selected</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button type="button" onClick={fetchReferrals}
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-white hover:bg-gray-800">
              <RefreshCw size={17} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-500">Loading completed referrals...</div>
          ) : referrals.length === 0 ? (
            <div className="rounded-xl border bg-white py-20 text-center">
              <FileText size={42} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-700">No completed referrals found</p>
              <p className="mt-1 text-sm text-gray-500">Finalized HR evaluations will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {referrals.map(referral => {
                const selectedStatus = referral.hr_evaluation?.status === 'ACCEPTED'
                return (
                  <div key={referral.id} className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold text-gray-900">{referral.candidate_name}</h3>
                        <p className="mt-1 text-xs text-gray-500">{candidateTypeLabel(referral.candidate_type)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {selectedStatus ? 'Selected' : 'Rejected'}
                        </span>
                        {selectedStatus && (
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${offerBadgeClass(referral.hr_evaluation?.offer_outcome)}`}>
                            {getOfferStatus(referral.hr_evaluation)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                      <Info label="Referrer" value={referral.referrer?.name} />
                      <Info label="Finalized By" value={referral.finalized_by?.name} />
                      <Info label="Finalized On" value={formatDate(referral.finalized_at)} />
                      <Info label="Submitted On" value={formatDate(referral.submitted_at)} />
                    </div>
                    {selectedStatus && referral.hr_evaluation?.offer_outcome === 'JOINED' && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-800">
                        <CalendarDays size={15} /> Joined on {formatJoiningDate(referral.hr_evaluation.joining_date)}
                      </div>
                    )}
                    <button type="button" disabled={detailsLoading}
                      onClick={() => openDetails(referral.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50">
                      <Eye size={17} /> View Complete Audit Trail
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 sm:p-6">
          <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-2xl">
            <div className="flex items-center justify-between border-b bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Referral Audit Trail</h2>
                <p className="text-xs text-gray-500">Read-only • Finalized recruitment record</p>
              </div>
              <button type="button" onClick={closeDetails} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close audit details">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <AuditDetails referral={selected} onDelete={openDelete} isAdmin={isAdmin} />
            </div>
          </div>
        </div>
      )}

      {deleteOpen && selected && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3 text-red-600">
              <ShieldAlert size={28} />
              <h3 className="text-xl font-bold">Permanently Delete Referral?</h3>
            </div>
            <p className="mb-3 text-sm text-gray-700">
              You are about to permanently delete <strong>{selected.candidate_name}</strong> and all associated recruitment history.
            </p>
            <p className="mb-5 text-sm font-semibold text-red-700">
              This action cannot be undone. The complete audit trail will be lost.
            </p>
            <label className="mb-2 block text-xs font-semibold text-gray-600">Enter the exact candidate name</label>
            <input value={deleteName} onChange={e => setDeleteName(e.target.value)}
              className="mb-4 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-red-200"
              placeholder={selected.candidate_name} disabled={deleting} />
            <label className="mb-2 block text-xs font-semibold text-gray-600">Type DELETE to confirm</label>
            <input value={deleteKeyword} onChange={e => setDeleteKeyword(e.target.value)}
              className="mb-6 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-red-200"
              placeholder="DELETE" disabled={deleting} />
            <div className="flex justify-end gap-3">
              <button type="button" disabled={deleting} onClick={() => setDeleteOpen(false)}
                className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={confirmDelete}
                disabled={deleting || deleteKeyword !== 'DELETE' || deleteName.trim() !== selected.candidate_name.trim()}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">
                <Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}