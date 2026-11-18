'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ReferralProgressBar from './ReferralProgressBar';
import axios from 'axios';
import { toast } from 'sonner';
import {
  CheckCircle, FileText, UserCheck, X, Ban, Briefcase, Loader2,
  History, Clock, ChevronDown, ChevronUp, RefreshCw,
  GraduationCap, ShieldCheck, Lock, AlertTriangle, Save,
  CalendarDays, ClipboardCheck, CheckCircle2
} from 'lucide-react';
import { useUser } from '@/context/UserContext';

// ==========================================================
// CONSTANTS
// ==========================================================

const STATUS_CONFIG = {
  PENDING_REVIEW: { color: 'text-purple-600', label: 'Awaiting SBU Review', icon: FileText },
  CONSIDERED: { color: 'text-blue-600', label: 'Recommended by SBU', icon: UserCheck },
  REJECTED: { color: 'text-red-600', label: 'Rejected by SBU', icon: X },
  FINAL_ACCEPTED: { color: 'text-green-600', label: 'Selected by HR', icon: CheckCircle },
  FINAL_REJECTED: { color: 'text-red-600', label: 'Rejected by HR', icon: Ban }
};

const REFERRAL_REASON_LABELS = {
  COURTESY: 'Courtesy Referral – Shared out of obligation or goodwill',
  POTENTIAL_FIT: 'Potential Fit Referral – Strong background, depends on role fitment',
  DIRECT_ROLE_FIT: 'Direct Role Fit Referral – Clearly aligned to an open position',
  INTERNAL_NETWORK: 'Internal Network Referral – Former colleague or vendor contact',
  STRATEGIC: 'Strategic Referral – High-value or niche candidate for special review'
};

const HR_STAGE_LABELS = {
  TEST: 'Test',
  T1: 'Technical Round 1',
  T2: 'Technical Round 2',
  T3: 'Technical Round 3',
  HR: 'HR Round',
  OTHER: 'Other Reason'
};

const IN_PROGRESS_STAGES = ['TEST', 'T1', 'T2', 'T3'];
const REJECTION_STAGES = ['TEST', 'T1', 'T2', 'T3', 'HR', 'OTHER'];

const HR_STATUS_LABELS = {
  IN_PROGRESS: 'In Progress',
  ACCEPTED: 'Selected',
  REJECTED: 'Rejected'
};

const OFFER_OUTCOME_LABELS = {
  OFFER_DECLINED: 'Offer Declined',
  DID_NOT_JOIN: 'Did Not Join',
  JOINED: 'Joined'
};

const FRESHER_TYPES = ['INTERN_FRESHER', 'FULL_TIME_FRESHER'];

