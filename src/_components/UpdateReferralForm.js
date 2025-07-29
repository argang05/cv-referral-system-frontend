'use client';

import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function UpdateReferralForm({ referral, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    candidate_name: referral.candidate_name,
    candidate_type: referral.candidate_type,
    cv: null,
    additional_comment: referral.additional_comment || '',
  });
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true)    
    let uploadedCvUrl = referral.cv_url; // Default to existing CV URL

    try {
        if (formData.cv) {
        const cvData = new FormData();
        cvData.append('cv', formData.cv);

        const cvRes = await axios.post('/api/upload-cv', cvData, {
            headers: {
            'Content-Type': 'multipart/form-data',
            },
        });

        uploadedCvUrl = cvRes.data.url;
        console.log("✅ File uploaded successfully. URL:", uploadedCvUrl);
        }
    } catch (uploadError) {
        console.error("❌ Upload failed:", uploadError.response?.data || uploadError.message);
        alert("Upload failed! Could not upload the CV.");
        return;
    }

    try {
        const body = {
        referral_id: referral.id,
        emp_id: referral.referrer.emp_id,
        candidate_name: formData.candidate_name,
        candidate_type: formData.candidate_type,
        additional_comment: formData.additional_comment,
        cv_url: uploadedCvUrl,
        };

        const res = await fetch('/api/referrals', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        });

        if (res.ok) {
        setLoading(false)
        onSuccess?.(); // Safe optional chaining
        onClose();
        } else {
           toast.error("Upload Failed!")
        setLoading(false)
        }
    } catch (error) {
        console.error("❌ Update error:", error);
        setLoading(false)
        toast.error("Something went wrong during update")
        // alert('Something went wrong during update');
    }
    };


  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <form
        onSubmit={handleUpdate}
        className="bg-white p-6 rounded-lg w-full max-w-xl border shadow space-y-4 overflow-y-auto max-h-[80vh]"
      >
        <h2 className="text-xl font-bold mb-2">Update Referral</h2>

        <input
          type="text"
          className="w-full border p-2 rounded"
          value={formData.candidate_name}
          onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
          placeholder="Candidate Name"
        />

        <select
          className="w-full border p-2 rounded"
          value={formData.candidate_type}
          onChange={(e) => setFormData({ ...formData, candidate_type: e.target.value })}
        >
          <option value="FULL_TIME">Full Time</option>
          <option value="INTERN">Internship</option>
        </select>

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="w-full border p-2 rounded"
          onChange={(e) => setFormData({ ...formData, cv: e.target.files[0] })}
        />

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
            className="bg-[#F6490D] text-white px-4 py-2 rounded shadow cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Update"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded shadow cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
