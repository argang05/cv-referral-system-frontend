'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

import ReferralProgressBar from './ReferralProgressBar';
import EditReviewForm from './EditReviewForm';

import { toast } from 'sonner';

import {
  FileText,
  Briefcase,
  CheckCircle,
  X,
  Ban,
  Loader2,
  History,
  UserCheck,
  Clock,
  Lock,
} from 'lucide-react';

// ==========================================================
// Status configuration
// ==========================================================

const statusMap = {
  PENDING_REVIEW: {
    color: 'text-purple-500',
    label: 'Submitted',
    icon: FileText,
  },

  CONSIDERED: {
    color: 'text-blue-600',
    label: 'SBU Approved',
    icon: UserCheck, 
  },

  REJECTED: {
    color: 'text-red-600',
    label: 'Rejected by SBU',
    icon: X,
  },

  FINAL_ACCEPTED: {
    color: 'text-green-600',
    label: 'Accepted by HR',
    icon: CheckCircle,
  },

  FINAL_REJECTED: {
    color: 'text-red-600',
    label: 'Rejected by HR',
    icon: Ban,
  },
};

// ==========================================================
// Referral category labels
// ==========================================================

const referralReasonLabels = {
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

// ==========================================================
// Date formatter
// ==========================================================

const formatDate = (value) => {
  if (!value) return 'N/A';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleString();
};

// ==========================================================
// Decision label
// ==========================================================

const getDecisionLabel = (decision) => {
  if (decision === 'CONSIDERED') {
    return 'Recommended for HR Evaluation';
  }

  if (decision === 'REJECTED') {
    return 'Not Recommended for HR Evaluation';
  }

  return 'N/A';
};

// ==========================================================
// Main Component
// ==========================================================

export default function ReferralCardSBU({
  referral,
  emp_id,
}) {
  // ========================================================
  // State
  // ========================================================

  const [expanded, setExpanded] = useState(false);

  const [decision, setDecision] = useState('');

  const [comment, setComment] = useState('');

  const [localReferral, setLocalReferral] = useState(
    referral
  );

  const [showEditReview, setShowEditReview] = useState(
    false
  );

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [showHistory, setShowHistory] = useState(false);

  // ========================================================
  // Synchronize when parent referral changes
  // ========================================================

  useEffect(() => {
    setLocalReferral(referral);
  }, [referral]);

  // ========================================================
  // Derived review information
  // ========================================================

  const currentReview = localReferral.review;

  const hasExistingReview = Boolean(currentReview);

  const reviewHistory = Array.isArray(
    localReferral.review_history
  )
    ? localReferral.review_history
    : [];

  const isFinalized = [
    'FINAL_ACCEPTED',
    'FINAL_REJECTED',
  ].includes(localReferral.current_status);

  const hrStarted = Boolean(
    localReferral.hr_evaluation_started ||
    localReferral.hr_evaluation
  );

  // Backend determines whether revisions are permitted.
  const canEditReview =
    localReferral.can_edit_sbu_review === true &&
    !hrStarted &&
    !isFinalized;

  // ========================================================
  // Status
  // ========================================================

  const statusConfig =
    statusMap[localReferral.current_status] || {
      color: 'text-gray-500',
      label: 'Unknown',
      icon: FileText,
    };

  const StatusIcon = statusConfig.icon;

  const statusLabel =
    localReferral.current_status === 'REJECTED' &&
    localReferral.rejection_stage === 'HR'
      ? 'Rejected by HR'
      : statusConfig.label;

  // ========================================================
  // Refresh referral data
  // ========================================================

  const refreshReferral = async () => {
    setRefreshing(true);

    try {
      const response = await axios.get(
        `/api/reviews?emp_id=${emp_id}`
      );

      const updated = response.data.find(
        (item) => item.id === localReferral.id
      );

      if (updated) {
        setLocalReferral(updated);
      }

      return updated;
    } catch (error) {
      console.error(
        'Failed to refresh referral:',
        error.response?.data || error.message
      );

      toast.error(
        'Could not refresh the latest review information.'
      );

      throw error;
    } finally {
      setRefreshing(false);
    }
  };

  // ========================================================
  // Open modal with latest review data
  // ========================================================

  const handleOpenDetails = async () => {
    setExpanded(true);

    try {
      await refreshReferral();
    } catch {
      // Existing referral data remains visible.
    }
  };

  // ========================================================
  // Submit initial review
  // ========================================================

  const handleReviewSubmit = async () => {
    if (loading) return;

    if (!decision) {
      toast.warning('Please select a decision.');
      return;
    }

    if (!comment.trim()) {
      toast.warning('Please enter a review comment.');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/reviews', {
        referral_id: localReferral.id,
        decision,
        comment: comment.trim(),
        emp_id,

        // Initial submission expects no existing review.
        expected_review_id: null,
      });

      toast.success(
        'SBU review submitted successfully!'
      );

      setDecision('');
      setComment('');

      await refreshReferral();

    } catch (error) {
      console.error(
        'Review submission failed:',
        error.response?.data || error.message
      );

      if (error.response?.status === 409) {
        toast.error(
          'Another reviewer has already submitted a decision. Refresh to view it.'
        );

        try {
          await refreshReferral();
        } catch {
          // Refresh error already handled.
        }

      } else {
        toast.error(
          error.response?.data?.error ||
          'Failed to submit review.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // Handle successful review revision
  // ========================================================

  const handleRevisionSuccess = async () => {
    await refreshReferral();

    setShowEditReview(false);
  };

  // ========================================================
  // UI
  // ========================================================

  return (
    <>

      {/* ====================================================
          Referral Card
      ==================================================== */}

      <div className="bg-white shadow rounded-xl p-4 border border-gray-200 relative">

        <div className="flex justify-between items-center">

          <div>
            <h3 className="font-semibold text-lg">
              {localReferral.candidate_name}
            </h3>

            <p className="text-sm text-gray-500">
              {localReferral.candidate_type}
            </p>
          </div>

          <span
            className={`flex items-center gap-1 text-sm font-medium ${statusConfig.color}`}
          >
            <StatusIcon size={16} />
            {statusLabel}
          </span>

        </div>

        <button
          onClick={handleOpenDetails}
          className="mt-2 underline text-sm text-[#111111] cursor-pointer"
        >
          View Details
        </button>

      </div>

      {/* ====================================================
          Referral Details Modal
      ==================================================== */}

      {expanded && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">

          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-lg relative max-h-[90vh] overflow-y-auto">

            {/* Close */}

            <button
              onClick={() => {
                setExpanded(false);
                setShowEditReview(false);
              }}
              className="absolute top-3 right-3 text-gray-400 cursor-pointer hover:text-black"
            >
              <X size={20} />
            </button>

            {/* Candidate header */}

            <h2 className="text-xl font-semibold mb-2">
              {localReferral.candidate_name}
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              {localReferral.candidate_type}
            </p>

            {/* Progress Bar */}

            <ReferralProgressBar
              currentStatus={localReferral.current_status}
              rejection_stage={localReferral.rejection_stage}
              submitted_at={localReferral.submitted_at}
              considered_at={
                localReferral.considered_at ||
                currentReview?.reviewed_at
              }
              final_at={localReferral.final_at}
            />

            {/* =================================================
                Candidate Details
            ================================================= */}

            <div className="mt-6 space-y-3 text-sm">

              <div>
                <strong>CV:</strong>{' '}

                <a
                  href={localReferral.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Download CV
                </a>
              </div>

              <div>
                <strong>Submitted At:</strong>{' '}
                {formatDate(localReferral.submitted_at)}
              </div>

              <div>
                <strong>SBU Reviewers:</strong>{' '}

                {localReferral.sbus?.length > 0
                  ? localReferral.sbus
                      .map((sbu) => sbu.name)
                      .join(', ')
                  : 'N/A'}
              </div>

              <div>
                <strong>Referral Category:</strong>{' '}

                {referralReasonLabels[
                  localReferral.referral_reason_type
                ] || 'N/A'}
              </div>

              <div>
                <strong>Candidate Email:</strong>{' '}
                {localReferral.candidate_email || 'N/A'}
              </div>

              <div>
                <strong>Candidate Phone:</strong>{' '}
                {localReferral.candidate_phone || 'N/A'}
              </div>

              <div>
                <strong>Referrer Name:</strong>{' '}
                {localReferral.referrer?.name || 'N/A'}
              </div>

              <div>
                <strong>Referrer Email:</strong>{' '}
                {localReferral.referrer?.email || 'N/A'}
              </div>

              <div>
                <strong>Referrer Comments:</strong>{' '}
                {localReferral.additional_comment || 'N/A'}
              </div>

            </div>

            {/* =================================================
                Current SBU Review
            ================================================= */}

            <div className="mt-6 border-t pt-5">

              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <UserCheck size={18} />
                Current SBU Recommendation
              </h3>

              {hasExistingReview ? (

                <div className="border rounded-lg bg-gray-50 p-4 space-y-3">

                  <div className="flex items-center justify-between gap-3">

                    <span className="text-sm font-medium">
                      Latest Decision
                    </span>

                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        currentReview.decision === 'CONSIDERED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {getDecisionLabel(
                        currentReview.decision
                      )}
                    </span>

                  </div>

                  <div className="text-sm">
                    <strong>Reviewed By:</strong>{' '}
                    {currentReview.reviewed_by?.name || 'N/A'}
                  </div>

                  <div className="text-sm flex items-center gap-2">
                    <Clock
                      size={15}
                      className="text-gray-500"
                    />

                    {formatDate(
                      currentReview.reviewed_at
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-1">
                      Reviewer Comment:
                    </p>

                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {currentReview.comment || 'N/A'}
                    </p>
                  </div>

                </div>

              ) : (

                <div className="bg-gray-50 border rounded-lg p-4">
                  <p className="text-sm text-gray-500">
                    No SBU review has been submitted yet.
                  </p>
                </div>

              )}

            </div>

            {/* =================================================
                Review History
            ================================================= */}

            {reviewHistory.length > 0 && (

              <div className="mt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowHistory((prev) => !prev)
                  }
                  className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  <History size={17} />

                  {showHistory
                    ? 'Hide Review History'
                    : `View Review History (${reviewHistory.length})`}
                </button>

                {showHistory && (

                  <div className="mt-3 space-y-3">

                    {reviewHistory.map((review, index) => (

                      <div
                        key={review.id}
                        className="border rounded-lg p-3 bg-white"
                      >

                        <div className="flex justify-between items-start gap-3 mb-2">

                          <div>
                            <p className="text-sm font-semibold">
                              {review.reviewed_by?.name || 'N/A'}
                            </p>

                            <p className="text-xs text-gray-500">
                              {formatDate(
                                review.reviewed_at
                              )}
                            </p>
                          </div>

                          <span
                            className={`text-xs font-semibold ${
                              review.decision === 'CONSIDERED'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {getDecisionLabel(
                              review.decision
                            )}
                          </span>

                        </div>

                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {review.comment}
                        </p>

                        {index === 0 && (
                          <p className="text-xs text-blue-600 font-medium mt-2">
                            Latest SBU Decision
                          </p>
                        )}

                      </div>

                    ))}

                  </div>

                )}

              </div>

            )}

            {/* =================================================
                HR Evaluation Details
            ================================================= */}

            {localReferral.hr_evaluation && (

              <div className="mt-6 border-t pt-4 space-y-2 text-sm">

                <h3 className="font-semibold">
                  HR Evaluation
                </h3>

                <div>
                  <strong>Status:</strong>{' '}
                  {localReferral.hr_evaluation.status || 'N/A'}
                </div>

                <div>
                  <strong>Comment:</strong>{' '}
                  {localReferral.hr_evaluation.comment || 'N/A'}
                </div>

                <div>
                  <strong>Updated By:</strong>{' '}
                  {localReferral.hr_evaluation.updated_by || 'N/A'}
                </div>

              </div>

            )}

            {/* =================================================
                Rejection Reason
            ================================================= */}

            {[
              'REJECTED',
              'FINAL_REJECTED',
            ].includes(localReferral.current_status) && (

              <div className="mt-4 text-sm text-red-600">

                <strong>Rejection Reason:</strong>{' '}

                {localReferral.rejection_reason ||
                  currentReview?.comment ||
                  'Not specified'}

              </div>

            )}

            {/* =================================================
                HR Lock Message
            ================================================= */}

            {!canEditReview && (

              <div className="mt-6 bg-gray-100 border rounded-lg p-4 flex items-start gap-3">

                <Lock
                  size={18}
                  className="text-gray-600 shrink-0"
                />

                <div>

                  <p className="text-sm font-semibold text-gray-700">
                    SBU Review Locked
                  </p>

                  <p className="text-xs text-gray-600 mt-1">
                    {isFinalized
                      ? 'HR has finalized this referral. SBU decisions can no longer be modified.'
                      : hrStarted
                        ? 'HR evaluation has already started. SBU decisions can no longer be modified.'
                        : 'SBU review editing is currently unavailable.'}
                  </p>

                </div>

              </div>

            )}

            {/* =================================================
                Revise Existing Review
            ================================================= */}

            {hasExistingReview && canEditReview && (

              <div className="mt-6">

                <p className="text-xs text-gray-500 mb-3">
                  Assigned SBU reviewers may revise the current
                  recommendation before HR begins evaluation.
                  Previous reviews will remain in the history.
                </p>

                <button
                  onClick={() =>
                    setShowEditReview(true)
                  }
                  className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Revise SBU Review
                </button>

              </div>

            )}

            {/* =================================================
                Initial Review Form
            ================================================= */}

            {!hasExistingReview && canEditReview && (

              <div className="pt-6 border-t mt-6 space-y-3">

                <h3 className="font-semibold text-sm">
                  Submit SBU Review
                </h3>

                <select
                  value={decision}
                  onChange={(e) =>
                    setDecision(e.target.value)
                  }
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="">
                    -- Select Decision --
                  </option>

                  <option value="CONSIDERED">
                    Accept
                  </option>

                  <option value="REJECTED">
                    Reject
                  </option>
                </select>

                <textarea
                  value={comment}
                  onChange={(e) =>
                    setComment(e.target.value)
                  }
                  className="w-full border rounded p-2"
                  placeholder="Add review comment..."
                  rows={4}
                  required
                />

                <button
                  onClick={handleReviewSubmit}
                  disabled={loading || refreshing}
                  className="bg-[#F6490D] cursor-pointer text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2
                      className="animate-spin w-5 h-5"
                    />
                  ) : (
                    'Submit Review'
                  )}
                </button>

              </div>

            )}

            {/* Refreshing indicator */}

            {refreshing && (
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <Loader2
                  size={14}
                  className="animate-spin"
                />
                Refreshing referral information...
              </div>
            )}

          </div>

        </div>
      )}

      {/* ====================================================
          Edit Review Modal
      ==================================================== */}

      {showEditReview && (
        <EditReviewForm
          referral={localReferral}
          review={currentReview}
          emp_id={emp_id}
          onClose={() =>
            setShowEditReview(false)
          }
          onSuccess={handleRevisionSuccess}
        />
      )}

    </>
  );
}