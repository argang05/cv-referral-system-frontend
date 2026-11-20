'use client'

import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { useUser } from '@/context/UserContext'
import {
  X, Search, RefreshCw, Eye, History, ArrowRightLeft, CalendarDays,
  Clock, CheckCircle2, XCircle, UserRound, ChevronLeft, ChevronRight,
  Filter, ShieldCheck, ArrowRight, Loader2, Trash2, AlertTriangle,
  ClipboardList, Building2, Send, FileText
} from 'lucide-react'

const API = '/api/admin-config/ijr'
const ADMIN_EMAILS = ['abhishek.ganguly@tor.ai', 'admin2@gmail.com', 'admin3@gmail.com']
const PAGE_SIZE = 10

const STATUS_LABELS = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved for Implementation',
  REJECTED: 'Rejected for Implementation',
  IMPLEMENTED: 'Implemented',
  CANCELLED: 'Cancelled'
}

const STATUS_STYLES = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  APPROVED: 'border-green-200 bg-green-50 text-green-700',
  REJECTED: 'border-red-200 bg-red-50 text-red-700',
  IMPLEMENTED: 'border-blue-200 bg-blue-50 text-blue-700',
  CANCELLED: 'border-gray-200 bg-gray-100 text-gray-600'
}

const formatDate = value => {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
}

const formatDateOnly = value => {
  if (!value) return 'Not specified'
  const parts = String(value).split('-')
  if (parts.length !== 3) return String(value)
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
}

const getError = (error, fallback) => {
  const data = error.response?.data
  if (typeof data?.error === 'string') return data.error
  if (typeof data?.detail === 'string') return data.detail
  if (data && typeof data === 'object') {
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
      .join(' | ')
  }
  return fallback
}

const displayValue = value => {
  if (value === null || value === undefined || value === '') return 'Not specified'
  return String(value)
}

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || 'border-gray-200 bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status || 'Unknown'}
    </span>
  )
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="whitespace-pre-wrap break-words text-sm text-gray-800">{displayValue(value)}</p>
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
        <Icon size={18} className="text-[#F6490D]" />
        {title}
      </h3>
      {children}
    </section>
  )
}

