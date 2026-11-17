'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle, BookOpen, CheckCircle2, ExternalLink,
  FileText, GraduationCap, LockKeyhole, Save, ShieldAlert, X
} from 'lucide-react';

const EMPTY_MARKS = {
  tenth_percentage: '',
  twelfth_percentage: '',
  graduation_cgpa: ''
};

const FIELD_CONFIG = [
  { key: 'tenth_percentage', label: 'Class 10 Percentage', max: 100, suffix: '%' },
  { key: 'twelfth_percentage', label: 'Class 12 Percentage', max: 100, suffix: '%' },
  { key: 'graduation_cgpa', label: 'Graduation CGPA', max: 10, suffix: '/ 10' }
];

const REFERRAL_REASONS = {
  COURTESY: 'Courtesy Referral',
  POTENTIAL_FIT: 'Potential Fit Referral',
  DIRECT_ROLE_FIT: 'Direct Role Fit Referral',
  INTERNAL_NETWORK: 'Internal Network Referral',
  STRATEGIC: 'Strategic Referral'
};

function displayValue(value) {
  return value === null || value === undefined || value === '' ? 'Not provided' : String(value);
}

function getApiError(error, fallback) {
  const data = error.response?.data;
  if (typeof data?.error === 'string') return data.error;
  if (typeof data?.detail === 'string') return data.detail;
  if (data && typeof data === 'object') {
    const first = Object.values(data)[0];
    if (Array.isArray(first) && first.length) return String(first[0]);
    if (typeof first === 'string') return first;
  }
  return fallback;
}

