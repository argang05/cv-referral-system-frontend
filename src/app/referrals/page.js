'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import ReferralCard from '@/_components/ReferralCard';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const initialFormData = {
  candidate_name: '',
  candidate_email: '',
  candidate_phone: '',
  candidate_type: 'FULL_TIME_FRESHER',
  referral_reason_type: '',
  cv: null,
  department: '',
  sbus: [],
  additional_comment: '',
};

function ReferralsPage() {
  const { user, loading } = useUser();
  const [btnloading, setBtnLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [sbuOptions, setSbuOptions] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [showForm, setShowForm] = useState(false);

  // Load departments and assigned reviewers
  useEffect(() => {
    axios.get('/api/departments/')
      .then(res => setDepartments(res.data))
      .catch(err => {
        console.error('Failed to load departments:', err);
        toast.error('Unable to load SBU information.');
      });
  }, []);

  // Load employee referrals
  useEffect(() => {
    if (!loading && user?.emp_id) {
      axios.get(`/api/referrals/?emp_id=${user.emp_id}`)
        .then(res => setReferrals(res.data))
        .catch(err => console.error('Failed to load referrals:', err))
        .finally(() => setPageLoading(false));
    } else if (!loading) {
      setPageLoading(false);
    }
  }, [loading, user?.emp_id]);

  // Deduplicate reviewers by email
  const deduplicateEmails = reviewers => {
    const reviewerMap = new Map();
    reviewers.forEach(reviewer => {
      if (!reviewer?.email) return;
      const normalizedEmail = reviewer.email.trim().toLowerCase();
      if (!reviewerMap.has(normalizedEmail)) reviewerMap.set(normalizedEmail, reviewer);
    });
    return Array.from(reviewerMap.values());
  };

  // Automatically assign reviewers when SBU changes
  const handleDepartmentChange = selectedDepartment => {
    const selected = departments.find(department => department.name === selectedDepartment);
    const assignedReviewers = selected ? deduplicateEmails(Array.isArray(selected.reviewers) ? selected.reviewers : []) : [];
    setSbuOptions(assignedReviewers);
    setFormData(prev => ({ ...prev, department: selectedDepartment, sbus: assignedReviewers }));
  };

  // Update referral list
  const removeReferralFromList = referralId => {
    setReferrals(prev => prev.filter(referral => referral.id !== referralId));
  };

  const handleUpdateReferral = updatedReferral => {
    setReferrals(prev => prev.map(referral => referral.id === updatedReferral.id ? updatedReferral : referral));
  };

  // Close and reset form
  const handleCloseForm = () => {
    if (btnloading) return;
    setShowForm(false);
    setFormData({ ...initialFormData });
    setSbuOptions([]);
  };

  // Submit referral
  const handleSubmit = async e => {
    e.preventDefault();
    if (btnloading) return;

    // Validate existing mandatory fields
    if (!formData.candidate_name.trim() || !formData.candidate_type || !formData.referral_reason_type || !formData.department || !formData.cv) {
      toast.warning('Please fill all required fields.');
      return;
    }

    // Validate automatic reviewer assignment
    if (formData.sbus.length === 0) {
      toast.warning('No reviewers are assigned to the selected SBU.');
      return;
    }

    // NEW: At least one contact method must be provided
    const candidateEmail = formData.candidate_email.trim();
    const candidatePhone = formData.candidate_phone.trim();

    if (!candidateEmail && !candidatePhone) {
      toast.warning('Please provide at least one contact detail: Candidate Email or Phone Number.');
      return;
    }

    // Validate email format if provided
    if (candidateEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(candidateEmail)) {
        toast.warning('Please enter a valid candidate email.');
        return;
      }
    }

    // Validate phone number if provided
    if (candidatePhone.length > 20) {
      toast.warning('Candidate phone number cannot exceed 20 characters.');
      return;
    }

    if (candidatePhone && !/^\+?[0-9\s()-]+$/.test(candidatePhone)) {
      toast.warning('Please enter a valid candidate phone number.');
      return;
    }

    setBtnLoading(true);

    try {
      // Step 1: Upload CV
      const cvData = new FormData();
      cvData.append('cv', formData.cv);
      console.log('Starting CV upload:', formData.cv?.name);

      let uploadedCvUrl = '';

      try {
        const cvRes = await axios.post('/api/upload-cv', cvData);
        uploadedCvUrl = cvRes.data.url;
        if (!uploadedCvUrl) throw new Error('CV upload did not return a URL.');
        console.log('CV uploaded successfully:', uploadedCvUrl);
      } catch (uploadError) {
        console.error('CV upload failed:', uploadError.response?.data || uploadError.message);
        toast.error('Upload failed! Could not upload the CV.');
        return;
      }

      // Step 2: Construct referral payload
      const referralData = {
        emp_id: user?.emp_id,
        candidate_name: formData.candidate_name.trim(),
        candidate_email: candidateEmail || null,
        candidate_phone: candidatePhone || null,
        candidate_type: formData.candidate_type,
        referral_reason_type: formData.referral_reason_type,
        sbu_emails: formData.sbus.map(reviewer => reviewer.email),
        cv_url: uploadedCvUrl,
        additional_comment: formData.additional_comment,
      };

      console.log('Submitting referral:', referralData);

      // Step 3: Submit referral
      await axios.post('/api/referrals', referralData);
      toast.success('Referral submitted successfully!');

      // Step 4: Reset form
      setShowForm(false);
      setFormData({ ...initialFormData });
      setSbuOptions([]);

      // Step 5: Refresh referrals
      try {
        const res = await axios.get(`/api/referrals/?emp_id=${user.emp_id}`);
        setReferrals(res.data);
      } catch (refreshError) {
        console.error('Failed to refresh referrals:', refreshError);
        toast.warning('Referral submitted, but the list could not be refreshed.');
      }
    } catch (err) {
      console.error('Referral submission failed:', err.response?.data || err.message);
      toast.error(err.response?.data?.error || 'Submission failed! Something went wrong.');
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">CVs Referred By You:</h2>
        <button onClick={() => setShowForm(prev => !prev)} className="bg-[#F6490D] cursor-pointer text-white px-4 py-2 rounded-md shadow hover:opacity-90 font-semibold text-sm">
          Refer A CV
        </button>
      </div>

      {/* Referral Submission Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-1 rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto border shadow">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg w-full max-w-xl space-y-4 overflow-y-scroll overflow-x-auto">

              {/* Candidate Name */}
              <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name:</label>
              <input type="text" placeholder="Candidate Name" className="w-full border p-2 rounded" value={formData.candidate_name} onChange={e => setFormData({ ...formData, candidate_name: e.target.value })} required />

              {/* Candidate Contact Details */}
              <div className="rounded-md border border-orange-200 bg-orange-50/50 p-3">
                <p className="text-sm font-semibold text-gray-800">Candidate Contact Details <span className="text-red-500">*</span></p>
                <p className="mt-1 text-xs text-gray-600">Provide at least one contact detail: Email Address or Phone Number. You may provide both.</p>
              </div>

              {/* Candidate Email */}
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Candidate Email:
                <span className="text-gray-400 font-normal ml-2">(Email or Phone required)</span>
              </label>
              <input type="email" placeholder="Candidate Email Address" className="w-full border p-2 rounded" value={formData.candidate_email} onChange={e => setFormData({ ...formData, candidate_email: e.target.value })} maxLength={254} />

              {/* Candidate Phone */}
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Candidate Phone Number:
                <span className="text-gray-400 font-normal ml-2">(Email or Phone required)</span>
              </label>
              <input type="tel" placeholder="Candidate Phone Number" className="w-full border p-2 rounded" value={formData.candidate_phone} onChange={e => setFormData({ ...formData, candidate_phone: e.target.value })} maxLength={20} />

              {/* Candidate Type */}
              <label className="block text-sm font-medium text-gray-700 mb-1">Type and Experience:</label>
              <select value={formData.candidate_type} onChange={e => setFormData({ ...formData, candidate_type: e.target.value })} className="w-full border p-2 rounded" required>
                <optgroup label="Full Time">
                  <option value="FULL_TIME_FRESHER">Full Time - Fresher</option>
                  <option value="FULL_TIME_EXPERIENCED">Full Time - Experienced</option>
                </optgroup>
                <optgroup label="Internship">
                  <option value="INTERN_FRESHER">Internship - Fresher</option>
                  <option value="INTERN_EXPERIENCED">Internship - Experienced</option>
                </optgroup>
              </select>

              {/* Referral Category */}
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral Category:</label>
              <select className="w-full border p-2 rounded" value={formData.referral_reason_type} onChange={e => setFormData({ ...formData, referral_reason_type: e.target.value })} required>
                <option value="">-- Select Referral Category --</option>
                <option value="COURTESY">Courtesy Referral – Shared out of obligation or goodwill</option>
                <option value="POTENTIAL_FIT">Potential Fit Referral – Strong background, depends on role fitment</option>
                <option value="DIRECT_ROLE_FIT">Direct Role Fit Referral – Clearly aligned to an open position</option>
                <option value="INTERNAL_NETWORK">Internal Network Referral – Former colleague or vendor contact</option>
                <option value="STRATEGIC">Strategic Referral – High-value or niche candidate for special review</option>
              </select>

              {/* SBU Selection */}
              <label className="block text-sm font-medium text-gray-700 mb-1">SBU:</label>
              <select value={formData.department} onChange={e => handleDepartmentChange(e.target.value)} className="w-full border p-2 rounded" required>
                <option value="">-- Select SBU --</option>
                {departments.map((department, idx) => <option key={idx} value={department.name}>{department.name}</option>)}
              </select>

              {/* Automatic SBU Reviewer Routing */}
              {formData.department && (
                <div className="border rounded-md p-3 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-2">Assigned SBU Reviewers:</p>
                  {sbuOptions.length > 0 ? (
                    <>
                      <p className="text-xs text-gray-500 mb-3">Your referral will automatically be routed to the following reviewer(s).</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sbuOptions.map((reviewer, idx) => (
                          <div key={reviewer.email || idx} className="border rounded-md bg-white p-2">
                            <p className="text-sm font-medium text-gray-800">{reviewer.name}</p>
                            <p className="text-xs text-gray-500 break-all">{reviewer.email}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-3">Total Assigned Reviewers: {sbuOptions.length}</p>
                    </>
                  ) : (
                    <p className="text-sm text-red-500">No reviewers are currently assigned to this SBU. Please contact the administrator.</p>
                  )}
                </div>
              )}

              {/* Upload CV */}
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload CV:</label>
              <input type="file" name="cv" accept=".pdf,.doc,.docx" className="w-full border p-2 rounded" onChange={e => {
                const file = e.target.files?.[0] || null;
                if (file && file.size > 5 * 1024 * 1024) {
                  toast.warning('File size should not exceed 5MB');
                  e.target.value = '';
                  setFormData(prev => ({ ...prev, cv: null }));
                  return;
                }
                setFormData(prev => ({ ...prev, cv: file }));
              }} required />
              <p className="text-sm text-gray-500 mt-1">Accepted formats: PDF, DOC, DOCX. Max size: 5MB.</p>

              {/* Additional Comments */}
              <textarea rows="3" className="w-full border p-2 rounded" placeholder="Additional Comments [Optional]" value={formData.additional_comment} onChange={e => setFormData({ ...formData, additional_comment: e.target.value })} />

              {/* Form Actions */}
              <div className="flex justify-end gap-3">
                <button type="submit" disabled={btnloading} className="bg-[#F6490D] text-white px-4 py-2 rounded-md shadow cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                  {btnloading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Submit Referral'}
                </button>
                <button type="button" onClick={handleCloseForm} disabled={btnloading} className="bg-[#111111] text-white px-4 py-2 rounded-md shadow cursor-pointer disabled:opacity-60">
                  Close Form
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Existing Referral Cards */}
      {pageLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse p-5 bg-gray-100 rounded-xl shadow">
              <div className="h-5 bg-gray-300 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 rounded w-5/6 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="flex gap-3">
                <div className="h-8 w-20 bg-gray-300 rounded" />
                <div className="h-8 w-20 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {referrals.length === 0 ? (
            <h2 className="text-gray-500">You Have No Referrals Yet</h2>
          ) : (
            referrals.map(referral => (
              <ReferralCard
                key={referral.id}
                referral={referral}
                currentEmpId={user?.emp_id}
                updateReferralInList={handleUpdateReferral}
                removeReferralFromList={removeReferralFromList}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ReferralsPage;