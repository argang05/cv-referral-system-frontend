'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ReferralProgressBar from './ReferralProgressBar';
import axios from 'axios';
import { toast } from 'sonner';

import {
  CheckCircle,
  FileText,
  UserCheck,
  X,
  Ban,
  Briefcase,
  Loader2,
  History,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

import { useUser } from '@/context/UserContext';

// ==========================================================
// CONSTANTS
// ==========================================================

const STATUS_CONFIG = {
  PENDING_REVIEW: {
    color: 'text-purple-600',
    label: 'Awaiting SBU Review',
    icon: FileText,
  },

  CONSIDERED: {
    color: 'text-blue-600',
    label: 'Recommended by SBU',
    icon: UserCheck,
  },

  REJECTED: {
    color: 'text-red-600',
    label: 'Rejected by SBU',
    icon: X,
  },

  FINAL_ACCEPTED: {
    color: 'text-green-600',
    label: 'Selected by HR',
    icon: CheckCircle,
  },

  FINAL_REJECTED: {
    color: 'text-red-600',
    label: 'Rejected by HR',
    icon: Ban,
  },
};

const REFERRAL_REASON_LABELS = {
  COURTESY:
    'Courtesy Referral – Shared out of obligation or goodwill',

  POTENTIAL_FIT:
    'Potential Fit Referral – Strong background, depends on role fitment',

  DIRECT_ROLE_FIT:
    'Direct Role Fit Referral – Clearly aligned to an open position',

  INTERNAL_NETWORK:
    'Internal Network Referral – Former colleague or vendor contact',

  STRATEGIC:
    'Strategic Referral – High-value or niche candidate for special review',
};

const HR_STAGE_LABELS = {
  TEST: 'Test',
  T1: 'Technical Round 1',
  T2: 'Technical Round 2',
  T3: 'Technical Round 3',
  HR: 'HR Round',
  OTHER: 'Other Reason',
};

const HR_STATUS_LABELS = {
  IN_PROGRESS: 'In Progress',
  ACCEPTED: 'Selected',
  REJECTED: 'Rejected',
};

// ==========================================================
// HELPERS
// ==========================================================

function formatDate(value) {
  if (!value) return 'N/A';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'N/A'
    : date.toLocaleString();
}

function getDecisionLabel(decision) {
  switch (decision) {
    case 'CONSIDERED':
      return 'Recommended for HR Evaluation';

    case 'REJECTED':
      return 'Not Recommended for HR Evaluation';

    default:
      return 'N/A';
  }
}

function getReviewerName(review) {
  const reviewer = review?.reviewed_by;

  if (!reviewer) return 'Unknown Reviewer';

  if (typeof reviewer === 'object') {
    return reviewer.name || reviewer.email || 'Unknown Reviewer';
  }

  return String(reviewer);
}

function getReviewerEmail(review) {
  const reviewer = review?.reviewed_by;

  if (reviewer && typeof reviewer === 'object') {
    return reviewer.email || null;
  }

  return null;
}

function getStatusInfo(referral) {
  const currentStatus = referral?.current_status;

  const config = STATUS_CONFIG[currentStatus] || {
    color: 'text-gray-600',
    label: 'Unknown Status',
    icon: FileText,
  };

  if (
    currentStatus === 'REJECTED' &&
    referral?.rejection_stage === 'HR'
  ) {
    return {
      ...config,
      label: 'Rejected by HR',
    };
  }

  if (
    currentStatus === 'CONSIDERED' &&
    referral?.hr_evaluation
  ) {
    return {
      ...config,
      label: 'HR Evaluation in Progress',
      icon: Briefcase,
    };
  }

  if (currentStatus === 'CONSIDERED') {
    return {
      ...config,
      label: 'Recommended by SBU — Awaiting HR',
    };
  }

  return config;
}

function normalizeReviewHistory(referral) {
  const history = Array.isArray(referral?.review_history)
    ? [...referral.review_history]
    : [];

  // Backward compatibility if only the latest review exists.
  if (history.length === 0 && referral?.review) {
    history.push(referral.review);
  }

  // The backend uses append-only reviews.
  // A higher review ID represents a later revision.
  return history.sort(
    (a, b) => Number(b.id || 0) - Number(a.id || 0)
  );
}

function getApiError(error, fallback) {
  const data = error?.response?.data;

  if (typeof data?.error === 'string') {
    return data.error;
  }

  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  if (typeof data?.message === 'string') {
    return data.message;
  }

  return fallback;
}

// ==========================================================
// SMALL DISPLAY COMPONENTS
// ==========================================================

function DetailRow({ label, children }) {
  return (
    <div className="text-sm leading-relaxed">
      <span className="font-semibold text-gray-800">
        {label}:
      </span>{' '}
      <span className="text-gray-700">
        {children}
      </span>
    </div>
  );
}

function ReviewDecisionBadge({ decision }) {
  const isRecommended = decision === 'CONSIDERED';

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        isRecommended
          ? 'bg-green-100 text-green-700'
          : decision === 'REJECTED'
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-700'
      }`}
    >
      {getDecisionLabel(decision)}
    </span>
  );
}

// ==========================================================
// MAIN COMPONENT
// ==========================================================

export default function ReferralCardHR({ referral }) {
  const { user } = useUser();

  // --------------------------------------------------------
  // STATE
  // --------------------------------------------------------

  const [expanded, setExpanded] = useState(false);

  const [localReferral, setLocalReferral] = useState(referral);

  const [stage, setStage] = useState(
    referral?.hr_evaluation?.stage || ''
  );

  const [status, setStatus] = useState(
    referral?.hr_evaluation?.status || ''
  );

  const [comment, setComment] = useState(
    referral?.hr_evaluation?.comment || ''
  );

  const [submitting, setSubmitting] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [showHistory, setShowHistory] = useState(false);

  // --------------------------------------------------------
  // SYNC WITH PARENT
  // --------------------------------------------------------

  useEffect(() => {
    setLocalReferral(referral);

    setStage(referral?.hr_evaluation?.stage || '');

    setStatus(referral?.hr_evaluation?.status || '');

    setComment(referral?.hr_evaluation?.comment || '');
  }, [referral]);

  // --------------------------------------------------------
  // REVIEW DATA
  // --------------------------------------------------------

  const reviewHistory = normalizeReviewHistory(localReferral);

  const latestReview = reviewHistory[0] || null;

  const previousReviews = reviewHistory.slice(1);

  const statusInfo = getStatusInfo(localReferral);

  const StatusIcon = statusInfo.icon;

  const hasHrEvaluation = Boolean(
    localReferral?.hr_evaluation
  );

  // --------------------------------------------------------
  // UPDATE LOCAL REFERRAL
  // --------------------------------------------------------

  const updateReferralState = (updatedReferral) => {
    if (!updatedReferral) return;

    setLocalReferral(updatedReferral);

    setStage(
      updatedReferral?.hr_evaluation?.stage || ''
    );

    setStatus(
      updatedReferral?.hr_evaluation?.status || ''
    );

    setComment(
      updatedReferral?.hr_evaluation?.comment || ''
    );
  };

  // --------------------------------------------------------
  // REFRESH REFERRAL
  // --------------------------------------------------------

  const refreshReferral = async ({
    showSuccess = false,
  } = {}) => {
    setRefreshing(true);

    try {
      const response = await axios.get('/api/hr-evaluation');

      const referrals = Array.isArray(response.data)
        ? response.data
        : [];

      const updatedReferral = referrals.find(
        (item) =>
          String(item.id) === String(localReferral.id)
      );

      if (!updatedReferral) {
        throw new Error(
          'Referral was not found in the HR evaluation response.'
        );
      }

      updateReferralState(updatedReferral);

      if (showSuccess) {
        toast.success('Referral details refreshed.');
      }

      return updatedReferral;
    } catch (error) {
      console.error('Failed to refresh referral:', error);

      if (showSuccess) {
        toast.error(
          'Unable to refresh referral details.'
        );
      }

      throw error;
    } finally {
      setRefreshing(false);
    }
  };

  // --------------------------------------------------------
  // OPEN DETAILS
  // --------------------------------------------------------

  const handleOpenDetails = async () => {
    setExpanded(true);

    try {
      await refreshReferral();
    } catch {
      // Keep displaying the existing referral data.
    }
  };

  // --------------------------------------------------------
  // SUBMIT / UPDATE HR EVALUATION
  // --------------------------------------------------------

  const handleSubmit = async () => {
    if (submitting) return;

    if (!user?.emp_id) {
      toast.error(
        'Unable to identify the logged-in HR employee.'
      );
      return;
    }

    if (!status) {
      toast.error('Please select an HR evaluation status.');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please enter an HR evaluation comment.');
      return;
    }

    if (status === 'REJECTED' && !stage) {
      toast.error('Please select the rejection stage.');
      return;
    }

    setSubmitting(true);

    try {
      const method = hasHrEvaluation ? 'PUT' : 'POST';

      const payload = {
        referral_id: localReferral.id,
        emp_id: user.emp_id,
        status,
        stage: status === 'REJECTED' ? stage : '',
        comment: comment.trim(),
      };

      await axios({
        method,
        url: '/api/hr-evaluation',
        data: payload,
      });

      toast.success(
        hasHrEvaluation
          ? 'HR evaluation updated successfully!'
          : 'HR evaluation submitted successfully!'
      );

      try {
        await refreshReferral();
      } catch {
        toast.warning(
          'Evaluation saved, but the latest details could not be refreshed.'
        );
      }

      setExpanded(false);
    } catch (error) {
      console.error(
        'HR evaluation failed:',
        error?.response?.data || error
      );

      toast.error(
        getApiError(
          error,
          'Failed to save HR evaluation.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <Card className="w-full">
      <CardContent className="px-4 py-3">

        {/* ==================================================
            CANDIDATE SUMMARY
        ================================================== */}

        <div className="flex items-center justify-between gap-4">

          <div className="min-w-0">
            <h3 className="font-semibold text-[18px] text-gray-900">
              {localReferral.candidate_name}
            </h3>

            <p className="text-xs text-gray-500 mt-1">
              {localReferral.candidate_type}
            </p>
          </div>

          <span
            className={`flex shrink-0 items-center gap-1 text-xs sm:text-sm font-medium ${statusInfo.color}`}
          >
            <StatusIcon size={16} />

            {statusInfo.label}
          </span>

        </div>

        <button
          type="button"
          onClick={handleOpenDetails}
          className="mt-3 text-sm text-blue-600 underline cursor-pointer"
        >
          View Details
        </button>

        {/* ==================================================
            DETAILS MODAL
        ================================================== */}

        {expanded && (

          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-label="HR Referral Details"
          >

            <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-xl bg-white p-4 sm:p-6 shadow-xl">

              {/* --------------------------------------------
                  MODAL HEADER
              -------------------------------------------- */}

              <div className="mb-5 flex items-start justify-between gap-4">

                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {localReferral.candidate_name}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    HR Evaluation Details
                  </p>
                </div>

                <div className="flex items-center gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      refreshReferral({
                        showSuccess: true,
                      }).catch(() => {})
                    }
                    disabled={refreshing || submitting}
                    className="cursor-pointer text-gray-500 hover:text-blue-600 disabled:opacity-50"
                    title="Refresh referral"
                    aria-label="Refresh referral"
                  >
                    <RefreshCw
                      size={18}
                      className={
                        refreshing ? 'animate-spin' : ''
                      }
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    disabled={submitting}
                    className="cursor-pointer text-gray-500 hover:text-red-600 disabled:opacity-50"
                    aria-label="Close"
                  >
                    <X size={21} />
                  </button>

                </div>

              </div>

              {/* --------------------------------------------
                  REFERRAL PROGRESS
              -------------------------------------------- */}

              <ReferralProgressBar
                currentStatus={localReferral.current_status}
                rejection_stage={localReferral.rejection_stage}
                submitted_at={localReferral.submitted_at}
                considered_at={localReferral.considered_at}
                final_at={localReferral.final_at}
              />

              {/* --------------------------------------------
                  CANDIDATE INFORMATION
              -------------------------------------------- */}

              <section className="mt-6">

                <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <FileText size={18} />
                  Candidate Information
                </h3>

                <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">

                  <DetailRow label="Candidate Email">
                    {localReferral.candidate_email || 'N/A'}
                  </DetailRow>

                  <DetailRow label="Candidate Phone">
                    {localReferral.candidate_phone || 'N/A'}
                  </DetailRow>

                  <DetailRow label="CV">
                    {localReferral.cv_url ? (
                      <a
                        href={localReferral.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Download CV
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </DetailRow>

                  <DetailRow label="Submitted At">
                    {formatDate(localReferral.submitted_at)}
                  </DetailRow>

                  <DetailRow label="SBUs">
                    {localReferral.sbus?.length
                      ? localReferral.sbus
                          .map((sbu) => sbu.name)
                          .join(', ')
                      : 'N/A'}
                  </DetailRow>

                  <DetailRow label="Referrer">
                    {localReferral.referrer?.name || 'N/A'}
                  </DetailRow>

                  <DetailRow label="Referrer Email">
                    {localReferral.referrer?.email || 'N/A'}
                  </DetailRow>

                  <DetailRow label="Referral Category">
                    {REFERRAL_REASON_LABELS[
                      localReferral.referral_reason_type
                    ] || 'N/A'}
                  </DetailRow>

                  <DetailRow label="Referrer Comments">
                    {localReferral.additional_comment || 'N/A'}
                  </DetailRow>

                </div>

              </section>

              {/* ============================================
                  LATEST SBU RECOMMENDATION
              ============================================ */}

              <section className="mt-6">

                <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <UserCheck size={18} />
                  Latest SBU Recommendation
                </h3>

                {latestReview ? (

                  <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">

                    {/* Latest decision */}

                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <span className="text-sm font-semibold text-gray-800">
                        Latest Decision
                      </span>

                      <ReviewDecisionBadge
                        decision={latestReview.decision}
                      />

                    </div>

                    {/* Reviewer */}

                    <div className="mt-4 space-y-2">

                      <DetailRow label="Reviewed By">
                        {getReviewerName(latestReview)}
                      </DetailRow>

                      {getReviewerEmail(latestReview) && (
                        <DetailRow label="Reviewer Email">
                          {getReviewerEmail(latestReview)}
                        </DetailRow>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={15} />

                        <span>
                          {formatDate(
                            latestReview.reviewed_at
                          )}
                        </span>
                      </div>

                    </div>

                    {/* Comment */}

                    <div className="mt-4 border-t border-blue-100 pt-3">

                      <p className="text-sm font-semibold text-gray-800">
                        Reviewer Comment
                      </p>

                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
                        {latestReview.comment || 'N/A'}
                      </p>

                    </div>

                    <p className="mt-3 text-xs font-medium text-blue-700">
                      This is the latest recorded SBU decision.
                    </p>

                  </div>

                ) : (

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">
                      No SBU review is available.
                    </p>
                  </div>

                )}

              </section>

              {/* ============================================
                  COMPLETE SBU REVIEW HISTORY
              ============================================ */}

              {reviewHistory.length > 0 && (

                <section className="mt-5">

                  <button
                    type="button"
                    onClick={() =>
                      setShowHistory((previous) => !previous)
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left cursor-pointer hover:bg-gray-50"
                    aria-expanded={showHistory}
                  >

                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <History size={18} />

                      Complete SBU Review History

                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {reviewHistory.length}
                      </span>
                    </span>

                    {showHistory ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}

                  </button>

                  {showHistory && (

                    <div className="mt-3 space-y-3">

                      {reviewHistory.map((review, index) => {

                        const isLatest = index === 0;

                        return (

                          <div
                            key={review.id ?? index}
                            className={`rounded-lg border p-4 ${
                              isLatest
                                ? 'border-blue-200 bg-blue-50/40'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >

                            {/* Review header */}

                            <div className="flex flex-wrap items-start justify-between gap-3">

                              <div>

                                <p className="text-sm font-semibold text-gray-900">
                                  {getReviewerName(review)}
                                </p>

                                {getReviewerEmail(review) && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    {getReviewerEmail(review)}
                                  </p>
                                )}

                                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                  <Clock size={13} />

                                  {formatDate(
                                    review.reviewed_at
                                  )}
                                </p>

                              </div>

                              <ReviewDecisionBadge
                                decision={review.decision}
                              />

                            </div>

                            {/* Review comment */}

                            <div className="mt-3">

                              <p className="text-xs font-semibold text-gray-600">
                                Reviewer Comment
                              </p>

                              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
                                {review.comment || 'N/A'}
                              </p>

                            </div>

                            {/* History position */}

                            <div className="mt-3 border-t border-gray-200 pt-2">

                              <span
                                className={`text-xs font-semibold ${
                                  isLatest
                                    ? 'text-blue-700'
                                    : 'text-gray-500'
                                }`}
                              >
                                {isLatest
                                  ? 'Latest SBU Decision'
                                  : 'Previous SBU Decision'}
                              </span>

                            </div>

                          </div>

                        );
                      })}

                      {previousReviews.length > 0 && (
                        <p className="text-xs text-gray-500">
                          Previous decisions are retained for
                          transparency. Only the latest SBU
                          recommendation is currently effective.
                        </p>
                      )}

                    </div>

                  )}

                </section>

              )}

              {/* ============================================
                  PREVIOUS HR EVALUATION
              ============================================ */}

              {hasHrEvaluation && (

                <section className="mt-6">

                  <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
                    <Briefcase size={18} />
                    Current HR Evaluation
                  </h3>

                  <div className="space-y-2 rounded-lg border border-purple-200 bg-purple-50 p-4">

                    <DetailRow label="Stage">
                      {HR_STAGE_LABELS[
                        localReferral.hr_evaluation.stage
                      ] || 'N/A'}
                    </DetailRow>

                    <DetailRow label="Status">
                      {HR_STATUS_LABELS[
                        localReferral.hr_evaluation.status
                      ] || localReferral.hr_evaluation.status}
                    </DetailRow>

                    <DetailRow label="Comment">
                      {localReferral.hr_evaluation.comment || 'N/A'}
                    </DetailRow>

                    <DetailRow label="Updated At">
                      {formatDate(
                        localReferral.hr_evaluation.updated_at
                      )}
                    </DetailRow>

                    <DetailRow label="Updated By">
                      {localReferral.hr_evaluation.updated_by || 'N/A'}
                    </DetailRow>

                  </div>

                </section>

              )}

              {/* ============================================
                  HR EVALUATION FORM
              ============================================ */}

              <section className="mt-6 border-t border-gray-200 pt-5">

                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <Briefcase size={18} />

                  {hasHrEvaluation
                    ? 'Update HR Evaluation'
                    : 'Submit HR Evaluation'}
                </h3>

                <div className="space-y-4">

                  {/* Status */}

                  <div>
                    <label
                      htmlFor={`hr-status-${localReferral.id}`}
                      className="mb-2 block text-sm font-medium"
                    >
                      HR Evaluation Status
                    </label>

                    <select
                      id={`hr-status-${localReferral.id}`}
                      className="w-full rounded border border-gray-300 p-2"
                      value={status}
                      onChange={(event) => {
                        const nextStatus = event.target.value;

                        setStatus(nextStatus);

                        if (nextStatus !== 'REJECTED') {
                          setStage('');
                        }
                      }}
                      disabled={submitting}
                    >
                      <option value="">
                        -- Select Status --
                      </option>

                      <option value="IN_PROGRESS">
                        In Progress
                      </option>

                      <option value="ACCEPTED">
                        Selected
                      </option>

                      <option value="REJECTED">
                        Rejected
                      </option>
                    </select>
                  </div>

                  {/* Rejection Stage */}

                  {status === 'REJECTED' && (

                    <div>

                      <label
                        htmlFor={`hr-stage-${localReferral.id}`}
                        className="mb-2 block text-sm font-medium"
                      >
                        Rejection Stage
                      </label>

                      <select
                        id={`hr-stage-${localReferral.id}`}
                        className="w-full rounded border border-gray-300 p-2"
                        value={stage}
                        onChange={(event) =>
                          setStage(event.target.value)
                        }
                        disabled={submitting}
                      >
                        <option value="">
                          -- Select Rejection Stage --
                        </option>

                        {Object.entries(
                          HR_STAGE_LABELS
                        ).map(([value, label]) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {label}
                          </option>
                        ))}

                      </select>

                    </div>

                  )}

                  {/* Comment */}

                  <div>

                    <label
                      htmlFor={`hr-comment-${localReferral.id}`}
                      className="mb-2 block text-sm font-medium"
                    >
                      HR Evaluation Comment
                    </label>

                    <textarea
                      id={`hr-comment-${localReferral.id}`}
                      className="w-full rounded border border-gray-300 p-2"
                      rows={4}
                      value={comment}
                      onChange={(event) =>
                        setComment(event.target.value)
                      }
                      disabled={submitting}
                      placeholder="Enter evaluation details..."
                    />

                    <div className="mt-2 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">

                      <p className="font-semibold">
                        Details to fill:
                      </p>

                      <p className="mt-1">
                        <strong>If Rejected:</strong>{' '}
                        Select the rejection stage and
                        provide the reason for rejection.
                      </p>

                      <p className="mt-1">
                        <strong>If Selected — Full Time:</strong>{' '}
                        Enter designation, date of joining,
                        work location, and band.
                      </p>

                      <p className="mt-1">
                        <strong>If Selected — Intern:</strong>{' '}
                        Enter designation, internship period,
                        and internship location.
                      </p>

                      <p className="mt-1">
                        <strong>If In Progress:</strong>{' '}
                        Provide the current recruitment
                        progress or evaluation notes.
                      </p>

                    </div>

                  </div>

                  {/* Action buttons */}

                  <div className="flex flex-wrap items-center gap-3 pt-2">

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting || refreshing}
                      className="flex items-center justify-center gap-2 rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white cursor-pointer hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {submitting ? (
                        <>
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                          Saving...
                        </>
                      ) : (
                        hasHrEvaluation
                          ? 'Update Evaluation'
                          : 'Submit Evaluation'
                      )}

                    </button>

                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      disabled={submitting}
                      className="rounded bg-[#111111] px-4 py-2 text-sm font-medium text-white cursor-pointer disabled:opacity-60"
                    >
                      Close
                    </button>

                  </div>

                </div>

              </section>

            </div>

          </div>

        )}

      </CardContent>
    </Card>
  );
}