function DetailComparison({ current, proposed }) {
  const fields = [
    ['sub_bu', 'SBU / Business Unit'],
    ['reporting_manager_name', 'Reporting Manager'],
    ['reporting_manager_emp_id', 'Reporting Manager ID'],
    ['designation', 'Designation'],
    ['band', 'Band']
  ]

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="grid grid-cols-[minmax(110px,1fr)_minmax(130px,1.5fr)_minmax(130px,1.5fr)] border-b bg-gray-50 text-xs font-semibold text-gray-600">
        <div className="p-3">Field</div>
        <div className="border-l p-3">Current Details</div>
        <div className="border-l p-3">Proposed Details</div>
      </div>

      {fields.map(([field, label]) => {
        const oldValue = current?.[field]
        const newValue = proposed?.[field]
        const changed = String(oldValue || '') !== String(newValue || '')

        return (
          <div key={field} className="grid grid-cols-[minmax(110px,1fr)_minmax(130px,1.5fr)_minmax(130px,1.5fr)] border-b text-sm last:border-b-0">
            <div className="break-words bg-gray-50/60 p-3 text-xs font-semibold text-gray-700">{label}</div>
            <div className={`break-words border-l p-3 ${changed ? 'bg-red-50/40' : ''}`}>
              {displayValue(oldValue)}
            </div>
            <div className={`break-words border-l p-3 ${changed ? 'bg-green-50/50 font-medium text-green-800' : ''}`}>
              {displayValue(newValue)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AuditEvent({ event, index, total }) {
  const approved = event.action === 'APPROVED'
  const Icon = approved ? CheckCircle2 : XCircle

  return (
    <div className="relative flex gap-4">
      {index < total - 1 && (
        <div className="absolute bottom-0 left-[19px] top-10 w-0.5 bg-orange-100" />
      )}

      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-[#F6490D]">
        <Icon size={18} />
      </div>

      <div className="mb-5 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Badge status={event.action} />
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {event.performed_by_name || 'Unknown administrator'}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock size={13} />
            {formatDate(event.created_at)}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-3">
          <Badge status={event.previous_status} />
          <ArrowRight size={16} className="text-gray-400" />
          <Badge status={event.new_status} />
        </div>

        {event.remarks && (
          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-gray-500">Decision Remarks</p>
            <p className="whitespace-pre-wrap break-words text-sm text-gray-700">{event.remarks}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function NominationDetails({ nomination, history, onApprove, onReject, onDelete }) {
  const pending = nomination.status === 'PENDING'

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{nomination.employee_name}</h3>
            <p className="mt-1 text-xs text-gray-500">Employee ID: {nomination.employee_emp_id}</p>
            <p className="mt-1 break-all text-xs text-gray-400">Nomination ID: {nomination.id}</p>
          </div>
          <Badge status={nomination.status} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Nominated By" value={nomination.nominated_by_name} />
          <Info label="Nominating HR ID" value={nomination.nominated_by_emp_id} />
          <Info label="Effective Date" value={formatDateOnly(nomination.effective_date)} />
          <Info label="Submitted On" value={formatDate(nomination.created_at)} />
          <Info label="Last Updated" value={formatDate(nomination.updated_at)} />
          <Info label="Current Status" value={STATUS_LABELS[nomination.status]} />
        </div>
      </div>

      <Section title="Current vs Proposed Organizational Details" icon={ArrowRightLeft}>
        <p className="mb-4 text-xs text-gray-500">
          Highlighted fields indicate changes requested by HR. These are proposals only; approval does not update employee records.
        </p>
        <div className="overflow-x-auto">
          <div className="min-w-[550px]">
            <DetailComparison
              current={nomination.current_details}
              proposed={nomination.proposed_details}
            />
          </div>
        </div>
      </Section>

      <Section title="Nomination Justification" icon={FileText}>
        <Info label="Reason for Rotation" value={nomination.reason} />
        <div className="mt-5">
          <Info label="Additional HR Remarks" value={nomination.remarks} />
        </div>
      </Section>

      {nomination.status !== 'PENDING' && (
        <Section title="Administrative Decision" icon={ShieldCheck}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Info label="Decision" value={STATUS_LABELS[nomination.status]} />
            <Info label="Decided By" value={nomination.decided_by_name} />
            <Info label="Decision Date" value={formatDate(nomination.decided_at)} />
          </div>
          <div className="mt-4">
            <Info label="Decision Remarks" value={nomination.decision_remarks} />
          </div>
        </Section>
      )}

      <Section title="Administrative Audit Trail" icon={History}>
        {history.length ? (
          <div className="mt-2">
            {history.map((event, index) => (
              <AuditEvent
                key={event.id}
                event={event}
                index={index}
                total={history.length}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-500">
            No administrative decisions have been recorded yet.
          </div>
        )}
      </Section>

      {pending && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <ClipboardList size={19} className="text-[#F6490D]" />
            Administrative Review
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-gray-600">
            Review the proposed organizational changes before making a decision.
            Approval only marks the nomination as approved for implementation.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              <CheckCircle2 size={17} />
              Approve for Implementation
            </button>
            <button
              type="button"
              onClick={onReject}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <XCircle size={17} />
              Reject for Implementation
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={22} className="mt-0.5 shrink-0 text-red-600" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-900">
              Danger Zone — Permanent Nomination Deletion
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-red-800">
              Permanently delete this nomination, its administrative history, and all associated
              IJR notifications, including notification recipients and read records.
              Employee organizational information will remain unchanged.
            </p>
            <button
              type="button"
              onClick={onDelete}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <Trash2 size={16} />
              Permanently Delete Nomination
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-green-700" />
        <div>
          <p className="text-sm font-semibold text-green-900">Administrative Access Control</p>
          <p className="mt-1 text-xs leading-relaxed text-green-800">
            Only authorized IJR administrators can approve, reject, or permanently delete nominations.
            All decisions are recorded in the nomination's audit history.
          </p>
        </div>
      </div>
    </div>
  )
}

function DecisionConfirmation({ nomination, action, submitting, onClose, onConfirm }) {
  const [remarks, setRemarks] = useState('')
  const approved = action === 'APPROVED'
  const canSubmit = !submitting && (approved || remarks.trim().length > 0)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ijr-decision-title"
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className={`flex items-center justify-between border-b px-5 py-4 ${approved ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
          <h2 id="ijr-decision-title" className={`flex items-center gap-2 text-lg font-bold ${approved ? 'text-green-800' : 'text-red-800'}`}>
            {approved ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
            {approved ? 'Approve for Implementation' : 'Reject for Implementation'}
          </h2>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/70 disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-bold text-gray-900">{nomination.employee_name}</p>
            <p className="mt-1 text-xs text-gray-500">Employee ID: {nomination.employee_emp_id}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-700">
              <span>{displayValue(nomination.current_details?.sub_bu)}</span>
              <ArrowRight size={15} className="text-[#F6490D]" />
              <span className="font-semibold">{displayValue(nomination.proposed_details?.sub_bu)}</span>
            </div>
          </div>

          <div className={`rounded-lg border p-4 ${approved ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <p className={`text-sm font-semibold ${approved ? 'text-green-900' : 'text-red-900'}`}>
              {approved ? 'Confirm approval?' : 'Confirm rejection?'}
            </p>
            <p className={`mt-2 text-xs leading-relaxed ${approved ? 'text-green-800' : 'text-red-800'}`}>
              {approved
                ? 'This nomination will be marked as Approved for Implementation. Employee organizational details will not be modified.'
                : 'This nomination will be marked as Rejected for Implementation. A rejection reason is mandatory.'}
              {' '}The initiating HR employee will receive a notification.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              {approved ? 'Approval Remarks (Optional)' : 'Rejection Reason (Required)'}
            </label>
            <textarea
              value={remarks}
              disabled={submitting}
              onChange={event => setRemarks(event.target.value)}
              rows={4}
              maxLength={3000}
              placeholder={approved ? 'Enter approval remarks...' : 'Explain why this nomination is being rejected...'}
              className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onConfirm(remarks.trim())}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 ${approved ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : approved ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {submitting ? 'Processing...' : approved ? 'Confirm Approval' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmation({ nomination, deleting, onClose, onConfirm }) {
  const [employeeId, setEmployeeId] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const canDelete =
    employeeId === nomination.employee_emp_id &&
    confirmation === 'DELETE' &&
    !deleting

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-ijr-title"
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-5 py-4">
          <h2 id="delete-ijr-title" className="flex items-center gap-2 text-lg font-bold text-red-800">
            <AlertTriangle size={22} />
            Permanently Delete IJR Nomination
          </h2>
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="rounded-lg p-1.5 text-red-700 hover:bg-red-100 disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-900">This action cannot be undone.</p>
            <p className="mt-2 text-xs leading-relaxed text-red-800">
              The nomination, administrative decision history, and all associated notifications
              will be permanently deleted. Employee organizational records will remain unchanged.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-bold text-gray-900">{nomination.employee_name}</p>
            <p className="mt-1 text-xs text-gray-500">Employee ID: {nomination.employee_emp_id}</p>
            <p className="mt-1 break-all text-xs text-gray-400">Nomination: {nomination.id}</p>
            <div className="mt-3">
              <Badge status={nomination.status} />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Type the exact employee ID:
            </label>
            <p className="mb-2 rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700">
              {nomination.employee_emp_id}
            </p>
            <input
              type="text"
              value={employeeId}
              disabled={deleting}
              onChange={event => setEmployeeId(event.target.value)}
              autoComplete="off"
              placeholder="Enter exact employee ID"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-red-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmation}
              disabled={deleting}
              onChange={event => setConfirmation(event.target.value)}
              autoComplete="off"
              placeholder="DELETE"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-red-500 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canDelete}
            onClick={() => onConfirm({
              employee_emp_id: employeeId,
              confirmation
            })}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {deleting ? 'Deleting Permanently...' : 'Permanently Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function IJRAdmin({ onClose }) {
  const { user } = useUser()
  const isAdmin = ADMIN_EMAILS.includes((user?.email || '').trim().toLowerCase())

  const [nominations, setNominations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [detailsLoading, setDetailsLoading] = useState(false)

  const [decision, setDecision] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteNomination, setDeleteNomination] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchNominations = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const { data } = await axios.get(API, {
        params: {
          search,
          status: statusFilter,
          date_from: startDate,
          date_to: endDate
        },
        withCredentials: true
      })

      setNominations(data.nominations || [])
    } catch (error) {
      setNominations([])
      toast.error(getError(error, 'Failed to load IJR nominations.'))
    } finally {
      setLoading(false)
    }
  }, [isAdmin, search, statusFilter, startDate, endDate])

  useEffect(() => {
    const timer = setTimeout(fetchNominations, 300)
    return () => clearTimeout(timer)
  }, [fetchNominations])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, startDate, endDate])

  const totalPages = Math.max(1, Math.ceil(nominations.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleNominations = nominations.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const summary = {
    total: nominations.length,
    pending: nominations.filter(item => item.status === 'PENDING').length,
    approved: nominations.filter(item => item.status === 'APPROVED').length,
    rejected: nominations.filter(item => item.status === 'REJECTED').length,
    other: nominations.filter(item => ['IMPLEMENTED', 'CANCELLED'].includes(item.status)).length
  }

  const openDetails = async nominationId => {
    if (detailsLoading || submitting || deleting) return

    setDetailsLoading(true)

    try {
      const { data } = await axios.get(`${API}/${nominationId}`, {
        withCredentials: true
      })

      setSelected(data.nomination)
      setHistory(data.history || [])
    } catch (error) {
      toast.error(getError(error, 'Failed to load nomination details.'))
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleDecision = async remarks => {
    if (!decision || submitting || !isAdmin) return

    setSubmitting(true)

    try {
      const endpoint = decision.action === 'APPROVED' ? 'approve' : 'reject'

      const { data } = await axios.post(
        `${API}/${decision.nomination.id}/${endpoint}`,
        { remarks },
        { withCredentials: true }
      )

      toast.success(data.message || 'IJR decision recorded successfully.')
      const nominationId = decision.nomination.id

      setDecision(null)
      await fetchNominations()
      await openDetailsAfterDecision(nominationId)
    } catch (error) {
      toast.error(getError(error, 'Failed to process IJR decision.'))
    } finally {
      setSubmitting(false)
    }
  }

  const openDetailsAfterDecision = async nominationId => {
    try {
      const { data } = await axios.get(`${API}/${nominationId}`, {
        withCredentials: true
      })

      setSelected(data.nomination)
      setHistory(data.history || [])
    } catch (error) {
      toast.error(getError(error, 'Failed to refresh nomination details.'))
    }
  }

  const handleDelete = async payload => {
    if (!deleteNomination || deleting || !isAdmin) return

    setDeleting(true)

    try {
      const { data } = await axios.delete(
        `${API}/${deleteNomination.id}`,
        {
          data: payload,
          withCredentials: true
        }
      )

      toast.success(data.message || 'IJR nomination permanently deleted.')

      setDeleteNomination(null)
      setSelected(null)
      setHistory([])
      await fetchNominations()
    } catch (error) {
      toast.error(getError(error, 'Failed to permanently delete nomination.'))
    } finally {
      setDeleting(false)
    }
  }

  const stats = [
    { label: 'Total Nominations', value: summary.total, icon: ArrowRightLeft, color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending', value: summary.pending, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Approved', value: summary.approved, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
    { label: 'Rejected', value: summary.rejected, icon: XCircle, color: 'bg-red-50 text-red-600' },
    { label: 'Other', value: summary.other, icon: ClipboardList, color: 'bg-gray-100 text-gray-600' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-2xl">
        <div className="flex items-center justify-between border-b bg-white px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <ArrowRightLeft size={22} className="text-[#F6490D]" />
              Internal Job Rotation Management
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Review nominations • Approve or reject proposals • Administrative audit trail
            </p>
          </div>
          <button
            type="button"
            disabled={submitting || deleting}
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close IJR administration"
          >
            <X size={22} />
          </button>
        </div>

        {!isAdmin ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <ShieldCheck size={44} className="mb-3 text-red-500" />
            <h3 className="text-lg font-bold text-gray-900">Access Restricted</h3>
            <p className="mt-2 text-sm text-gray-500">
              Only authorized IJR administrators can access nomination records.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
              {stats.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-500">{label}</span>
                    <span className={`rounded-lg p-2 ${color}`}>
                      <Icon size={18} />
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Filter size={16} className="text-[#F6490D]" />
                Search & Filters
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="relative md:col-span-2">
                  <Search size={17} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Search employee, ID, or nominating HR..."
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-400"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={event => setStatusFilter(event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                >
                  <option value="ALL">All Statuses</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={fetchNominations}
                  disabled={loading || submitting || deleting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Created From</label>
                  <input
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={event => setStartDate(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Created Until</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={event => setEndDate(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400"
                  />
                </div>

                <div className="flex items-end md:col-span-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      setStatusFilter('ALL')
                      setStartDate('')
                      setEndDate('')
                      setPage(1)
                    }}
                    disabled={submitting || deleting}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                {nominations.length} nomination{nominations.length !== 1 ? 's' : ''} found
              </p>
              <p className="text-xs text-gray-500">Page {currentPage} of {totalPages}</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 rounded-xl border bg-white py-20 text-gray-500">
                <Loader2 size={22} className="animate-spin text-[#F6490D]" />
                Loading IJR nominations...
              </div>
            ) : nominations.length === 0 ? (
              <div className="rounded-xl border bg-white py-20 text-center">
                <ArrowRightLeft size={42} className="mx-auto mb-3 text-gray-300" />
                <p className="font-semibold text-gray-700">No IJR nominations found</p>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters or submit an HR nomination first.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-4 font-semibold">Employee</th>
                        <th className="px-4 py-4 font-semibold">Current SBU</th>
                        <th className="px-4 py-4 font-semibold">Proposed SBU</th>
                        <th className="px-4 py-4 font-semibold">Status</th>
                        <th className="px-4 py-4 font-semibold">Nominated By</th>
                        <th className="px-4 py-4 font-semibold">Submitted</th>
                        <th className="px-4 py-4 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {visibleNominations.map(nomination => (
                        <tr key={nomination.id} className="transition-colors hover:bg-orange-50/30">
                          <td className="px-4 py-4">
                            <p className="font-semibold text-gray-900">{nomination.employee_name}</p>
                            <p className="mt-1 text-xs text-gray-500">{nomination.employee_emp_id}</p>
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {displayValue(nomination.current_details?.sub_bu)}
                          </td>
                          <td className="px-4 py-4 font-medium text-gray-800">
                            {displayValue(nomination.proposed_details?.sub_bu)}
                          </td>
                          <td className="px-4 py-4">
                            <Badge status={nomination.status} />
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-medium text-gray-800">{nomination.nominated_by_name}</p>
                            <p className="text-xs text-gray-500">{nomination.nominated_by_emp_id}</p>
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-600">
                            {formatDate(nomination.created_at)}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              disabled={detailsLoading || submitting || deleting}
                              onClick={() => openDetails(nomination.id)}
                              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-[#F6490D] disabled:opacity-50"
                            >
                              <Eye size={15} />
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between rounded-xl border bg-white px-4 py-3">
                <p className="text-xs text-gray-500">Showing page {currentPage} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1 || loading || submitting || deleting}
                    onClick={() => setPage(value => Math.max(1, value - 1))}
                    className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages || loading || submitting || deleting}
                    onClick={() => setPage(value => Math.min(totalPages, value + 1))}
                    className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
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
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <History size={20} className="text-[#F6490D]" />
                  IJR Nomination Details
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Employee rotation proposal and administrative decision history
                </p>
              </div>
              <button
                type="button"
                disabled={submitting || deleting}
                onClick={() => {
                  setSelected(null)
                  setHistory([])
                }}
                className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close nomination details"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <NominationDetails
                nomination={selected}
                history={history}
                onApprove={() => setDecision({ action: 'APPROVED', nomination: selected })}
                onReject={() => setDecision({ action: 'REJECTED', nomination: selected })}
                onDelete={() => setDeleteNomination(selected)}
              />
            </div>
          </div>
        </div>
      )}

      {decision && (
        <DecisionConfirmation
          key={`${decision.nomination.id}-${decision.action}`}
          nomination={decision.nomination}
          action={decision.action}
          submitting={submitting}
          onClose={() => {
            if (!submitting) setDecision(null)
          }}
          onConfirm={handleDecision}
        />
      )}

      {deleteNomination && (
        <DeleteConfirmation
          key={deleteNomination.id}
          nomination={deleteNomination}
          deleting={deleting}
          onClose={() => {
            if (!deleting) setDeleteNomination(null)
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}