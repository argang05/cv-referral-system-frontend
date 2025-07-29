'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import ReferralCardHR from '@/_components/ReferralCardHR';

export default function HREvaluationPage() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/hr-evaluation');
        setReferrals(res.data);
      } catch (error) {
        console.error('Failed to fetch referrals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold mb-6">HR Evaluation Page:</h2>

      {loading ? (
        <p className="text-gray-500">Loading CVs for HR Review...</p>
      ) : referrals.length === 0 ? (
        <p className="text-gray-500">You have no CVs for HR Evaluation.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {referrals.map((ref) => (
            <ReferralCardHR key={ref.id} referral={ref} />
          ))}
        </div>
      )}
    </div>
  );
}
