'use client'

import ReferralCardSBU from '@/_components/ReferralCardSBU';
import { useUser } from '@/context/UserContext';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ReviewsPage() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchReferrals = async () => {
      // Reset states at the start of fetch
      setLoading(true);
      setError(null);

      // Early return if no user or emp_id
      if (!user?.emp_id) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/reviews?emp_id=${user.emp_id}`);
        
        // Check if response data exists and is an array
        if (response.data && Array.isArray(response.data)) {
          setReferrals(response.data);
        } else {
          setReferrals([]);
          console.warn('API returned unexpected data format:', response.data);
        }
      } catch (err) {
        console.error('Error fetching referrals:', err);
        
        // Set user-friendly error message
        if (err.response) {
          // Server responded with error status
          setError(`Server error: ${err.response.status} - ${err.response.data?.message || 'Failed to fetch reviews'}`);
        } else if (err.request) {
          // Network error
          setError('Network error: Unable to connect to server');
        } else {
          // Other error
          setError('An unexpected error occurred while fetching reviews');
        }
        
        // Set empty array as fallback
        setReferrals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [user?.emp_id]); // More specific dependency

  // Handle case where user context is not available
  if (!user) {
    return (
      <div className="p-6">
        <p>Loading user information...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">CVs Assigned to You for Review:</h2>
      
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="text-red-600 bg-red-50 p-4 rounded-md">
          <p className="font-medium">Error loading reviews:</p>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {referrals?.length === 0 ? (
            <h2 className="text-lg font-thin">You Have No CVs To Review Yet!</h2>
          ) : (
            referrals?.map((ref) => (
              <ReferralCardSBU 
                key={ref.id} 
                referral={ref} 
                emp_id={user.emp_id} 
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}