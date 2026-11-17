'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import ReferralProgressBar from './ReferralProgressBar';
import EditReviewForm from './EditReviewForm';
import { toast } from 'sonner';
import { FileText, CheckCircle, X, Ban, Loader2, History, UserCheck, Clock, Lock, GraduationCap, ShieldCheck, Briefcase, ClipboardCheck, CalendarDays, CheckCircle2, XCircle, ExternalLink, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const statusMap = {
  PENDING_REVIEW: { color: 'text-purple-500', label: 'Submitted', icon: FileText },
  CONSIDERED: { color: 'text-blue-600', label: 'SBU Approved', icon: UserCheck },
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

const getDecisionLabel = (decision) => {
  if (decision === 'CONSIDERED') return 'Recommended for HR Evaluation';
  if (decision === 'REJECTED') return 'Not Recommended for HR Evaluation';
  return 'N/A';
};

const formatAcademicValue = (value, suffix) => value === null || value === undefined || value === '' ? 'N/A' : `${value}${suffix}`;

function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="break-words whitespace-pre-wrap text-sm text-gray-800">{value ?? 'N/A'}</p>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="mt-6 border-t border-gray-200 pt-5">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
        <Icon size={19} className="text-[#F6490D]" />{title}
      </h3>
      {children}
    </section>
  );
}

function OfferReport({ evaluation }) {
  if (!evaluation || evaluation.status !== 'ACCEPTED') return null;
  const released = Boolean(evaluation.offer_released);
  const outcome = evaluation.offer_outcome;
  const outcomeLabel = offerOutcomeLabels[outcome] || 'Not recorded';
  const outcomeClass = outcome === 'JOINED' ? 'bg-green-100 text-green-700 border-green-200' : ['OFFER_DECLINED', 'DID_NOT_JOIN'].includes(outcome) ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200';
  return (
    <Section title="Offer & Joining Report" icon={ClipboardCheck}>
      <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-800">Post-Selection Status</p>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${outcomeClass}`}>
            {outcome ? outcomeLabel : released ? 'Awaiting Outcome' : 'Offer Not Released'}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="HR Selection Decision" value="Selected" />
          <Detail label="Offer Released" value={released ? 'Yes' : 'No'} />
          <Detail label="Offer Outcome" value={released ? (outcome ? outcomeLabel : 'Awaiting Outcome') : 'Not applicable'} />
          {outcome === 'JOINED' && <Detail label="Date of Joining" value={formatJoiningDate(evaluation.joining_date)} />}
        </div>
        {outcome === 'JOINED' && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p>Candidate successfully joined on <strong>{formatJoiningDate(evaluation.joining_date)}</strong>.</p>
          </div>
        )}
        {outcome === 'OFFER_DECLINED' && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <XCircle size={18} className="mt-0.5 shrink-0" />
            <p>The candidate was selected by HR but declined the employment offer.</p>
          </div>
        )}
        {outcome === 'DID_NOT_JOIN' && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <XCircle size={18} className="mt-0.5 shrink-0" />
            <p>The candidate was selected and an offer was released, but the candidate did not join.</p>
          </div>
        )}
      </div>
    </Section>
  );
}

