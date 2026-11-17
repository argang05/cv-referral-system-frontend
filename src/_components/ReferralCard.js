'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import ReferralProgressBar from './ReferralProgressBar';
import UpdateReferralForm from './UpdateReferralForm';
import { FileText, Briefcase, CheckCircle, X, Ban, Loader2, GraduationCap, ShieldCheck, Clock, Lock, AlertCircle, Save, UserCheck, ClipboardCheck, CalendarDays, CheckCircle2, XCircle, UserRound, ExternalLink, History } from 'lucide-react';

const statusMap = {
  PENDING_REVIEW: { color: 'text-purple-500', label: 'Submitted', icon: FileText },
  CONSIDERED: { color: 'text-blue-600', label: 'Under HR Review', icon: Briefcase },
  REJECTED: { color: 'text-red-600', label: 'Rejected by SBU', icon: X },
  FINAL_ACCEPTED: { color: 'text-green-600', label: 'Selected by HR', icon: CheckCircle },
  FINAL_REJECTED: { color: 'text-red-600', label: 'Rejected by HR', icon: Ban }
};

const referralReasonLabels = {
  COURTESY: 'Courtesy Referral – Shared out of obligation or goodwill',
  POTENTIAL_FIT: 'Potential Fit Referral – Strong background, depends on role fitment',
  DIRECT_ROLE_FIT: 'Direct Role Fit Referral – Clearly aligned to an open position',
  INTERNAL_NETWORK: 'Internal Network Referral – Former colleague or vendor contact',
  STRATEGIC: 'Strategic Referral – High-value or niche candidate for special review'
};

const candidateTypeLabels = {
  INTERN_FRESHER: 'Internship - Fresher',
  INTERN_EXPERIENCED: 'Internship - Experienced',
  FULL_TIME_FRESHER: 'Full Time - Fresher',
  FULL_TIME_EXPERIENCED: 'Full Time - Experienced'
};

const stageLabels = {
  TEST: 'Test', T1: 'Technical Round 1', T2: 'Technical Round 2',
  T3: 'Technical Round 3', HR: 'HR Round', OTHER: 'Other Reason'
};

const offerOutcomeLabels = {
  OFFER_DECLINED: 'Offer Declined',
  DID_NOT_JOIN: 'Did Not Join',
  JOINED: 'Joined'
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const formatJoiningDate = (value) => {
  if (!value) return 'N/A';
  const parts = String(value).split('-');
  if (parts.length !== 3) return String(value);
  const [year, month, day] = parts.map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return String(value);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatAcademicValue = (value, suffix) => value === null || value === undefined || value === '' ? 'N/A' : `${value}${suffix}`;

function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{value ?? 'N/A'}</p>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="mt-5 border-t border-gray-200 pt-5">
      <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
        <Icon size={19} className="text-[#F6490D]" />{title}
      </h3>
      {children}
    </section>
  );
}

function OfferReport({ evaluation }) {
  if (!evaluation || evaluation.status !== 'ACCEPTED') return null;
  const offerReleased = Boolean(evaluation.offer_released);
  const outcome = evaluation.offer_outcome;
  const outcomeLabel = offerOutcomeLabels[outcome] || 'Not recorded';
  const outcomeColor = outcome === 'JOINED' ? 'bg-green-100 text-green-700 border-green-200' : outcome === 'OFFER_DECLINED' || outcome === 'DID_NOT_JOIN' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200';
  return (
    <Section title="Offer & Joining Report" icon={ClipboardCheck}>
      <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-800">Post-Selection Status</p>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${outcomeColor}`}>
            {outcome ? outcomeLabel : offerReleased ? 'Awaiting Outcome' : 'Offer Not Released'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Detail label="HR Selection Decision" value="Selected" />
          <Detail label="Offer Released" value={offerReleased ? 'Yes' : 'No'} />
          <Detail label="Offer Outcome" value={offerReleased ? (outcome ? outcomeLabel : 'Awaiting Outcome') : 'Not applicable'} />
          {outcome === 'JOINED' && <Detail label="Date of Joining" value={formatJoiningDate(evaluation.joining_date)} />}
        </div>
        {outcome === 'JOINED' && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <p>Candidate successfully joined on <strong>{formatJoiningDate(evaluation.joining_date)}</strong>.</p>
          </div>
        )}
        {outcome === 'OFFER_DECLINED' && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <XCircle size={18} className="shrink-0 mt-0.5" />
            <p>The candidate was selected by HR but declined the employment offer.</p>
          </div>
        )}
        {outcome === 'DID_NOT_JOIN' && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <XCircle size={18} className="shrink-0 mt-0.5" />
            <p>The candidate was selected and an offer was released, but the candidate did not join.</p>
          </div>
        )}
      </div>
    </Section>
  );
}

