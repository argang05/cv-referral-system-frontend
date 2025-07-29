'use client';

import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function EditReviewForm({ referral, review, emp_id, onClose, onSuccess }) {
  const [decision, setDecision] = useState(review.decision);
  const [comment, setComment] = useState(review.comment);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true)

    try {
      const body = {
        referral_id: referral.id,
        decision,
        comment,
        emp_id,
      }
      console.log('Submitting Updated Data Like: ',body)
      await axios.put('/api/reviews', {
        referral_id: referral.id,
        decision,
        comment,
        emp_id,
      });
      toast.success('Review updated successfully!');
      setLoading(false)
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to update review.');
      setLoading(false)
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <form
        onSubmit={handleUpdate}
        className="bg-white rounded-xl shadow p-6 w-full max-w-lg space-y-4"
      >
        <h2 className="text-xl font-bold">Edit Your Review</h2>

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
          placeholder="Update comment..."
        />

        <div className="flex justify-end gap-3">
          <button type="submit" className="bg-[#F6490D] text-white px-4 py-2 rounded shadow cursor-pointer">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> :"Update"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