export default function AcademicDetailsForm({ referral, empId, onClose, onSaved }) {
  const [marks, setMarks] = useState(EMPTY_MARKS);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(referral);

  const isLocked = details?.academic_details_status === 'COMPLETED';
  const referralId = referral?.referral_id;

  useEffect(() => {
    if (!referralId || !empId) return;

    let cancelled = false;

    const fetchDetails = async () => {
      setFetching(true);
      setError('');

      try {
        const response = await axios.get(
          `/api/referrals/academic-details/${referralId}`,
          { params: { emp_id: empId } }
        );

        if (cancelled) return;

        const data = response.data;
        setDetails(data);
        setMarks({
          tenth_percentage: data.academic_details?.tenth_percentage ?? '',
          twelfth_percentage: data.academic_details?.twelfth_percentage ?? '',
          graduation_cgpa: data.academic_details?.graduation_cgpa ?? ''
        });
      } catch (err) {
        if (!cancelled) setError(getApiError(err, 'Unable to load academic details.'));
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [referralId, empId]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && !loading) {
        if (showWarning) {
          setShowWarning(false);
          setAcknowledged(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showWarning, loading, onClose]);

  const updateMark = (field, value) => {
    setMarks((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateMarks = (finalize = false) => {
    for (const field of FIELD_CONFIG) {
      const value = marks[field.key];

      if (value === '' || value === null || value === undefined) {
        if (finalize) return `${field.label} is mandatory before finalization.`;
        continue;
      }

      const number = Number(value);

      if (!Number.isFinite(number) || number < 0 || number > field.max) {
        return `${field.label} must be between 0 and ${field.max}.`;
      }

      if (!/^\d+(\.\d{1,2})?$/.test(String(value))) {
        return `${field.label} must have at most two decimal places.`;
      }
    }

    return '';
  };

  const submitAcademicDetails = async (action) => {
    if (loading || isLocked) return;

    const validationError = validateMarks(action === 'FINALIZE');
    if (validationError) {
      setError(validationError);
      setShowWarning(false);
      return;
    }

    setLoading(true);
    setError('');

    const payload = { emp_id: empId, action };

    for (const field of FIELD_CONFIG) {
      const value = marks[field.key];
      payload[field.key] = value === '' || value === null ? null : Number(value);
    }

    try {
      const response = await axios.patch(
        `/api/referrals/academic-details/${referralId}`,
        payload
      );

      setShowWarning(false);
      setAcknowledged(false);
      await onSaved(response.data.message || 'Academic details saved successfully.');
    } catch (err) {
      setError(getApiError(err, 'Failed to save academic details.'));
      setShowWarning(false);
      setAcknowledged(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeClick = () => {
    const validationError = validateMarks(true);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setAcknowledged(false);
    setShowWarning(true);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-3 sm:p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Candidate academic details"
        className="bg-white w-full max-w-4xl max-h-[94vh] overflow-y-auto rounded-2xl shadow-2xl"
      >
        <div className="sticky top-0 z-10 bg-[#111111] text-white px-5 sm:px-7 py-5 flex justify-between items-start gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <GraduationCap size={25} className="text-[#F6490D]" />
              Candidate Academic Verification
            </h2>
            <p className="text-sm text-gray-300 mt-1">
              Review referral information and collect academic records.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50"
            aria-label="Close academic details"
          >
            <X size={22} />
          </button>
        </div>

        {fetching ? (
          <div className="py-20 text-center text-gray-500">Loading candidate details...</div>
        ) : (
          <div className="p-5 sm:p-7 space-y-7">
            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                {error}
              </div>
            )}

            <section>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={19} className="text-[#F6490D]" />
                  Referral Information
                </h3>
                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  READ ONLY
                </span>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 text-sm">
                  <InfoItem label="Candidate Name" value={details?.candidate_name} />
                  <InfoItem
                    label="Candidate Type"
                    value={details?.candidate_type === 'INTERN_FRESHER' ? 'Internship Fresher' : 'Full-Time Fresher'}
                  />
                  <InfoItem label="Candidate Email" value={details?.candidate_email} />
                  <InfoItem label="Candidate Phone" value={details?.candidate_phone} />
                  <InfoItem label="Referred By" value={details?.referrer?.name} />
                  <InfoItem label="Referrer Email" value={details?.referrer?.email} />
                  <InfoItem
                    label="Referral Reason"
                    value={REFERRAL_REASONS[details?.referral_reason_type] || details?.referral_reason_type}
                  />
                  <InfoItem
                    label="Assigned SBUs"
                    value={details?.sbus?.map((sbu) => sbu.name).join(', ') || 'Not assigned'}
                  />
                  <div className="sm:col-span-2">
                    <InfoItem label="Additional Comments" value={details?.additional_comment} />
                  </div>
                </div>

                {details?.cv_url && (
                  <a
                    href={details.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-800 hover:border-[#F6490D] hover:text-[#F6490D] text-sm font-semibold transition-colors"
                  >
                    <ExternalLink size={16} />
                    Download Candidate CV
                  </a>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen size={19} className="text-[#F6490D]" />
                  Academic Information
                </h3>
                {isLocked && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                    <LockKeyhole size={13} />
                    Permanently Locked
                  </span>
                )}
              </div>

              {isLocked && (
                <div className="mb-5 flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 className="text-emerald-700 shrink-0" size={20} />
                  <p className="text-sm text-emerald-800">
                    These academic records have been finalized and permanently locked. They are available for SBU review and cannot be edited.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {FIELD_CONFIG.map((field) => (
                  <div key={field.key}>
                    <label htmlFor={field.key} className="block text-sm font-semibold text-gray-800 mb-2">
                      {field.label} {!isLocked && <span className="text-red-600">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        id={field.key}
                        type="number"
                        min="0"
                        max={field.max}
                        step="0.01"
                        inputMode="decimal"
                        value={marks[field.key]}
                        onChange={(event) => updateMark(field.key, event.target.value)}
                        disabled={isLocked || loading}
                        placeholder={field.max === 10 ? 'e.g. 8.75' : 'e.g. 85.50'}
                        className="w-full border border-gray-300 rounded-lg px-3 py-3 pr-12 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#F6490D]/30 focus:border-[#F6490D] disabled:bg-gray-100 disabled:text-gray-600"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">
                        {field.suffix}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Allowed range: 0–{field.max}</p>
                  </div>
                ))}
              </div>

              {!isLocked && (
                <p className="mt-4 text-xs text-gray-500">
                  You may save incomplete details as a draft. All three valid values are mandatory only when finalizing.
                </p>
              )}
            </section>

            <div className="border-t border-gray-200 pt-5 flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {isLocked ? 'Close' : 'Cancel'}
              </button>

              {!isLocked && (
                <>
                  <button
                    type="button"
                    onClick={() => submitAcademicDetails('SAVE_DRAFT')}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 disabled:opacity-50"
                  >
                    <Save size={17} />
                    {loading ? 'Saving...' : 'Save Draft'}
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalizeClick}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F6490D] text-white font-semibold text-sm hover:bg-[#df400b] disabled:opacity-50"
                  >
                    <LockKeyhole size={17} />
                    Finalize & Lock
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showWarning && (
        <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="academic-warning-title"
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-red-50 border-b border-red-200 px-6 py-6 text-center">
              <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <ShieldAlert size={29} className="text-red-700" />
              </div>
              <h3 id="academic-warning-title" className="text-xl font-extrabold text-red-800">
                FINAL SUBMISSION WARNING
              </h3>
              <p className="text-sm text-red-700 mt-2">
                You are about to permanently finalize this candidate's academic details.
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="rounded-lg bg-amber-50 border border-amber-300 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={20} className="text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900 space-y-2">
                    <p className="font-bold">Please review these consequences carefully:</p>
                    <p>Academic marks will be permanently locked.</p>
                    <p>Further editing will not be permitted.</p>
                    <p>The referral will become eligible for SBU review.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 text-sm space-y-2">
                <p className="font-semibold text-gray-900">Values being finalized</p>
                <p className="text-gray-700">Class 10: <strong>{marks.tenth_percentage}%</strong></p>
                <p className="text-gray-700">Class 12: <strong>{marks.twelfth_percentage}%</strong></p>
                <p className="text-gray-700">Graduation CGPA: <strong>{marks.graduation_cgpa}/10</strong></p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  disabled={loading}
                  className="mt-1 w-4 h-4 accent-[#F6490D]"
                />
                <span className="text-sm font-medium text-gray-800">
                  I have carefully reviewed all academic values and understand that they cannot be modified after final submission.
                </span>
              </label>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowWarning(false);
                    setAcknowledged(false);
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Go Back & Review
                </button>

                <button
                  type="button"
                  onClick={() => submitAcademicDetails('FINALIZE')}
                  disabled={!acknowledged || loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-700 text-white rounded-lg text-sm font-bold hover:bg-red-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  <LockKeyhole size={16} />
                  {loading ? 'Finalizing...' : 'Confirm & Lock Details'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-800 break-words">{displayValue(value)}</p>
    </div>
  );
}