'use client'

import { useState } from 'react';
import { toast } from "sonner"
import ReferralProgressBar from './ReferralProgressBar';
import UpdateReferralForm from './UpdateReferralForm';
import {
  FileText,
  UserCheck,
  Briefcase,
  CheckCircle,
  X,
  Ban,
  Loader2
} from 'lucide-react';
import axios from 'axios';

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

export default function ReferralCard({ referral, currentEmpId, updateReferralInList, removeReferralFromList }) {
  const [showModal, setShowModal] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const isReferrer = referral.referrer?.emp_id === currentEmpId;
  console.log(referral)

  // ✅ Add this right after statusMap definition:
  if (referral.current_status === "REJECTED") {
    const stageLabel = referral.rejection_stage === "HR" ? "Rejected by HR" : "Rejected by SBU";
    statusMap.REJECTED.label = stageLabel;
  }
  
  const status = statusMap[referral.current_status];

  const handleDeleteReferral = async () => {
    setLoading(true)
    const body = {
      referralId: referral.id,  // ✅ Fix this key
      emp_id: referral.referrer.emp_id
    };

    try {
      const res = await fetch('/api/referrals', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.status === 204) {
        setLoading(false)
        toast.success("Referral Deleted Successfully!!");
        console.log('Referral deleted successfully');
        setShowModal(false);

        // ✅ Remove from list in UI
        removeReferralFromList(referral.id);
      } else {
        setLoading(false)
        console.error('Failed to delete referral:', res.status);
        toast.error("Failed to delete referral.");
      }
    } catch (err) {
      setLoading(false)
      console.error("Error deleting referral:", err);
      toast.error("An error occurred while deleting.");
    }
  };


  return (
    <>
      <div
        className="bg-white shadow rounded-xl p-4 border border-gray-200 hover:shadow-lg transition cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">{referral.candidate_name}</h3>
            <p className="text-sm text-gray-500">{referral.candidate_type}</p>
          </div>
          <span className={`flex items-center gap-1 text-sm font-medium ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-xl p-6 rounded-xl relative shadow-lg">
            <button
              onClick={() => setShowModal(false)}
              className="cursor-pointer absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-2">{referral.candidate_name}</h2>
            <p className="text-gray-500 mb-4">{referral.candidate_type}</p>

            <div className="space-y-2 text-sm">
              <div><strong>Submitted At:</strong> {new Date(referral.submitted_at).toLocaleString()}</div>
              <div><strong>CV:</strong> <a href={referral.cv_url} target="_blank" className="text-blue-600 underline">Download CV</a></div>
              <div><strong>SBU Reviewers:</strong> {referral.sbus?.length ? referral.sbus.map(s => s.name).join(', ') : 'N/A'}</div>
              <div><strong>Referrer:</strong> {referral.referrer?.name || 'N/A'}</div>
              <div><strong>Comment:</strong> {referral.additional_comment || 'N/A'}</div>
              {referral.review?.decision && <div>
                <strong>Reviwer Descision:</strong>{' '}
                {referral.review?.decision || 'N/A'}
              </div>}
              {referral.review?.comment && <div>
                <strong>Reviewer Comments:</strong>{' '}
                {referral.review?.comment || 'N/A'}
              </div>}
              {['REJECTED', 'FINAL_REJECTED'].includes(referral.current_status) && referral.rejection_reason && (
                <div className="mt-2 text-red-600">
                  <strong>Rejection Reason:</strong> {referral.rejection_reason}
                </div>
              )}
              {referral.hr_evaluation && 
                <>
                <div><strong>HR Evaluation Status:</strong> {referral.hr_evaluation.status || 'N/A'}</div>
                <div><strong>HR Evaluation Comment:</strong> {referral.hr_evaluation.comment || 'N/A'}</div>
                {/* <div><strong>Comment:</strong> {referral.additional_comment || 'N/A'}</div> */}
                </>
              }
              <div className="flex items-center gap-2 mt-4">
                <ReferralProgressBar
                  currentStatus={referral.current_status}
                  rejection_stage={referral.rejection_stage}
                  submitted_at={referral.submitted_at}
                  considered_at={referral.considered_at || referral.review?.reviewed_at}
                  final_at={referral.final_at}
                />
              </div>


              {['CONSIDERED', 'REJECTED', 'FINAL_ACCEPTED', 'FINAL_REJECTED'].includes(referral.current_status) ?
                <div className='flex mt-4 w-full items-center justify-center'>
                <span className='text-gray-600 font-semibold text-[10px]'>CV ALREADY REVIEWED BY SBU REVIEWER YOU CANNOT MAKE ANY EDITS OR DELETE THE REFERRAL!</span>
                </div>
                : (
                <div className="flex gap-3 mt-4 justify-center">
                  <button
                    onClick={() => setShowUpdateForm(true)}
                    className="cursor-pointer px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteReferral}
                    className="cursor-pointer px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Delete"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showUpdateForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <UpdateReferralForm
            referral={referral}
            onClose={() => setShowUpdateForm(false)}
            onSuccess={async () => {
              toast.success("Referral Updated Successfully! Please wait a second for changes to be visible.");
              setShowUpdateForm(false);
              setShowModal(false);
              const res = await axios.get(`/api/referrals?emp_id=${referral.referrer.emp_id}`);
              const updated = res.data.find(r => r.id === referral.id);
              if (updated) updateReferralInList(updated);
            }}
          />
        </div>
      )}
    </>
  );
}