// ==========================================================
// HELPERS
// ==========================================================

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatJoiningDate(value) {
  if (!value) return 'N/A';
  const parts = String(value).split('-');
  if (parts.length !== 3) return String(value);
  const [year, month, day] = parts.map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

function formatAcademicValue(value, suffix) {
  if (value === null || value === undefined || value === '') return 'N/A';
  return `${value}${suffix}`;
}

function getDecisionLabel(decision) {
  if (decision === 'CONSIDERED') return 'Recommended for HR Evaluation';
  if (decision === 'REJECTED') return 'Not Recommended for HR Evaluation';
  return 'N/A';
}

function getReviewerName(review) {
  const reviewer = review?.reviewed_by;
  if (!reviewer) return 'Unknown Reviewer';
  if (typeof reviewer === 'object') return reviewer.name || reviewer.email || 'Unknown Reviewer';
  return String(reviewer);
}

function getReviewerEmail(review) {
  const reviewer = review?.reviewed_by;
  return reviewer && typeof reviewer === 'object' ? reviewer.email || null : null;
}

function getEmployeeName(employee) {
  if (!employee) return 'Unknown HR Employee';
  if (typeof employee === 'string') return employee;
  return employee.name || employee.email || 'Unknown HR Employee';
}

function getStatusInfo(referral) {
  const currentStatus = referral?.current_status;
  const config = STATUS_CONFIG[currentStatus] || {
    color: 'text-gray-600', label: 'Unknown Status', icon: FileText
  };
  if (currentStatus === 'REJECTED' && referral?.rejection_stage === 'HR') {
    return { ...config, label: 'Rejected by HR' };
  }
  if (referral?.is_hr_locked || referral?.hr_evaluation_status === 'COMPLETED') {
    const evaluation = referral?.hr_evaluation;
    if (evaluation?.status === 'ACCEPTED') {
      if (evaluation.offer_outcome === 'JOINED') {
        return { ...config, label: 'Joined', icon: CheckCircle, color: 'text-green-700' };
      }
      if (evaluation.offer_outcome === 'OFFER_DECLINED') {
        return { ...config, label: 'Offer Declined', icon: Ban, color: 'text-red-600' };
      }
      if (evaluation.offer_outcome === 'DID_NOT_JOIN') {
        return { ...config, label: 'Did Not Join', icon: Ban, color: 'text-red-600' };
      }
    }
    return config;
  }
  if (referral?.hr_evaluation) {
    const evaluation = referral.hr_evaluation;
    if (evaluation.status === 'IN_PROGRESS') {
      return {
        ...config,
        label: evaluation.stage
          ? `In Progress — ${HR_STAGE_LABELS[evaluation.stage] || evaluation.stage}`
          : 'HR Evaluation In Progress',
        icon: Briefcase, color: 'text-blue-600'
      };
    }
    if (evaluation.status === 'ACCEPTED' && evaluation.offer_released && !evaluation.offer_outcome) {
      return { ...config, label: 'Offer Released — Awaiting Outcome', icon: Briefcase, color: 'text-amber-600' };
    }
    return { ...config, label: 'HR Evaluation Draft', icon: Briefcase, color: 'text-amber-600' };
  }
  if (currentStatus === 'CONSIDERED') {
    return { ...config, label: 'Recommended by SBU — Awaiting HR' };
  }
  return config;
}

function normalizeReviewHistory(referral) {
  const history = Array.isArray(referral?.review_history) ? [...referral.review_history] : [];
  if (!history.length && referral?.review) history.push(referral.review);
  return history.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
}

function normalizeHrHistory(referral) {
  const history = Array.isArray(referral?.hr_evaluation_history)
    ? [...referral.hr_evaluation_history] : [];
  return history.sort((a, b) => {
    const revisionDifference = Number(b.revision || 0) - Number(a.revision || 0);
    if (revisionDifference) return revisionDifference;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

function getApiError(error, fallback) {
  const data = error?.response?.data;
  if (typeof data?.error === 'string') return data.error;
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.message === 'string') return data.message;
  if (data && typeof data === 'object') {
    const firstError = Object.values(data)[0];
    if (Array.isArray(firstError)) return String(firstError[0]);
    if (typeof firstError === 'string') return firstError;
  }
  return fallback;
}

function getOfferOutcomeColor(outcome) {
  if (outcome === 'JOINED') return 'border-green-200 bg-green-50 text-green-800';
  if (outcome === 'OFFER_DECLINED' || outcome === 'DID_NOT_JOIN') {
    return 'border-red-200 bg-red-50 text-red-800';
  }
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function getOfferProgressLabel(evaluation) {
  if (!evaluation || evaluation.status !== 'ACCEPTED') return 'Not Applicable';
  if (!evaluation.offer_released) return 'Offer Not Released';
  if (!evaluation.offer_outcome) return 'Offer Released — Awaiting Outcome';
  return OFFER_OUTCOME_LABELS[evaluation.offer_outcome] || 'Unknown Outcome';
}

// ==========================================================
// SMALL COMPONENTS
// ==========================================================

function DetailRow({ label, children }) {
  return (
    <div className="text-sm leading-relaxed">
      <span className="font-semibold text-gray-800">{label}:</span>{' '}
      <span className="break-words whitespace-pre-wrap text-gray-700">{children}</span>
    </div>
  );
}

function ReviewDecisionBadge({ decision }) {
  const isRecommended = decision === 'CONSIDERED';
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
      isRecommended ? 'bg-green-100 text-green-700' :
      decision === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
    }`}>
      {getDecisionLabel(decision)}
    </span>
  );
}

function HrStatusBadge({ status }) {
  const color = status === 'ACCEPTED'
    ? 'bg-green-100 text-green-700'
    : status === 'REJECTED'
      ? 'bg-red-100 text-red-700'
      : 'bg-blue-100 text-blue-700';
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      {HR_STATUS_LABELS[status] || status || 'N/A'}
    </span>
  );
}

function OfferDetails({ evaluation, compact = false }) {
  if (!evaluation || evaluation.status !== 'ACCEPTED') return null;
  const progressLabel = getOfferProgressLabel(evaluation);
  return (
    <div className={`rounded-lg border p-4 ${getOfferOutcomeColor(evaluation.offer_outcome)}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <ClipboardCheck size={17} /> Offer & Joining Details
        </h4>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold">
          {progressLabel}
        </span>
      </div>
      <div className="space-y-2">
        <DetailRow label="Offer Released">{evaluation.offer_released ? 'Yes' : 'No'}</DetailRow>
        <DetailRow label="Offer Outcome">
          {evaluation.offer_released
            ? OFFER_OUTCOME_LABELS[evaluation.offer_outcome] || 'Awaiting Candidate Outcome'
            : 'Not Applicable'}
        </DetailRow>
        {evaluation.offer_outcome === 'JOINED' && (
          <DetailRow label="Date of Joining">{formatJoiningDate(evaluation.joining_date)}</DetailRow>
        )}
      </div>
      {!compact && evaluation.offer_released && !evaluation.offer_outcome && (
        <p className="mt-3 text-xs font-medium">
          {"The offer has been released. HR must record the candidate's final outcome before finalization."}
        </p>
      )}
    </div>
  );
}

// ==========================================================
// MAIN COMPONENT
// ==========================================================

export default function ReferralCardHR({ referral }) {
  const { user } = useUser();
  const [expanded, setExpanded] = useState(false);
  const [localReferral, setLocalReferral] = useState(referral);
  const [stage, setStage] = useState(referral?.hr_evaluation?.stage || '');
  const [status, setStatus] = useState(referral?.hr_evaluation?.status || '');
  const [comment, setComment] = useState(referral?.hr_evaluation?.comment || '');
  const [offerReleased, setOfferReleased] = useState(Boolean(referral?.hr_evaluation?.offer_released));
  const [offerOutcome, setOfferOutcome] = useState(referral?.hr_evaluation?.offer_outcome || '');
  const [joiningDate, setJoiningDate] = useState(referral?.hr_evaluation?.joining_date || '');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showHrHistory, setShowHrHistory] = useState(false);
  const [showFinalizeWarning, setShowFinalizeWarning] = useState(false);

  useEffect(() => {
    setLocalReferral(referral);
    setStage(referral?.hr_evaluation?.stage || '');
    setStatus(referral?.hr_evaluation?.status || '');
    setComment(referral?.hr_evaluation?.comment || '');
    setOfferReleased(Boolean(referral?.hr_evaluation?.offer_released));
    setOfferOutcome(referral?.hr_evaluation?.offer_outcome || '');
    setJoiningDate(referral?.hr_evaluation?.joining_date || '');
  }, [referral]);

  const reviewHistory = normalizeReviewHistory(localReferral);
  const latestReview = reviewHistory[0] || null;
  const previousReviews = reviewHistory.slice(1);
  const hrHistory = normalizeHrHistory(localReferral);
  const hasHrEvaluation = Boolean(localReferral?.hr_evaluation);
  const isHrLocked = Boolean(
    localReferral?.is_hr_locked ||
    localReferral?.hr_evaluation_status === 'COMPLETED' ||
    localReferral?.hr_evaluation?.is_locked
  );
  const statusInfo = getStatusInfo(localReferral);
  const StatusIcon = statusInfo.icon;

  // Academic details
  const isFresher = FRESHER_TYPES.includes(localReferral?.candidate_type);
  const isAcademicCompleted = isFresher && localReferral?.academic_details_status === 'COMPLETED';
  const academicDetails = localReferral?.academic_details || {};
  const tenthPercentage = academicDetails.tenth_percentage ?? localReferral?.tenth_percentage;
  const twelfthPercentage = academicDetails.twelfth_percentage ?? localReferral?.twelfth_percentage;
  const graduationCgpa = academicDetails.graduation_cgpa ?? localReferral?.graduation_cgpa;
  const hasAcademicValues = [tenthPercentage, twelfthPercentage, graduationCgpa].every(
    (value) => value !== null && value !== undefined && value !== ''
  );
  const showAcademicDetails = isAcademicCompleted && hasAcademicValues;

  // Form validation states
  const validStage = status === 'IN_PROGRESS'
    ? IN_PROGRESS_STAGES.includes(stage)
    : status === 'REJECTED'
      ? REJECTION_STAGES.includes(stage)
      : status === 'ACCEPTED';
  const validComment = Boolean(comment.trim());
  const canSaveDraft = Boolean(status && validStage && validComment);
  const canFinalize = status === 'REJECTED'
    ? Boolean(validStage && validComment)
    : status === 'ACCEPTED'
      ? Boolean(
          validComment && offerReleased && OFFER_OUTCOME_LABELS[offerOutcome] &&
          (offerOutcome !== 'JOINED' || joiningDate)
        )
      : false;

  const updateReferralState = (updatedReferral) => {
    if (!updatedReferral) return;
    setLocalReferral(updatedReferral);
    setStage(updatedReferral?.hr_evaluation?.stage || '');
    setStatus(updatedReferral?.hr_evaluation?.status || '');
    setComment(updatedReferral?.hr_evaluation?.comment || '');
    setOfferReleased(Boolean(updatedReferral?.hr_evaluation?.offer_released));
    setOfferOutcome(updatedReferral?.hr_evaluation?.offer_outcome || '');
    setJoiningDate(updatedReferral?.hr_evaluation?.joining_date || '');
  };

  const refreshReferral = async ({ showSuccess = false } = {}) => {
    setRefreshing(true);
    try {
      const response = await axios.get('/api/hr-evaluation');
      const referrals = Array.isArray(response.data) ? response.data : [];
      const updatedReferral = referrals.find((item) => String(item.id) === String(localReferral.id));
      if (!updatedReferral) throw new Error('Referral was not found in the HR evaluation response.');
      updateReferralState(updatedReferral);
      if (showSuccess) toast.success('Referral details refreshed.');
      return updatedReferral;
    } catch (error) {
      console.error('Failed to refresh referral:', error);
      if (showSuccess) toast.error('Unable to refresh referral details.');
      throw error;
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenDetails = async () => {
    setExpanded(true);
    try {
      await refreshReferral();
    } catch {
      // Continue showing previously loaded referral information.
    }
  };

  // ========================================================
  // FORM HANDLERS
  // ==========================================================

  const handleStatusChange = (nextStatus) => {
    setStatus(nextStatus);
    if (nextStatus === 'IN_PROGRESS' && !IN_PROGRESS_STAGES.includes(stage)) setStage('');
    if (nextStatus === 'REJECTED' && !REJECTION_STAGES.includes(stage)) setStage('');
    if (nextStatus === 'ACCEPTED' || !nextStatus) setStage('');
    if (nextStatus !== 'ACCEPTED') {
      setOfferReleased(false);
      setOfferOutcome('');
      setJoiningDate('');
    }
    setShowFinalizeWarning(false);
  };

  const handleOfferReleasedChange = (checked) => {
    setOfferReleased(checked);
    if (!checked) {
      setOfferOutcome('');
      setJoiningDate('');
    }
  };

  const handleOfferOutcomeChange = (nextOutcome) => {
    setOfferOutcome(nextOutcome);
    if (nextOutcome !== 'JOINED') setJoiningDate('');
  };

  // ========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = (action) => {
    if (!user?.emp_id) {
      toast.error('Unable to identify the logged-in HR employee.');
      return false;
    }
    if (isHrLocked) {
      toast.error('This HR evaluation has been permanently finalized and locked.');
      return false;
    }
    if (!status) {
      toast.error('Please select an HR evaluation status.');
      return false;
    }
    if (!comment.trim()) {
      toast.error('Please enter an HR evaluation comment.');
      return false;
    }
    if (status === 'IN_PROGRESS' && !IN_PROGRESS_STAGES.includes(stage)) {
      toast.error('Please select a valid current recruitment stage.');
      return false;
    }
    if (status === 'REJECTED' && !REJECTION_STAGES.includes(stage)) {
      toast.error('Please select a valid rejection stage.');
      return false;
    }
    if (action === 'FINALIZE' && status === 'IN_PROGRESS') {
      toast.error('An In Progress evaluation cannot be finalized. Select either Selected or Rejected.');
      return false;
    }
    if (status === 'ACCEPTED') {
      if (offerOutcome && !offerReleased) {
        toast.error('An offer must be released before selecting an outcome.');
        return false;
      }
      if (joiningDate && offerOutcome !== 'JOINED') {
        toast.error('Joining date is only applicable when the candidate has joined.');
        return false;
      }
      if (action === 'FINALIZE') {
        if (!offerReleased) {
          toast.error('Please confirm that the offer has been released.');
          return false;
        }
        if (!offerOutcome) {
          toast.error('Please select the final offer outcome.');
          return false;
        }
        if (offerOutcome === 'JOINED' && !joiningDate) {
          toast.error('Please enter the date of joining.');
          return false;
        }
      }
    }
    return true;
  };

  // ========================================================
  // SAVE DRAFT / FINALIZE
  // ==========================================================

  const saveEvaluation = async (action) => {
    if (submitting || refreshing || !validateForm(action)) return;
    setSubmitting(true);
    try {
      const payload = {
        referral_id: localReferral.id,
        emp_id: user.emp_id,
        status,
        stage: ['IN_PROGRESS', 'REJECTED'].includes(status) ? stage : '',
        comment: comment.trim(),
        action,
        expected_version: localReferral.hr_evaluation_version ?? 0,
        offer_released: status === 'ACCEPTED' ? offerReleased : false,
        offer_outcome: status === 'ACCEPTED' && offerReleased ? offerOutcome || null : null,
        joining_date: status === 'ACCEPTED' && offerReleased && offerOutcome === 'JOINED'
          ? joiningDate || null : null
      };
      const method = hasHrEvaluation ? 'PUT' : 'POST';
      await axios({ method, url: '/api/hr-evaluation', data: payload });
      toast.success(
        action === 'FINALIZE'
          ? 'HR evaluation and offer outcome finalized and permanently locked!'
          : 'HR evaluation draft saved successfully!'
      );
      setShowFinalizeWarning(false);
      try {
        await refreshReferral();
      } catch {
        toast.warning('Evaluation saved, but the latest details could not be refreshed.');
      }
      setExpanded(false);
    } catch (error) {
      console.error('HR evaluation failed:', error?.response?.data || error);
      if (error.response?.status === 409) {
        toast.error(getApiError(error, 'Evaluation was modified by another HR employee. Please refresh.'));
        await refreshReferral().catch(() => {});
        setShowFinalizeWarning(false);
        return;
      }
      if (error.response?.status === 403) {
        toast.error(getApiError(error, 'This evaluation is locked or access is denied.'));
        await refreshReferral().catch(() => {});
        setShowFinalizeWarning(false);
        return;
      }
      toast.error(getApiError(error, 'Failed to save HR evaluation.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeClick = () => {
    if (!validateForm('FINALIZE')) return;
    setShowFinalizeWarning(true);
  };

  return (
    <Card className="w-full">
      <CardContent className="px-4 py-3">
        {/* Candidate Summary */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-[18px] text-gray-900">{localReferral.candidate_name}</h3>
            <p className="mt-1 text-xs text-gray-500">{localReferral.candidate_type}</p>
          </div>
          <span className={`flex shrink-0 items-center gap-1 text-xs sm:text-sm font-medium ${statusInfo.color}`}>
            <StatusIcon size={16} /> {statusInfo.label}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleOpenDetails} className="cursor-pointer text-sm text-blue-600 underline">
            View Details
          </button>
          {isHrLocked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
              <Lock size={12} /> HR Finalized
            </span>
          )}
          {hasHrEvaluation && !isHrLocked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
              <Save size={12} /> Draft
            </span>
          )}
        </div>

        {/* Details Modal */}
        {expanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5" role="dialog" aria-modal="true" aria-label="HR Referral Details">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6">
              {/* Modal Header */}
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{localReferral.candidate_name}</h2>
                  <p className="mt-1 text-sm text-gray-500">HR Evaluation & Offer Outcome</p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => refreshReferral({ showSuccess: true }).catch(() => {})}
                    disabled={refreshing || submitting}
                    className="cursor-pointer text-gray-500 hover:text-blue-600 disabled:opacity-50"
                    title="Refresh referral" aria-label="Refresh referral">
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                  <button type="button" onClick={() => { setExpanded(false); setShowFinalizeWarning(false); }}
                    disabled={submitting}
                    className="cursor-pointer text-gray-500 hover:text-red-600 disabled:opacity-50" aria-label="Close">
                    <X size={21} />
                  </button>
                </div>
              </div>

              {/* Referral Progress */}
              <ReferralProgressBar
                currentStatus={localReferral.current_status}
                rejection_stage={localReferral.rejection_stage}
                submitted_at={localReferral.submitted_at}
                considered_at={localReferral.considered_at}
                final_at={localReferral.final_at}
              />

              {/* Candidate Information */}
              <section className="mt-6">
                <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <FileText size={18} /> Candidate Information
                </h3>
                <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <DetailRow label="Candidate Email">{localReferral.candidate_email || 'N/A'}</DetailRow>
                  <DetailRow label="Candidate Phone">{localReferral.candidate_phone || 'N/A'}</DetailRow>
                  <DetailRow label="CV">
                    {localReferral.cv_url ? (
                      <a href={localReferral.cv_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        Download CV
                      </a>
                    ) : 'N/A'}
                  </DetailRow>
                  <DetailRow label="Submitted At">{formatDate(localReferral.submitted_at)}</DetailRow>
                  <DetailRow label="SBUs">
                    {localReferral.sbus?.length ? localReferral.sbus.map((sbu) => sbu.name).join(', ') : 'N/A'}
                  </DetailRow>
                  <DetailRow label="Referrer">{localReferral.referrer?.name || 'N/A'}</DetailRow>
                  <DetailRow label="Referrer Email">{localReferral.referrer?.email || 'N/A'}</DetailRow>
                  <DetailRow label="Referral Category">
                    {REFERRAL_REASON_LABELS[localReferral.referral_reason_type] || 'N/A'}
                  </DetailRow>
                  <DetailRow label="Referrer Comments">{localReferral.additional_comment || 'N/A'}</DetailRow>
                </div>
              </section>

              {/* Academic Details */}
              {showAcademicDetails && (
                <section className="mt-6">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                      <GraduationCap size={19} className="text-[#F6490D]" /> Academic Details
                    </h3>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      <ShieldCheck size={15} /> Finalized & Locked
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="mb-2 text-xs font-medium text-gray-500">Class 10 Percentage</p>
                      <p className="text-xl font-bold text-gray-900">{formatAcademicValue(tenthPercentage, '%')}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="mb-2 text-xs font-medium text-gray-500">Class 12 Percentage</p>
                      <p className="text-xl font-bold text-gray-900">{formatAcademicValue(twelfthPercentage, '%')}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="mb-2 text-xs font-medium text-gray-500">Graduation CGPA</p>
                      <p className="text-xl font-bold text-gray-900">{formatAcademicValue(graduationCgpa, ' / 10')}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
                    <Lock size={14} className="mt-0.5 shrink-0" />
                    <p>These academic records have been finalized by HR and are permanently locked.</p>
                  </div>
                  {localReferral.academic_details_updated_at && (
                    <p className="mt-2 text-xs text-gray-500">
                      Finalized on: {formatDate(localReferral.academic_details_updated_at)}
                    </p>
                  )}
                </section>
              )}

              {/* Latest SBU Recommendation */}
              <section className="mt-6">
                <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <UserCheck size={18} /> Latest SBU Recommendation
                </h3>
                {latestReview ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-800">Latest Decision</span>
                      <ReviewDecisionBadge decision={latestReview.decision} />
                    </div>
                    <div className="mt-4 space-y-2">
                      <DetailRow label="Reviewed By">{getReviewerName(latestReview)}</DetailRow>
                      {getReviewerEmail(latestReview) && (
                        <DetailRow label="Reviewer Email">{getReviewerEmail(latestReview)}</DetailRow>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={15} /> <span>{formatDate(latestReview.reviewed_at)}</span>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-blue-100 pt-3">
                      <p className="text-sm font-semibold text-gray-800">Reviewer Comment</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
                        {latestReview.comment || 'N/A'}
                      </p>
                    </div>
                    <p className="mt-3 text-xs font-medium text-blue-700">This is the latest recorded SBU decision.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">No SBU review is available.</p>
                  </div>
                )}
              </section>

              {/* Complete SBU Review History */}
              {reviewHistory.length > 0 && (
                <section className="mt-5">
                  <button type="button" onClick={() => setShowHistory((previous) => !previous)}
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left hover:bg-gray-50"
                    aria-expanded={showHistory}>
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <History size={18} /> Complete SBU Review History
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{reviewHistory.length}</span>
                    </span>
                    {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {showHistory && (
                    <div className="mt-3 space-y-3">
                      {reviewHistory.map((review, index) => {
                        const isLatest = index === 0;
                        return (
                          <div key={review.id ?? index} className={`rounded-lg border p-4 ${
                            isLatest ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 bg-gray-50'
                          }`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{getReviewerName(review)}</p>
                                {getReviewerEmail(review) && (
                                  <p className="mt-1 text-xs text-gray-500">{getReviewerEmail(review)}</p>
                                )}
                                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                  <Clock size={13} /> {formatDate(review.reviewed_at)}
                                </p>
                              </div>
                              <ReviewDecisionBadge decision={review.decision} />
                            </div>
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-gray-600">Reviewer Comment</p>
                              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
                                {review.comment || 'N/A'}
                              </p>
                            </div>
                            <div className="mt-3 border-t border-gray-200 pt-2">
                              <span className={`text-xs font-semibold ${isLatest ? 'text-blue-700' : 'text-gray-500'}`}>
                                {isLatest ? 'Latest SBU Decision' : 'Previous SBU Decision'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {previousReviews.length > 0 && (
                        <p className="text-xs text-gray-500">
                          Previous decisions are retained for transparency. Only the latest SBU recommendation is currently effective.
                        </p>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* Current HR Evaluation */}
              {hasHrEvaluation && (
                <section className="mt-6">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                      <Briefcase size={18} /> Current HR Evaluation
                    </h3>
                    {isHrLocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        <Lock size={14} /> Finalized & Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        <Save size={14} /> Draft — Editable
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <DetailRow label="Status">
                      {HR_STATUS_LABELS[localReferral.hr_evaluation.status] || localReferral.hr_evaluation.status}
                    </DetailRow>
                    {localReferral.hr_evaluation.stage && (
                      <DetailRow label={localReferral.hr_evaluation.status === 'IN_PROGRESS' ? 'Current Recruitment Stage' : 'Rejection Stage'}>
                        {HR_STAGE_LABELS[localReferral.hr_evaluation.stage] || localReferral.hr_evaluation.stage}
                      </DetailRow>
                    )}
                    <DetailRow label="Comment">{localReferral.hr_evaluation.comment || 'N/A'}</DetailRow>
                    <DetailRow label="Updated At">{formatDate(localReferral.hr_evaluation.updated_at)}</DetailRow>
                    <DetailRow label="Updated By">{getEmployeeName(localReferral.hr_evaluation.updated_by)}</DetailRow>
                    {isHrLocked && localReferral.hr_evaluation.finalized_at && (
                      <>
                        <DetailRow label="Finalized At">{formatDate(localReferral.hr_evaluation.finalized_at)}</DetailRow>
                        <DetailRow label="Finalized By">{getEmployeeName(localReferral.hr_evaluation.finalized_by)}</DetailRow>
                      </>
                    )}
                  </div>
                  {localReferral.hr_evaluation.status === 'ACCEPTED' && (
                    <div className="mt-3">
                      <OfferDetails evaluation={localReferral.hr_evaluation} />
                    </div>
                  )}
                </section>
              )}

              {/* HR Evaluation History */}
              {hrHistory.length > 0 && (
                <section className="mt-5">
                  <button type="button" onClick={() => setShowHrHistory((previous) => !previous)}
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left hover:bg-gray-50"
                    aria-expanded={showHrHistory}>
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <History size={18} /> Complete HR Evaluation History
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{hrHistory.length}</span>
                    </span>
                    {showHrHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {showHrHistory && (
                    <div className="mt-3 space-y-3">
                      {hrHistory.map((entry, index) => (
                        <div key={entry.id ?? index} className={`rounded-lg border p-4 ${
                          index === 0 ? 'border-purple-200 bg-purple-50/40' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{getEmployeeName(entry.updated_by)}</p>
                              <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                <Clock size={13} /> {formatDate(entry.updated_at || entry.created_at)}
                              </p>
                              <p className="mt-1 text-xs font-medium text-purple-700">
                                Revision #{entry.revision || index + 1}
                              </p>
                            </div>
                            <HrStatusBadge status={entry.status} />
                          </div>
                          <div className="mt-3 space-y-2">
                            {entry.stage && (
                              <DetailRow label={entry.status === 'IN_PROGRESS' ? 'Current Recruitment Stage' : 'Rejection Stage'}>
                                {HR_STAGE_LABELS[entry.stage] || entry.stage}
                              </DetailRow>
                            )}
                            <DetailRow label="Comment">{entry.comment || 'N/A'}</DetailRow>
                            <DetailRow label="Action">
                              {entry.action === 'FINALIZE' || entry.is_locked ? 'Finalized & Locked' : 'Draft Saved'}
                            </DetailRow>
                          </div>
                          {entry.status === 'ACCEPTED' && (
                            <div className="mt-3">
                              <OfferDetails evaluation={entry} compact />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* HR Evaluation Form / Locked State */}
              {isHrLocked ? (
                <section className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
                  <div className="flex items-start gap-3">
                    <Lock size={22} className="mt-0.5 shrink-0 text-green-700" />
                    <div>
                      <h3 className="font-semibold text-green-900">HR Evaluation Permanently Finalized</h3>
                      <p className="mt-2 text-sm leading-relaxed text-green-800">
                        The recruitment evaluation and its final outcome have been permanently locked.
                        No HR employee can modify the decision, comments, offer status, outcome, or joining date.
                      </p>
                      <p className="mt-2 text-xs text-green-700">
                        All previous revisions remain available in the HR evaluation history.
                      </p>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="mt-6 border-t border-gray-200 pt-5">
                  <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                    <Briefcase size={18} /> {hasHrEvaluation ? 'Update HR Evaluation Draft' : 'Create HR Evaluation'}
                  </h3>
                  <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                    <p className="font-semibold">How this workflow works</p>
                    <p className="mt-1">
                      Save as Draft to continue editing later. Any authorized HR employee can update an unlocked evaluation.
                      In Progress evaluations require a recruitment stage and can only be saved as drafts.
                      For selected candidates, record offer release and the final outcome before using Finalize & Lock.
                      Rejected candidates can be finalized after entering the rejection details.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* HR Status */}
                    <div>
                      <label htmlFor={`hr-status-${localReferral.id}`} className="mb-2 block text-sm font-medium">
                        HR Evaluation Status <span className="text-red-600">*</span>
                      </label>
                      <select id={`hr-status-${localReferral.id}`}
                        className="w-full rounded border border-gray-300 p-2"
                        value={status}
                        onChange={(event) => handleStatusChange(event.target.value)}
                        disabled={submitting || refreshing} required>
                        <option value="">-- Select Status --</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="ACCEPTED">Selected</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>

                    {/* Current Recruitment Stage / Rejection Stage */}
                    {(status === 'IN_PROGRESS' || status === 'REJECTED') && (
                      <div>
                        <label htmlFor={`hr-stage-${localReferral.id}`} className="mb-2 block text-sm font-medium">
                          {status === 'IN_PROGRESS' ? 'Current Recruitment Stage' : 'Rejection Stage'}
                          <span className="ml-1 text-red-600">*</span>
                        </label>
                        <select id={`hr-stage-${localReferral.id}`}
                          className="w-full rounded border border-gray-300 p-2"
                          value={stage}
                          onChange={(event) => setStage(event.target.value)}
                          disabled={submitting || refreshing} required>
                          <option value="">
                            {status === 'IN_PROGRESS' ? '-- Select Current Recruitment Stage --' : '-- Select Rejection Stage --'}
                          </option>
                          {(status === 'IN_PROGRESS' ? IN_PROGRESS_STAGES : REJECTION_STAGES).map((value) => (
                            <option key={value} value={value}>{HR_STAGE_LABELS[value]}</option>
                          ))}
                        </select>
                        {status === 'IN_PROGRESS' && (
                          <p className="mt-2 text-xs text-blue-700">
                            Select the candidate's current recruitment stage. This evaluation can be saved as a draft but cannot be finalized.
                          </p>
                        )}
                      </div>
                    )}

                    {/* HR Comment */}
                    <div>
                      <label htmlFor={`hr-comment-${localReferral.id}`} className="mb-2 block text-sm font-medium">
                        HR Evaluation Comment <span className="text-red-600">*</span>
                      </label>
                      <textarea id={`hr-comment-${localReferral.id}`}
                        className="w-full rounded border border-gray-300 p-2"
                        rows={4}
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        disabled={submitting || refreshing}
                        placeholder="Enter evaluation details..." required />
                      <div className="mt-2 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
                        <p className="font-semibold">Details to fill:</p>
                        <p className="mt-1"><strong>If Rejected:</strong> Select the rejection stage and provide the reason for rejection.</p>
                        <p className="mt-1"><strong>If Selected — Full Time:</strong> Enter designation, work location, and band. Record the joining date separately if the candidate joins.</p>
                        <p className="mt-1"><strong>If Selected — Intern:</strong> Enter designation, internship period, and internship location.</p>
                        <p className="mt-1"><strong>If In Progress:</strong> Select the current recruitment stage and provide progress or evaluation notes.</p>
                      </div>
                    </div>

                    {/* ================================================== */}
                    {/* OFFER & JOINING WORKFLOW */}
                    {/* ================================================== */}
                    {status === 'ACCEPTED' && (
                      <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4 sm:p-5">
                        <div className="mb-4">
                          <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                            <ClipboardCheck size={19} className="text-orange-600" /> Offer & Joining Details
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-gray-600">
                            Complete these details as the selected candidate progresses through the offer and joining process.
                          </p>
                        </div>

                        {/* Offer Released Checkbox */}
                        <label htmlFor={`offer-released-${localReferral.id}`}
                          className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                            offerReleased ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                          } ${submitting || refreshing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                          <input type="checkbox" id={`offer-released-${localReferral.id}`}
                            checked={offerReleased}
                            onChange={(event) => handleOfferReleasedChange(event.target.checked)}
                            disabled={submitting || refreshing}
                            className="mt-1 h-4 w-4 shrink-0 accent-green-600" />
                          <span>
                            <span className="block text-sm font-semibold text-gray-900">Offer Released?</span>
                            <span className="mt-1 block text-xs leading-relaxed text-gray-600">
                              Check this box only after the official offer has been released to the candidate.
                            </span>
                          </span>
                          {offerReleased && <CheckCircle2 size={19} className="ml-auto shrink-0 text-green-600" />}
                        </label>

                        {/* Offer Outcome */}
                        {offerReleased && (
                          <div className="mt-4">
                            <label htmlFor={`offer-outcome-${localReferral.id}`}
                              className="mb-2 block text-sm font-medium text-gray-900">
                              Final Offer Outcome
                            </label>
                            <select id={`offer-outcome-${localReferral.id}`}
                              className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                              value={offerOutcome}
                              onChange={(event) => handleOfferOutcomeChange(event.target.value)}
                              disabled={submitting || refreshing}>
                              <option value="">-- Select Offer Outcome --</option>
                              <option value="OFFER_DECLINED">Offer Declined</option>
                              <option value="DID_NOT_JOIN">Did Not Join</option>
                              <option value="JOINED">Joined</option>
                            </select>
                            {!offerOutcome && (
                              <p className="mt-2 text-xs text-amber-700">
                                {"You can save this as a draft while waiting for the candidate's final response."}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Joining Date */}
                        {offerReleased && offerOutcome === 'JOINED' && (
                          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                            <label htmlFor={`joining-date-${localReferral.id}`}
                              className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-900">
                              <CalendarDays size={17} /> Date of Joining <span className="text-red-600">*</span>
                            </label>
                            <input type="date" id={`joining-date-${localReferral.id}`}
                              value={joiningDate}
                              onChange={(event) => setJoiningDate(event.target.value)}
                              disabled={submitting || refreshing}
                              className="w-full rounded-lg border border-green-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200" />
                            <p className="mt-2 text-xs text-green-800">
                              {"Enter the candidate's actual date of joining. This field is mandatory before finalization."}
                            </p>
                          </div>
                        )}

                        {/* Offer Status Preview */}
                        <div className={`mt-4 rounded-lg border p-3 text-sm ${getOfferOutcomeColor(offerOutcome)}`}>
                          <p className="font-semibold">Current Offer Status</p>
                          <p className="mt-1">
                            {!offerReleased
                              ? 'Offer not released yet.'
                              : !offerOutcome
                                ? 'Offer released. Awaiting candidate outcome.'
                                : `Final outcome: ${OFFER_OUTCOME_LABELS[offerOutcome]}`}
                          </p>
                          {offerOutcome === 'JOINED' && joiningDate && (
                            <p className="mt-1 font-medium">Joining Date: {formatJoiningDate(joiningDate)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Save / Finalize Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button type="button" onClick={() => saveEvaluation('SAVE_DRAFT')}
                        disabled={submitting || refreshing || isHrLocked || !canSaveDraft}
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">
                        {submitting ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                        Save as Draft
                      </button>
                      <button type="button" onClick={handleFinalizeClick}
                        disabled={submitting || refreshing || isHrLocked || !canFinalize}
                        title={status === 'IN_PROGRESS'
                          ? 'In Progress evaluations cannot be finalized.'
                          : !canFinalize ? 'Complete all required finalization fields first.' : 'Finalize and permanently lock'}
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40">
                        <Lock size={17} /> Finalize & Lock
                      </button>
                      <button type="button" onClick={() => setExpanded(false)}
                        disabled={submitting}
                        className="cursor-pointer rounded-lg bg-[#111111] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                        Close
                      </button>
                    </div>
                    {status === 'IN_PROGRESS' && (
                      <p className="text-xs text-blue-700">
                        In Progress evaluations can be saved as drafts. Finalize & Lock is unavailable until the status changes to Selected or Rejected.
                      </p>
                    )}
                    {!canFinalize && status === 'ACCEPTED' && (
                      <p className="text-xs text-amber-700">
                        Finalization becomes available after the offer is released, an outcome is selected,
                        and a joining date is entered if the candidate joined.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {isHrLocked && (
                <div className="mt-5 flex justify-end">
                  <button type="button" onClick={() => setExpanded(false)}
                    className="cursor-pointer rounded-lg bg-[#111111] px-4 py-2 text-sm font-medium text-white">
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finalization Warning */}
        {expanded && showFinalizeWarning && !isHrLocked && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
            role="alertdialog" aria-modal="true"
            aria-labelledby={`finalize-title-${localReferral.id}`}
            aria-describedby={`finalize-description-${localReferral.id}`}>
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-3">
                  <AlertTriangle size={24} className="text-amber-600" />
                </div>
                <h3 id={`finalize-title-${localReferral.id}`} className="text-lg font-bold text-gray-900">
                  Permanently Finalize HR Evaluation?
                </h3>
              </div>
              <p id={`finalize-description-${localReferral.id}`} className="text-sm leading-relaxed text-gray-700">
                You are about to permanently finalize the HR evaluation for{' '}
                <strong>{localReferral.candidate_name}</strong>.
              </p>
              <div className="mt-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p><strong>Final Decision:</strong> {HR_STATUS_LABELS[status] || status}</p>
                {status === 'REJECTED' && (
                  <p><strong>Rejection Stage:</strong> {HR_STAGE_LABELS[stage] || stage}</p>
                )}
                {status === 'ACCEPTED' && (
                  <>
                    <p><strong>Offer Released:</strong> {offerReleased ? 'Yes' : 'No'}</p>
                    <p><strong>Offer Outcome:</strong> {OFFER_OUTCOME_LABELS[offerOutcome] || 'Not Selected'}</p>
                    {offerOutcome === 'JOINED' && (
                      <p><strong>Date of Joining:</strong> {formatJoiningDate(joiningDate)}</p>
                    )}
                  </>
                )}
                <div className="border-t border-amber-200 pt-3">
                  <p className="font-semibold">Once finalized:</p>
                  <p className="mt-2">• The HR evaluation and offer details will be permanently locked.</p>
                  <p>• No HR employee can modify the recorded decision or outcome.</p>
                  <p>• The final recruitment decision will be recorded.</p>
                  <p>• The complete revision history will be retained.</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-red-700">
                This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowFinalizeWarning(false)}
                  disabled={submitting}
                  className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                  Cancel
                </button>
                <button type="button" onClick={() => saveEvaluation('FINALIZE')}
                  disabled={submitting || refreshing || isHrLocked || !canFinalize}
                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  Confirm & Lock
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}