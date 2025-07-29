'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ReferralProgressBar from './ReferralProgressBar';
import axios from 'axios';
import { toast } from 'sonner';
import { CheckCircle, FileText, UserCheck, X, Ban, Briefcase, Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';

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

export default function ReferralCardHR({ referral }) {
  const [expanded, setExpanded] = useState(false);
  const [stage, setStage] = useState(referral?.hr_evaluation?.stage || '');
  const [status, setStatus] = useState(referral?.hr_evaluation?.status || '');
  const [comment, setComment] = useState(referral?.hr_evaluation?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useUser();
    
  console.log(referral)

  const handleSubmit = async () => {
    if (!status || !comment || (status === 'REJECTED' && !stage)) {
      return toast.error('All required fields must be filled.');
    }

    setSubmitting(true);
    try {
      const method = referral.hr_evaluation ? 'PUT' : 'POST';
      const payload = {
        referral_id: referral.id,
        emp_id: user.emp_id,
        stage,
        status,
        comment,
      };

      const res = await axios({
        method,
        url: '/api/hr-evaluation',
        data: payload,
      });

      // ✅ Fetch updated referral after evaluation
      const updatedRes = await axios.get('/api/hr-evaluation');
      const updatedReferral = updatedRes.data.find(r => r.id === referral.id);
      if (updatedReferral) {
        // Optionally update local state if using one
        Object.assign(referral, updatedReferral); // direct mutation if referral is not in local state
      }

      toast.success('Evaluation saved successfully!');
      setExpanded(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit evaluation.');
    } finally {
      setSubmitting(false);
    }
  };
    
  // ✅ Add this right after statusMap definition:
  if (referral.current_status === "REJECTED") {
    const stageLabel = referral.rejection_stage === "HR" ? "Rejected by HR" : "Rejected by SBU";
    statusMap.REJECTED.label = stageLabel;
  }

  const statusView = statusMap[referral.current_status];

  return (
    <Card>
      <CardContent className="px-4 py-1">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-[18px]">{referral.candidate_name}</h3>
            <p className="text-[12px] text-gray-500">{referral.candidate_type}</p>
          </div>
          <span className={`flex items-center gap-1 text-sm font-medium ${statusView.color}`}>
            {statusView.icon}
            {statusView.label}
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-500 underline mt-2 cursor-pointer"
        >
          {'View Details'}
        </button>

        {expanded && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* <button onClick={() => setExpanded(false)} className="absolute top-4 right-6 text-gray-500">×</button> */}
              <ReferralProgressBar
                currentStatus={referral.current_status}
                rejection_stage={referral.rejection_stage}
                submitted_at={referral.submitted_at}
                considered_at={referral.considered_at}
                final_at={referral.final_at}
              />

              <div className="mt-4">
                <p><strong>CV:</strong> <a href={referral.cv_url} target="_blank" className="text-blue-500">Download CV</a></p>
                <p><strong>Submitted At:</strong> {new Date(referral.submitted_at).toLocaleString()}</p>
                <p><strong>SBUs:</strong> {referral.sbus.map(s => s.name).join(', ')}</p>
                <p><strong>Referrer:</strong> {referral.referrer.name}</p>
                <p><strong>Referrer Comments:</strong> {referral.additional_comment}</p>
              </div>

              {referral.review && (
                <div className="mt-4 bg-gray-100 p-3 rounded">
                  <p><strong>Reviewer Decision:</strong> {referral.review.decision}</p>
                  <p><strong>Reviewer Comments:</strong> {referral.review.comment}</p>
                </div>
              )}

              {referral.hr_evaluation && (
                <div className="mt-4 bg-purple-50 p-3 rounded border border-purple-300">
                  <p><strong>Previous Evaluation:</strong></p>
                  <p>Stage: {referral.hr_evaluation.stage}</p>
                  <p>Status: {referral.hr_evaluation.status}</p>
                  <p>Comment: {referral.hr_evaluation.comment}</p>
                  <p>Updated At: {new Date(referral.hr_evaluation.updated_at).toLocaleString()}</p>
                  <p>Updated By: {referral.hr_evaluation.updated_by}</p>
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div>
                    <label className="block font-medium">Status</label>
                    <select
                      className="border p-2 rounded w-full"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">-- Select --</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                {status === 'REJECTED' && (
                  <div>
                    <label className="block font-medium">Stage</label>
                    <select
                      className="border p-2 rounded w-full"
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                    >
                      <option value="">-- Select --</option>
                      <option value="TEST">Test</option>
                      <option value="T1">Technical Round 1</option>
                      <option value="T2">Technical Round 2</option>
                      <option value="T3">Technical Round 3</option>
                      <option value="HR">HR Round</option>
                      <option value="OTHER">Other Reason</option>
                    </select>
                  </div>
                )}

                  
                <div>
                  <label className="block font-medium">Comment</label>
                  <textarea
                    className="border p-2 rounded w-full"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                                  />
                    <span className='text-sm font-semibold text-gray-600'>Details To Fill: <br/> If Rejected: Select rejection stage (Test/T1/T2/T3/HR) and provide reason for rejection. If Accepted - Full Time: Enter designation, date of joining, work location, and band. If Accepted - Intern: Enter designation, internship period, and internship location.</span>
                </div>

                <button
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="bg-purple-600 cursor-pointer text-white px-4 py-2 rounded me-4"
                >
                  {submitting ? 'Submitting...' : 'Submit Evaluation'}
                </button>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="cursor-pointer bg-[#111111] text-white px-4 py-2 rounded"
                >
                Close    
                </button>              
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
