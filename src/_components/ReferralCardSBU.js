'use client';

import { useState } from 'react';
import axios from 'axios';
import ReferralProgressBar from './ReferralProgressBar';
import {
  FileText,
  UserCheck,
  Briefcase,
  CheckCircle,
  X,
  Ban,
  Loader2
} from 'lucide-react';
import EditReviewForm from './EditReviewForm';
import { toast } from 'sonner';
  
const statusMap = {
  PENDING_REVIEW: {
    color: 'text-purple-500',
    label: 'Submitted',
    icon: <FileText size={16} />
  },
  CONSIDERED: {
    color: 'text-blue-600', // Optional: differentiate
    label: 'Under HR Review',  // ✅ FIXED
    icon: <Briefcase size={16} />  // ✅ Better icon for HR
  },
  REJECTED: {
    color: 'text-red-600',
    label: 'Rejected by SBU',  // You may dynamically adjust this based on `rejection_stage`
    icon: <X size={16} />
  },
  FINAL_ACCEPTED: {
    color: 'text-green-600',
    label: 'Accepted by HR',
    icon: <CheckCircle size={16} />
  },
  FINAL_REJECTED: {
    color: 'text-red-600',
    label: 'Rejected by HR',
    icon: <Ban size={16} />
  },
};


export default function ReferralCardSBU({ referral, emp_id }) { 
  const [expanded, setExpanded] = useState(false);
  const [decision, setDecision] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(!!referral.review);
  const [localReferral, setLocalReferral] = useState(referral); // 🔁 reactive local copy
  const [showEditReview, setShowEditReview] = useState(false);
  const [loading, setLoading] = useState(false);

  console.log(referral)

  // ✅ Add this right after statusMap definition:
  if (referral.current_status === "REJECTED") {
    const stageLabel = referral.rejection_stage === "HR" ? "Rejected by HR" : "Rejected by SBU";
    statusMap.REJECTED.label = stageLabel;
  }
  
  const status = statusMap[localReferral.current_status] || {
    color: 'text-gray-500',
    label: 'Unknown',
    icon: <FileText size={16} />
  };

  const handleReviewSubmit = async () => {
    setLoading(true);
    try {
      console.log("Submitting review with data:", {
        referral_id: localReferral.id,
        decision,
        comment,
        emp_id
      });

      // Submit the review
      await axios.post('/api/reviews', {
        referral_id: localReferral.id,
        decision,
        comment,
        emp_id
      });

      toast.success('Review submitted.');

      // ✅ Fetch updated referral list and find this one
      const res = await axios.get(`/api/reviews?emp_id=${emp_id}`);
      const updated = res.data.find((r) => r.id === localReferral.id);

      if (updated) {
        setLocalReferral(updated);     // ✅ update localReferral with updated review
        setSubmitted(true);            // ✅ keep submitted state
      }

      setExpanded(false);
    } catch (err) {
      setLoading(false);
      toast.error('Failed to submit review.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <div className="bg-white shadow rounded-xl p-4 border border-gray-200 relative">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">{localReferral.candidate_name}</h3>
            <p className="text-sm text-gray-500">{localReferral.candidate_type}</p>
          </div>
          <span className={`flex items-center gap-1 text-sm font-medium ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
        </div>
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 underline text-sm text-[#111111] cursor-pointer"
        >
          View Details
        </button>
      </div>

      {expanded && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl w-[90%] max-w-2xl p-6 shadow-lg relative">
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-3 right-3 text-gray-400 cursor-pointer hover:text-black"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-2">{localReferral.candidate_name}</h2>
            <p className="text-sm text-gray-600 mb-4">{localReferral.candidate_type}</p>

            {/* <ReferralProgressBar currentStatus={referral.current_status} rejection_stage={referral.rejection_stage} /> */}
            <ReferralProgressBar
                  currentStatus={localReferral.current_status}
                  rejection_stage={localReferral.rejection_stage}
                  submitted_at={localReferral.submitted_at}
                  considered_at={localReferral.considered_at || localReferral.review?.reviewed_at}
                  final_at={localReferral.final_at}
                />

            <div className="mt-6 space-y-3 text-sm">
              <div>
                <strong>CV:</strong>{' '}
                <a href={localReferral.cv_url} target="_blank" className="text-blue-600 underline">
                  Download CV
                </a>
              </div>
              <div>
                <strong>Submitted At:</strong>{' '}
                {new Date(localReferral.submitted_at).toLocaleString()}
              </div>
              <div>
                <strong>SBU Reviewers:</strong>{' '}
                {localReferral.sbus.length > 0
                  ? localReferral.sbus.map((s) => s.name).join(', ')
                  : 'N/A'}
              </div>
              <div>
                <strong>Referral Category:</strong>{" "}
                {referral.referral_reason_type ? (
                  {
                    COURTESY: "Courtesy Referral – Shared out of obligation or goodwill",
                    POTENTIAL_FIT: "Potential Fit Referral – Strong background, depends on role fitment",
                    DIRECT_ROLE_FIT: "Direct Role Fit Referral – Clearly aligned to an open position",
                    INTERNAL_NETWORK: "Internal Network Referral – Former colleague or vendor contact",
                    STRATEGIC: "Strategic Referral – High-value or niche candidate for special review",
                  }[referral.referral_reason_type] || "N/A"
                ) : (
                  "N/A"
                )}
              </div>
              <div><strong>Referrer:</strong> {localReferral.referrer?.name || 'N/A'}</div>
              <div>
                <strong>Referrer Comments:</strong>{' '}
                {localReferral.additional_comment || 'N/A'}
              </div>
              {localReferral.current_status !== 'FINAL_REJECTED' && localReferral.current_status !== 'REJECTED' ? (
                <>
                  {localReferral.review?.decision && (
                    <div>
                      <strong>Reviewer Decision:</strong>{' '}
                      {localReferral.review?.decision || 'N/A'}
                    </div>
                  )}
                  {localReferral.review?.comment && (
                    <div>
                      <strong>Reviewer Comments:</strong>{' '}
                      {localReferral.review?.comment || 'N/A'}
                    </div>
                  )}
                </>
              ) : null}
              {localReferral.hr_evaluation && 
                <>
                <div><strong>HR Evaluation Status:</strong> {localReferral.hr_evaluation.status || 'N/A'}</div>
                <div><strong>HR Evaluation Comment:</strong> {localReferral.hr_evaluation.comment || 'N/A'}</div>
                {/* <div><strong>Comment:</strong> {referral.additional_comment || 'N/A'}</div> */}
                </>
              }
              {localReferral.current_status === 'FINAL_REJECTED' || localReferral.current_status === 'REJECTED' ? (
                <div className="text-red-600">
                  <strong>Rejection Reason:</strong>{' '}
                  {localReferral.rejection_reason || comment || 'Not specified'}
                </div>
              ) : null}
              {['FINAL_ACCEPTED','FINAL_REJECTED'].includes(localReferral.current_status) ? 
                <div className='flex mt-4 w-full items-center justify-center'>
                <span className='text-gray-600 font-semibold text-[10px]'>CV ALREADY REVIEWED BY HR YOU CANNOT MAKE ANY EDITS TO YOUR REVIEW!</span>
                </div>
              : submitted && localReferral.review && (
                <button
                  onClick={() => setShowEditReview(true)}
                  className="cursor-pointer mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit Review
                </button>
              )}
            </div>

            {!submitted && (
              <div className="pt-6 border-t mt-6 space-y-3">
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">-- Select Decision --</option>
                  <option value="CONSIDERED">Accept</option>
                  <option value="REJECTED">Reject</option>
                </select>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="Add review comment..."
                />
                <button
                  onClick={handleReviewSubmit}
                  className="bg-[#F6490D] cursor-pointer text-white px-4 py-2 rounded hover:bg-orange-600"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Submit Review"}
                </button>
              </div>
            )}
            {showEditReview && (
              <EditReviewForm
                referral={localReferral}
                review={localReferral.review}
                emp_id={emp_id}
                onClose={() => setShowEditReview(false)}
                onSuccess={async () => {
                  try {
                    const res = await axios.get(`/api/reviews?emp_id=${emp_id}`);
                    const updated = res.data.find((r) => r.id === referral.id);
                    if (updated) {
                      setLocalReferral(updated);             // ✅ re-render progress bar and data
                      setSubmitted(true);               // ✅ stays submitted even after accept
                    }
                    setExpanded(false);
                  } catch (error) {
                    console.error('Failed to update referral:', error);
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
