'use client';

import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

import {
  Loader2,
  AlertCircle,
  UserCheck,
  Clock,
} from 'lucide-react';

export default function EditReviewForm({
  referral,
  review,
  emp_id,
  onClose,
  onSuccess,
}) {
  // ==========================================================
  // State
  // ==========================================================

  const [decision, setDecision] = useState(
    review?.decision || ''
  );

  const [comment, setComment] = useState('');

  const [loading, setLoading] = useState(false);

  // ==========================================================
  // Format review timestamp
  // ==========================================================

  const formatDate = (value) => {
    if (!value) return 'N/A';

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? 'N/A'
      : date.toLocaleString();
  };

  // ==========================================================
  // Handle review revision
  // ==========================================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (loading) return;

    // --------------------------------------------------------
    // Validate review ID
    // --------------------------------------------------------

    if (review?.id == null) {
      toast.error(
        'Review ID is missing. Please refresh the page.'
      );
      return;
    }

    // --------------------------------------------------------
    // Validate decision
    // --------------------------------------------------------

    if (!decision) {
      toast.warning('Please select a decision.');
      return;
    }

    // --------------------------------------------------------
    // Validate comment
    // --------------------------------------------------------

    if (!comment.trim()) {
      toast.warning(
        'Please provide a comment explaining your review.'
      );
      return;
    }

    setLoading(true);

    try {
      // ------------------------------------------------------
      // Prepare request payload
      // ------------------------------------------------------

      const body = {
        referral_id: referral.id,
        decision,
        comment: comment.trim(),
        emp_id,

        // IMPORTANT:
        // This identifies the latest review visible to the user.
        expected_review_id: review.id,
      };

      console.log('Submitting revised SBU review:', body);

      // ------------------------------------------------------
      // Submit revision
      // ------------------------------------------------------

      const response = await axios.put(
        '/api/reviews',
        body
      );

      console.log(
        'Review revision response:',
        response.data
      );

      toast.success(
        'SBU review revised successfully!'
      );

      // Refresh referral information and review history.
      if (onSuccess) {
        await onSuccess();
      }

      onClose();

    } catch (error) {
      console.error('Review revision failed:', {
        status: error.response?.status,
        response: error.response?.data,
        message: error.message,
      });

      // ------------------------------------------------------
      // Another reviewer submitted a newer decision
      // ------------------------------------------------------

      if (error.response?.status === 409) {
        toast.error(
          error.response?.data?.error ||
          'Another reviewer has updated this referral. Please refresh before revising.'
        );
      }

      // ------------------------------------------------------
      // HR evaluation has started
      // ------------------------------------------------------

      else if (error.response?.status === 403) {
        toast.error(
          error.response?.data?.error ||
          'This review is locked because HR evaluation has started.'
        );
      }

      // ------------------------------------------------------
      // Validation errors
      // ------------------------------------------------------

      else if (error.response?.status === 400) {
        toast.error(
          error.response?.data?.error ||
          'Invalid review information.'
        );
      }

      // ------------------------------------------------------
      // Other errors
      // ------------------------------------------------------

      else {
        toast.error(
          error.response?.data?.error ||
          'Failed to revise SBU review.'
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60] p-4">

      <form
        onSubmit={handleUpdate}
        className="bg-white rounded-xl shadow p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
      >

        {/* ====================================================
            Heading
        ==================================================== */}

        <div>
          <h2 className="text-xl font-bold">
            Revise SBU Review
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Review the existing recommendation before
            submitting your revision.
          </p>
        </div>

        {/* ====================================================
            Previous Reviewer Details
        ==================================================== */}

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">

          <h3 className="text-sm font-semibold flex items-center gap-2">
            <UserCheck size={17} />
            Current SBU Recommendation
          </h3>

          {/* Previous Decision */}

          <div className="text-sm">
            <strong>Decision:</strong>{' '}

            <span
              className={
                review?.decision === 'CONSIDERED'
                  ? 'text-green-600 font-semibold'
                  : 'text-red-600 font-semibold'
              }
            >
              {review?.decision === 'CONSIDERED'
                ? 'Recommended by SBU'
                : 'Rejected by SBU'}
            </span>
          </div>

          {/* Previous Reviewer */}

          <div className="text-sm">
            <strong>Reviewed By:</strong>{' '}

            {review?.reviewed_by?.name || 'N/A'}
          </div>

          {/* Previous Review Timestamp */}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={15} />

            {formatDate(review?.reviewed_at)}
          </div>

          {/* Previous Comment */}

          <div>
            <p className="text-sm font-semibold mb-1">
              Previous Comment:
            </p>

            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {review?.comment || 'N/A'}
            </p>
          </div>

        </div>

        {/* ====================================================
            Revision Information
        ==================================================== */}

        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">

          <AlertCircle
            size={18}
            className="text-blue-600 shrink-0 mt-0.5"
          />

          <p className="text-xs text-blue-800">
            Your revised decision will become the current SBU
            recommendation. The previous review will remain
            available in the review history. Revisions are
            permitted only until HR begins evaluation.
          </p>

        </div>

        {/* ====================================================
            Decision Selection
        ==================================================== */}

        <div>
          <label className="block text-sm font-medium mb-2">
            Revised Decision
          </label>

          <select
            value={decision}
            onChange={(e) =>
              setDecision(e.target.value)
            }
            className="w-full border rounded p-2"
            disabled={loading}
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
        </div>

        {/* ====================================================
            Revision Comment
        ==================================================== */}

        <div>
          <label className="block text-sm font-medium mb-2">
            Revision Comment
          </label>

          <textarea
            value={comment}
            onChange={(e) =>
              setComment(e.target.value)
            }
            className="w-full border rounded p-2"
            placeholder="Explain your recommendation or why the previous decision should be revised..."
            rows={4}
            disabled={loading}
            required
          />
        </div>

        {/* ====================================================
            Action Buttons
        ==================================================== */}

        <div className="flex justify-end gap-3">

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="bg-gray-500 text-white px-4 py-2 rounded cursor-pointer disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-[#F6490D] text-white px-4 py-2 rounded shadow cursor-pointer hover:opacity-90 disabled:opacity-60 flex items-center justify-center min-w-[150px]"
          >
            {loading ? (
              <Loader2
                className="animate-spin w-5 h-5"
              />
            ) : (
              'Save Revised Review'
            )}
          </button>

        </div>

      </form>

    </div>
  );
}