'use client'

import ReferralCardSBU from '@/_components/ReferralCardSBU';
import { useUser } from '@/context/UserContext';
import { useEffect, useState } from 'react';


export default function ReviewsPage() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (!user?.emp_id) return;

    fetch(`/api/reviews?emp_id=${user.emp_id}`)
      .then(res => res.json())
      .then(data => setReferrals(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">CVs Assigned to You for Review:</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {referrals?.length === 0 ? 
              <h2 className="text-lg font-thin">You Have No CVs To Review Yet!</h2>
          :
              referrals?.map((ref) => (
            <ReferralCardSBU key={ref.id} referral={ref} emp_id={user.emp_id} />
          ))}
        </div>
      )}
    </div>
  );
}