export default function ReferralCardSBU({ referral, emp_id }) {
  const [expanded, setExpanded] = useState(false);
  const [decision, setDecision] = useState('');
  const [comment, setComment] = useState('');
  const [localReferral, setLocalReferral] = useState(referral);
  const [showEditReview, setShowEditReview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { setLocalReferral(referral); }, [referral]);

  const currentReview = localReferral.review;
  const hasExistingReview = Boolean(currentReview);
  const reviewHistory = Array.isArray(localReferral.review_history) ? localReferral.review_history : [];
  const isFinalized = ['FINAL_ACCEPTED', 'FINAL_REJECTED'].includes(localReferral.current_status);
  const hrStarted = Boolean(localReferral.hr_evaluation_started || localReferral.hr_evaluation);
  const canEditReview = localReferral.can_edit_sbu_review === true && !hrStarted && !isFinalized;
  const isFresher = ['INTERN_FRESHER', 'FULL_TIME_FRESHER'].includes(localReferral.candidate_type);
  const academicDetails = localReferral.academic_details || {};
  const academicStatus = localReferral.academic_details_status;
  const isAcademicCompleted = academicStatus === 'COMPLETED';
  const tenthPercentage = academicDetails.tenth_percentage ?? localReferral.tenth_percentage;
  const twelfthPercentage = academicDetails.twelfth_percentage ?? localReferral.twelfth_percentage;
  const graduationCgpa = academicDetails.graduation_cgpa ?? localReferral.graduation_cgpa;
  const hasAcademicValues = [tenthPercentage, twelfthPercentage, graduationCgpa].every(value => value !== null && value !== undefined && value !== '');
  const showAcademicDetails = isFresher && isAcademicCompleted && hasAcademicValues;
  const evaluation = localReferral.hr_evaluation;
  const isSelected = evaluation?.status === 'ACCEPTED';
  const isHrRejected = evaluation?.status === 'REJECTED';
  const statusConfig = statusMap[localReferral.current_status] || { color: 'text-gray-500', label: 'Unknown', icon: FileText };
  const StatusIcon = statusConfig.icon;
  const statusLabel = localReferral.current_status === 'REJECTED' && localReferral.rejection_stage === 'HR' ? 'Rejected by HR' : statusConfig.label;
  const offerStatus = evaluation?.offer_outcome ? offerOutcomeLabels[evaluation.offer_outcome] : evaluation?.offer_released ? 'Offer Released' : 'Offer Not Released';

  const refreshReferral = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get(`/api/reviews?emp_id=${emp_id}`);
      const updated = response.data.find(item => item.id === localReferral.id);
      if (updated) setLocalReferral(updated);
      return updated;
    } catch (error) {
      console.error('Failed to refresh referral:', error.response?.data || error.message);
      toast.error('Could not refresh the latest review information.');
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
      // Keep the existing referral data visible.
    }
  };

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
        expected_review_id: null
      });
      toast.success('SBU review submitted successfully!');
      setDecision('');
      setComment('');
      await refreshReferral();
    } catch (error) {
      console.error('Review submission failed:', error.response?.data || error.message);
      if (error.response?.status === 409) {
        toast.error('Another reviewer has already submitted a decision. Refresh to view it.');
        try { await refreshReferral(); } catch {}
      } else {
        toast.error(error.response?.data?.error || 'Failed to submit review.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRevisionSuccess = async () => {
    await refreshReferral();
    setShowEditReview(false);
  };

  return (
    <>
      <div className="relative rounded-xl border border-gray-200 bg-white p-4 shadow">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{localReferral.candidate_name}</h3>
            <p className="text-sm text-gray-500">{candidateTypeLabels[localReferral.candidate_type] || localReferral.candidate_type}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className={`flex items-center gap-1 text-sm font-medium ${statusConfig.color}`}>
              <StatusIcon size={16} />{statusLabel}
            </span>
            {isSelected && (
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                evaluation.offer_outcome === 'JOINED' ? 'bg-green-50 text-green-700 border-green-200' :
                ['OFFER_DECLINED', 'DID_NOT_JOIN'].includes(evaluation.offer_outcome) ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>{offerStatus}</span>
            )}
          </div>
        </div>
        <button onClick={handleOpenDetails} className="mt-2 cursor-pointer text-sm text-[#111111] underline">View Details</button>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <button onClick={() => { setExpanded(false); setShowEditReview(false); }} className="absolute right-3 top-3 cursor-pointer text-gray-400 hover:text-black" aria-label="Close referral details"><X size={20} /></button>
            <h2 className="mb-2 pr-8 text-xl font-semibold">{localReferral.candidate_name}</h2>
            <p className="mb-4 text-sm text-gray-600">{candidateTypeLabels[localReferral.candidate_type] || localReferral.candidate_type}</p>

            <ReferralProgressBar
              currentStatus={localReferral.current_status}
              rejection_stage={localReferral.rejection_stage}
              submitted_at={localReferral.submitted_at}
              considered_at={localReferral.considered_at || currentReview?.reviewed_at}
              final_at={localReferral.final_at}
            />

            <Section title="Candidate & Referral Information" icon={FileText}>
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
                <Detail label="Submitted At" value={formatDate(localReferral.submitted_at)} />
                <Detail label="Candidate Email" value={localReferral.candidate_email} />
                <Detail label="Candidate Phone" value={localReferral.candidate_phone} />
                <Detail label="Assigned SBU Reviewers" value={localReferral.sbus?.length ? localReferral.sbus.map(sbu => sbu.name).join(', ') : 'N/A'} />
                <Detail label="Referral Category" value={referralReasonLabels[localReferral.referral_reason_type]} />
                <Detail label="Referrer Name" value={localReferral.referrer?.name} />
                <Detail label="Referrer Employee ID" value={localReferral.referrer?.emp_id} />
                <Detail label="Referrer Email" value={localReferral.referrer?.email} />
                <Detail label="Referrer Comments" value={localReferral.additional_comment} />
              </div>
              {localReferral.cv_url && (
                <a href={localReferral.cv_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
                  <FileText size={16} /> Download CV <ExternalLink size={14} />
                </a>
              )}
            </Section>

            {showAcademicDetails && (
              <Section title="Finalized Academic Details" icon={GraduationCap}>
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-green-700">
                  <ShieldCheck size={16} /> Verified & Permanently Locked by HR
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                {localReferral.academic_details_updated_at && (
                  <p className="mt-3 text-xs text-gray-500">Finalized on: {formatDate(localReferral.academic_details_updated_at)}</p>
                )}
                <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
                  <Lock size={14} className="mt-0.5 shrink-0" />
                  <p>These academic records are read-only and cannot be modified by SBU reviewers.</p>
                </div>
              </Section>
            )}

            <Section title="Current SBU Recommendation" icon={UserCheck}>
              {hasExistingReview ? (
                <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-medium">Latest Decision</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${currentReview.decision === 'CONSIDERED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {getDecisionLabel(currentReview.decision)}
                    </span>
                  </div>
                  <Detail label="Reviewed By" value={currentReview.reviewed_by?.name} />
                  <Detail label="Reviewed On" value={formatDate(currentReview.reviewed_at)} />
                  <Detail label="Reviewer Comment" value={currentReview.comment} />
                </div>
              ) : (
                <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-500">No SBU review has been submitted yet.</div>
              )}
            </Section>

            <Section title="Complete SBU Review History" icon={History}>
              <button type="button" onClick={() => setShowHistory(prev => !prev)} className="flex w-full cursor-pointer items-center justify-between text-sm font-semibold text-blue-600" aria-expanded={showHistory}>
                <span>{reviewHistory.length} recorded review(s) — {showHistory ? 'Hide History' : 'View History'}</span>
                {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {showHistory && (
                <div className="mt-4 space-y-3">
                  {reviewHistory.length ? reviewHistory.map((review, index) => (
                    <div key={review.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{review.reviewed_by?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{review.reviewed_by?.email || ''}</p>
                          <p className="mt-1 text-xs text-gray-500">{formatDate(review.reviewed_at)}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${review.decision === 'CONSIDERED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {getDecisionLabel(review.decision)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm text-gray-700">{review.comment || 'No comment'}</p>
                      {index === 0 && <p className="mt-2 text-xs font-semibold text-blue-600">Latest SBU Decision</p>}
                    </div>
                  )) : <p className="text-sm text-gray-500">No SBU review history recorded.</p>}
                </div>
              )}
            </Section>

            <Section title="Final HR Evaluation" icon={Briefcase}>
              {evaluation?.evaluation_status === 'COMPLETED' ? (
                <>
                  <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
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
                    <Lock size={15} className="shrink-0" /> HR has finalized and permanently locked this evaluation.
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  {localReferral.current_status === 'REJECTED' ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <Clock size={18} className="mt-0.5 shrink-0" />}
                  <p>
                    {localReferral.current_status === 'REJECTED'
                      ? 'This referral was rejected during SBU review. HR evaluation is not applicable.'
                      : hrStarted
                        ? 'HR evaluation is in progress. The final decision will appear once HR finalizes the evaluation.'
                        : currentReview?.decision === 'CONSIDERED'
                          ? 'The candidate has been recommended for HR evaluation. Awaiting HR to begin the evaluation.'
                          : 'HR evaluation has not started. The final decision will become available after SBU consideration.'}
                  </p>
                </div>
              )}
            </Section>

            {isSelected && <OfferReport evaluation={evaluation} />}

            {['REJECTED', 'FINAL_REJECTED'].includes(localReferral.current_status) && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <strong>Rejection Reason:</strong> {localReferral.rejection_reason || (localReferral.current_status === 'REJECTED' ? currentReview?.comment : evaluation?.comment) || 'Not specified'}
              </div>
            )}

            {!canEditReview && (
              <div className="mt-6 flex items-start gap-3 rounded-lg border bg-gray-100 p-4">
                <Lock size={18} className="shrink-0 text-gray-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">SBU Review Locked</p>
                  <p className="mt-1 text-xs text-gray-600">
                    {isFinalized ? 'HR has finalized this referral. SBU decisions can no longer be modified.' : hrStarted ? 'HR evaluation has already started. SBU decisions can no longer be modified.' : 'SBU review editing is currently unavailable.'}
                  </p>
                </div>
              </div>
            )}

            {hasExistingReview && canEditReview && (
              <div className="mt-6">
                <p className="mb-3 text-xs text-gray-500">Assigned SBU reviewers may revise the current recommendation before HR begins evaluation. Previous reviews will remain in the history.</p>
                <button onClick={() => setShowEditReview(true)} className="cursor-pointer rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Revise SBU Review</button>
              </div>
            )}

            {!hasExistingReview && canEditReview && (
              <div className="mt-6 space-y-3 border-t pt-6">
                <h3 className="text-sm font-semibold">Submit SBU Review</h3>
                <select value={decision} onChange={e => setDecision(e.target.value)} className="w-full rounded border p-2" required>
                  <option value="">-- Select Decision --</option>
                  <option value="CONSIDERED">Accept</option>
                  <option value="REJECTED">Reject</option>
                </select>
                <textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full rounded border p-2" placeholder="Add review comment..." rows={4} required />
                <button onClick={handleReviewSubmit} disabled={loading || refreshing} className="cursor-pointer rounded bg-[#F6490D] px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-60">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit Review'}
                </button>
              </div>
            )}

            {refreshing && (
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <Loader2 size={14} className="animate-spin" /> Refreshing referral information...
              </div>
            )}
          </div>
        </div>
      )}

      {showEditReview && (
        <EditReviewForm
          referral={localReferral}
          review={currentReview}
          emp_id={emp_id}
          onClose={() => setShowEditReview(false)}
          onSuccess={handleRevisionSuccess}
        />
      )}
    </>
  );
}