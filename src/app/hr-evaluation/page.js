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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="animate-pulse p-5 bg-gray-100 rounded-xl shadow"
              >
                <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="flex gap-3">
                  <div className="h-8 w-20 bg-gray-300 rounded" />
                  <div className="h-8 w-20 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
        </div>
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