export default function ReferralCard({ referral, currentEmpId, updateReferralInList, removeReferralFromList }) {
  const [showModal, setShowModal] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const isReferrer = String(referral.referrer?.emp_id) === String(currentEmpId);
  const isFresher = ['INTERN_FRESHER', 'FULL_TIME_FRESHER'].includes(referral.candidate_type);
  const academicStatus = referral.academic_details_status;
  const isAcademicCompleted = isFresher && academicStatus === 'COMPLETED';
  const isAcademicDraft = isFresher && academicStatus === 'DRAFT';
  const isAcademicPending = isFresher && (!academicStatus || academicStatus === 'PENDING');
  const academicDetails = referral.academic_details || {};
  const tenthPercentage = academicDetails.tenth_percentage ?? referral.tenth_percentage;
  const twelfthPercentage = academicDetails.twelfth_percentage ?? referral.twelfth_percentage;
  const graduationCgpa = academicDetails.graduation_cgpa ?? referral.graduation_cgpa;
  const evaluation = referral.hr_evaluation;
  const isSelected = evaluation?.status === 'ACCEPTED';
  const isHrRejected = evaluation?.status === 'REJECTED';
  const statusConfig = statusMap[referral.current_status] || { color: 'text-gray-500', label: 'Unknown', icon: FileText };
  const StatusIcon = statusConfig.icon;
  const statusLabel = referral.current_status === 'REJECTED' && referral.rejection_stage === 'HR' ? 'Rejected by HR' : statusConfig.label;
  const hasBeenReviewed = ['CONSIDERED', 'REJECTED', 'FINAL_ACCEPTED', 'FINAL_REJECTED'].includes(referral.current_status);
  const offerStatus = evaluation?.offer_outcome ? offerOutcomeLabels[evaluation.offer_outcome] : evaluation?.offer_released ? 'Offer Released' : 'Offer Not Released';

  const handleDeleteReferral = async () => {
    if (loading || !isReferrer) return;
    setLoading(true);
    try {
      const response = await fetch('/api/referrals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralId: referral.id, emp_id: currentEmpId })
      });
      if (response.status === 204) {
        toast.success('Referral deleted successfully!');
        setShowModal(false);
        removeReferralFromList(referral.id);
      } else {
        toast.error('Failed to delete referral.');
      }
    } catch (error) {
      console.error('Error deleting referral:', error);
      toast.error('An error occurred while deleting the referral.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white shadow rounded-xl p-4 border border-gray-200 hover:shadow-lg transition cursor-pointer" onClick={() => setShowModal(true)}>
        <div className="flex justify-between items-center gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg truncate">{referral.candidate_name}</h3>
            <p className="text-sm text-gray-500">{candidateTypeLabels[referral.candidate_type] || referral.candidate_type}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`flex items-center gap-1 text-sm font-medium ${statusConfig.color}`}>
              <StatusIcon size={16} />{statusLabel}
            </span>
            {isSelected && (
              <span className={`text-xs font-semibold rounded-full px-2.5 py-1 border ${
                evaluation.offer_outcome === 'JOINED' ? 'bg-green-50 text-green-700 border-green-200' :
                ['OFFER_DECLINED', 'DID_NOT_JOIN'].includes(evaluation.offer_outcome) ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>{offerStatus}</span>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl p-6 rounded-xl relative shadow-lg max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="cursor-pointer absolute top-3 right-3 text-gray-600 hover:text-black" aria-label="Close referral details"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-2 pr-8">{referral.candidate_name}</h2>
            <p className="text-gray-500 mb-4">{candidateTypeLabels[referral.candidate_type] || referral.candidate_type}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <Detail label="Submitted At" value={formatDate(referral.submitted_at)} />
              <Detail label="Candidate Email" value={referral.candidate_email} />
              <Detail label="Candidate Phone" value={referral.candidate_phone} />
              <Detail label="SBU Reviewers" value={referral.sbus?.length ? referral.sbus.map(sbu => sbu.name).join(', ') : 'N/A'} />
              <Detail label="Referrer" value={referral.referrer?.name} />
              <Detail label="Referrer Email" value={referral.referrer?.email} />
              <Detail label="Referral Category" value={referralReasonLabels[referral.referral_reason_type]} />
              <Detail label="Additional Comment" value={referral.additional_comment} />
            </div>
            {referral.cv_url && (
              <a href={referral.cv_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
                <FileText size={16} /> Download CV <ExternalLink size={14} />
              </a>
            )}

            {isFresher && (
              <Section title="Academic Details" icon={GraduationCap}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-gray-600">Academic verification by HR</p>
                  {isAcademicCompleted && <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"><ShieldCheck size={15} /> Finalized & Locked</span>}
                  {isAcademicDraft && <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"><Save size={14} /> Draft Saved by HR</span>}
                  {isAcademicPending && <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"><Clock size={14} /> Awaiting HR</span>}
                </div>
                {isAcademicCompleted ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Class 10 Percentage', value: formatAcademicValue(tenthPercentage, '%') },
                        { label: 'Class 12 Percentage', value: formatAcademicValue(twelfthPercentage, '%') },
                        { label: 'Graduation CGPA', value: formatAcademicValue(graduationCgpa, ' / 10') }
                      ].map(item => (
                        <div key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                          <p className="mb-2 text-xs font-medium text-gray-500">{item.label}</p>
                          <p className="text-xl font-bold text-gray-900">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-start gap-2 text-xs text-gray-500"><Lock size={14} className="mt-0.5 shrink-0" /><p>These academic records have been finalized by HR and cannot be modified by the referrer.</p></div>
                    {referral.academic_details_updated_at && <p className="mt-2 text-xs text-gray-500">Finalized on: {formatDate(referral.academic_details_updated_at)}</p>}
                  </>
                ) : (
                  <div className={`rounded-lg border p-4 ${isAcademicDraft ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-start gap-3">
                      {isAcademicDraft ? <Save size={19} className="mt-0.5 shrink-0 text-blue-600" /> : <AlertCircle size={19} className="mt-0.5 shrink-0 text-amber-600" />}
                      <div>
                        <p className={`text-sm font-semibold ${isAcademicDraft ? 'text-blue-800' : 'text-amber-800'}`}>{isAcademicDraft ? 'Academic Details Under Preparation' : 'Academic Verification Pending'}</p>
                        <p className={`mt-1 text-xs ${isAcademicDraft ? 'text-blue-700' : 'text-amber-700'}`}>{isAcademicDraft ? 'HR has saved the academic information as a draft. The records will become available after HR finalizes and locks them.' : 'HR will contact the candidate and collect the required academic information. SBU review will begin once HR finalizes these records.'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Section>
            )}

            <Section title="Latest SBU Review" icon={UserCheck}>
              {referral.review?.decision ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <Detail label="SBU Decision" value={referral.review.decision === 'CONSIDERED' ? 'Considered for HR Evaluation' : 'Rejected'} />
                  <Detail label="Reviewed By" value={referral.review.reviewed_by} />
                  <Detail label="Reviewed On" value={formatDate(referral.review.reviewed_at)} />
                  <Detail label="Reviewer Comments" value={referral.review.comment} />
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <Clock size={18} className="mt-0.5 shrink-0" />
                  <p>{isFresher && !isAcademicCompleted ? 'Awaiting finalized academic details before SBU review can begin.' : 'Awaiting SBU reviewer decision.'}</p>
                </div>
              )}
            </Section>

            <Section title="Final HR Evaluation" icon={Briefcase}>
              {evaluation?.evaluation_status === 'COMPLETED' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <Detail label="Final Decision" value={isSelected ? 'Selected' : isHrRejected ? 'Rejected' : evaluation.status} />
                    <Detail label="Rejection Stage" value={isHrRejected ? stageLabels[evaluation.stage] || evaluation.stage || 'N/A' : 'Not applicable'} />
                    <Detail label="Last Updated By" value={evaluation.updated_by} />
                    <Detail label="Last Updated On" value={formatDate(evaluation.updated_at)} />
                    <Detail label="Finalized By" value={evaluation.finalized_by?.name} />
                    <Detail label="Finalized On" value={formatDate(evaluation.finalized_at)} />
                    <Detail label="Evaluation Status" value="Completed & Permanently Locked" />
                    <Detail label="Final HR Comment" value={evaluation.comment} />
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-800">
                    <Lock size={15} className="shrink-0" /> This HR evaluation has been finalized and permanently locked.
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  <Clock size={18} className="mt-0.5 shrink-0" />
                  <p>{referral.current_status === 'REJECTED' ? 'This referral was rejected during SBU review. HR evaluation is not applicable.' : referral.review?.decision === 'CONSIDERED' ? 'The candidate is under HR evaluation. The final decision will appear once HR finalizes the evaluation.' : 'HR evaluation has not started. The final decision will appear after SBU consideration and HR finalization.'}</p>
                </div>
              )}
            </Section>

            {isSelected && <OfferReport evaluation={evaluation} />}

            {['REJECTED', 'FINAL_REJECTED'].includes(referral.current_status) && referral.rejection_reason && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <strong>Rejection Reason:</strong> {referral.rejection_reason}
              </div>
            )}

            <div className="mt-6">
              <ReferralProgressBar
                currentStatus={referral.current_status}
                rejection_stage={referral.rejection_stage}
                submitted_at={referral.submitted_at}
                considered_at={referral.considered_at || referral.review?.reviewed_at}
                final_at={referral.final_at}
              />
            </div>

            {hasBeenReviewed ? (
              <div className="mt-5 flex w-full items-center justify-center">
                <span className="text-center text-[10px] font-semibold text-gray-600">
                  CV ALREADY REVIEWED BY SBU REVIEWER. YOU CANNOT EDIT OR DELETE THIS REFERRAL.
                </span>
              </div>
            ) : isReferrer ? (
              <div className="mt-5 flex justify-center gap-3">
                <button onClick={() => setShowUpdateForm(true)} className="cursor-pointer rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">Edit</button>
                <button onClick={handleDeleteReferral} disabled={loading} className="cursor-pointer rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Delete'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {showUpdateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <UpdateReferralForm
            referral={referral}
            onClose={() => setShowUpdateForm(false)}
            onSuccess={async () => {
              toast.success('Referral updated successfully!');
              setShowUpdateForm(false);
              setShowModal(false);
              try {
                const response = await axios.get(`/api/referrals?emp_id=${currentEmpId}`);
                const updated = response.data.find(item => item.id === referral.id);
                if (updated) updateReferralInList(updated);
              } catch (error) {
                console.error('Failed to refresh updated referral:', error);
                toast.warning('Referral updated, but the latest details could not be refreshed.');
              }
            }}
          />
        </div>
      )}
    </>
  );
}