'use client'

import { useEffect, useState } from 'react';
import axios from 'axios';
import ReferralCard from '@/_components/ReferralCard';
import { useUser } from '@/context/UserContext';
import { toast } from "sonner"
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useUser()
  const [btnloading, setBtnLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [departments, setDepartments] = useState([])
  const [sbuOptions, setSbuOptions] = useState([])
  const [referrals, setReferrals] = useState([])
  const [cvUrl , setCvUrl] = useState("")
  const [formData, setFormData] = useState({
    candidate_name: '',
    candidate_type: 'FULL_TIME',
    cv: null,
    department: '',
    sbus: [],
    additional_comment: '',
  })
  const [showForm, setShowForm] = useState(false)

  // 1. Load Departments
  useEffect(() => {
    axios.get('/api/departments/')
      .then(res => setDepartments(res.data))
      .catch(err => console.error(err));
  }, []);

  // 2. Load Referrals and end loading when both are fetched
  useEffect(() => {
    if (!loading && user?.emp_id) {
      axios.get(`/api/referrals/?emp_id=${user.emp_id}`)
        .then(res => setReferrals(res.data))
        .catch(err => console.error(err))
        .finally(() => setPageLoading(false));  // ✅ set loading false only after referrals loaded
    }
  }, [loading, user]);


  const handleDepartmentChange = (dept) => {
    setFormData(prev => ({ ...prev, department: dept }))
    if (dept === 'ALL') {
      const allReviewers = departments.flatMap(dep => dep.reviewers)
      setSbuOptions(deduplicateEmails(allReviewers))
    } else {
      const selected = departments.find(d => d.name === dept)
      if (selected) setSbuOptions(selected.reviewers)
    }
  }

  const deduplicateEmails = (arr) => {
    const map = {}
    for (const item of arr) map[item.email] = item
    return Object.values(map)
  }

  const removeReferralFromList = (referralId) => {
    setReferrals(prev => prev.filter(r => r.id !== referralId));
  };

    const handleUpdateReferral = (updatedReferral) => {
    setReferrals(prev =>
      prev.map(r => r.id === updatedReferral.id ? updatedReferral : r)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBtnLoading(true)

    if (!formData.candidate_name || !formData.cv || formData.sbus.length === 0) {
      toast.warning("Fill all required fields.");
      return;
    }

    try {
      const cvData = new FormData();
      cvData.append("cv", formData.cv);

      console.log("📤 Starting file upload:", formData.cv?.name);

      let uploadedCvUrl = "";

      try {
        const cvRes = await axios.post('/api/upload-cv', cvData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        uploadedCvUrl = cvRes.data.url;
        console.log("✅ File uploaded successfully. URL:", uploadedCvUrl);
      } catch (uploadError) {
        console.error("❌ Upload failed:", uploadError.response?.data || uploadError.message);
        toast.error("Upload failed! Could not upload the CV.");
        setBtnLoading(false)
        return;
      }
      const referralData = {
        candidate_name: formData.candidate_name,
        candidate_type: formData.candidate_type,
        sbu_emails: formData.sbus.map(s => s.email),
        cv_url: uploadedCvUrl,
        additional_comment: formData.additional_comment,
        emp_id: user?.emp_id,
      }

      console.log(referralData)

      // ✅ Now use uploadedCvUrl directly
      await axios.post('/api/referrals', {
        candidate_name: formData.candidate_name,
        candidate_type: formData.candidate_type,
        sbu_emails: formData.sbus.map(s => s.email),
        cv_url: uploadedCvUrl,
        additional_comment: formData.additional_comment,
        emp_id: user?.emp_id,
      });

      toast.success("Referral submitted successfully!");
      setBtnLoading(false)
      setShowForm(false);
      setFormData({
          candidate_name: '',
          candidate_type: 'FULL_TIME',
          cv: null,
          department: '',
          sbus: [],
          additional_comment: '',
      })

      // ✅ Refresh referral list
      const res = await axios.get(`/api/referrals?emp_id=${user.emp_id}`);
      setReferrals(res.data);
    } catch (err) {
      setBtnLoading(false)
      console.error(err);
      toast.error("Submission failed! Something went wrong.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">CVs Referred By You:</h2>
        <button
          onClick={() => setShowForm(prev => !prev)}
          className="bg-[#F6490D] cursor-pointer text-white px-4 py-2 rounded-md shadow hover:opacity-90 font-semibold text-sm"
        >
          {'Refer A CV'}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-1 rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto border shadow">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg w-full max-w-xl space-y-4 overflow-y-scroll overflow-x-auto">
          <input
            type="text"
            placeholder="Candidate Name"
            className="w-full border p-2 rounded"
            value={formData.candidate_name}
            onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
            required
          />
          <select
            value={formData.candidate_type}
            onChange={(e) => setFormData({ ...formData, candidate_type: e.target.value })}
            className="w-full border p-2 rounded"
            required
          >
            <option value="FULL_TIME">Full Time</option>
            <option value="INTERN">Internship</option>
          </select>
          <select
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">-- Select Department --</option>
            <option value="ALL">ALL</option>
            {departments.map((d, idx) => (
              <option key={idx} value={d.name}>{d.name}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            {sbuOptions.map((sbu, idx) => (
              <label key={idx} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    const selected = [...formData.sbus];
                    if (e.target.checked) selected.push(sbu);
                    else selected.splice(selected.findIndex(s => s.email === sbu.email), 1);
                    setFormData({ ...formData, sbus: selected });
                  }}
                />
                {sbu.name} ({sbu.email})
              </label>
            ))}
          </div>

          <input
            type="file"
            name="cv" // ✅ MUST be "cv" to match Django
            accept=".pdf,.doc,.docx"
            className="w-full border p-2 rounded"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file && file.size > 5 * 1024 * 1024) {
                toast.warning("File size should not exceed 5MB");
                return;
              }
              setFormData({ ...formData, cv: file });
            }}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Accepted formats: PDF, DOC, DOCX. Max size: 5MB.
          </p>

          <textarea
            rows="3"
            className="w-full border p-2 rounded"
            placeholder="Additional Comments"
            value={formData.additional_comment}
            onChange={(e) => setFormData({ ...formData, additional_comment: e.target.value })}
          />

           <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="bg-[#F6490D] text-white px-4 py-2 rounded-md shadow  cursor-pointer"
            >
              { btnloading ? <Loader2 className="animate-spin w-5 h-5" />  : "Submit Referral"}
            </button>
            <button
                type="button"
              onClick={() => setShowForm(false)}
              className="bg-[#111111] text-white px-4 py-2 rounded-md shadow cursor-pointer"
            >
              Close Form
            </button>
          </div>
            </form>
            </div>
          </div>
      )}

      {/* <h3 className="text-lg font-semibold mb-4">Your Referred CVs</h3> */}
      {pageLoading ? (
          <div className="text-center text-lg text-gray-500 font-thin py-8">
            Loading your dashboard...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {referrals.length === 0 ? (
              <h2 className="text-gray-500">You Have No Referrals Yet</h2>
            ) : (
              referrals.map((referral) => (
                <ReferralCard
                  key={referral.id}
                  referral={referral}
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
