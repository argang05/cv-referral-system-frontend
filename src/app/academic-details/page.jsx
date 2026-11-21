'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import AcademicDetailsCard from '@/_components/AcademicDetailsCard';
import AcademicDetailsForm from '@/_components/AcademicDetailsForm';
import {
  AlertCircle, CheckCircle2, ClipboardList, GraduationCap,
  Loader2, LockKeyhole, RefreshCw, Search
} from 'lucide-react';

function getApiError(error, fallback) {
  const data = error.response?.data;
  if (typeof data?.error === 'string') return data.error;
  if (typeof data?.detail === 'string') return data.detail;
  return fallback;
}

export default function AcademicDetailsPage() {
  const { user } = useUser();
  const empId = user?.emp_id;
  const isHR = Boolean(user?.is_hr);

  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [referrals, setReferrals] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReferrals = useCallback(async (showRefresh = false) => {
    if (!empId || !isHR) {
      setLoading(false);
      return;
    }

    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setError('');

    try {
      const response = await axios.get('/api/referrals/academic-details', {
        params: { emp_id: empId, status: activeTab }
      });

      const results = Array.isArray(response.data?.results) ? response.data.results : [];
      setReferrals(results);
    } catch (err) {
      setError(getApiError(err, 'Unable to load academic referrals.'));
      setReferrals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [empId, isHR, activeTab]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  const filteredReferrals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return referrals;

    return referrals.filter((referral) => {
      const values = [
        referral.candidate_name,
        referral.candidate_email,
        referral.candidate_phone,
        referral.referrer?.name,
        referral.referrer?.emp_id,
        ...(referral.sbus || []).map((sbu) => sbu.name)
      ];

      return values.some((value) => String(value ?? '').toLowerCase().includes(query));
    });
  }, [referrals, search]);

  const handleSaved = async (message, action) => {
    setSelectedReferral(null);
    setSuccess(message);
    if (action === 'FINALIZE') window.dispatchEvent(new Event('notifications:refresh'));
    await fetchReferrals(true);
  };

  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-[#F6490D]" size={32} />
          <p className="text-gray-600 mt-3">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!isHR) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center max-w-md shadow-sm">
          <AlertCircle size={38} className="text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
          <p className="text-gray-600 mt-2 text-sm">
            Only authorized HR personnel can access academic verification records.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 sm:px-6 lg:px-10 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-7">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center">
                <GraduationCap size={25} className="text-[#F6490D]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Academic Details
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Collect, verify and finalize academic records for fresher candidates.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchReferrals(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {success && (
          <div role="status" className="mb-5 flex items-start gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800">
            <CheckCircle2 size={20} className="shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div role="alert" className="mb-5 flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('ACTIVE')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'ACTIVE'
                    ? 'bg-[#111111] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ClipboardList size={17} />
                Pending / Drafts
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('COMPLETED')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'COMPLETED'
                    ? 'bg-[#111111] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <LockKeyhole size={16} />
                Completed
              </button>
            </div>

            <div className="relative w-full md:w-80">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search candidates or referrers..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#F6490D]/20 focus:border-[#F6490D]"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="animate-spin text-[#F6490D] mx-auto" size={35} />
            <p className="text-gray-500 mt-4">Loading academic records...</p>
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-20 px-6 text-center">
            <GraduationCap size={45} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800">
              {search ? 'No matching candidates' : activeTab === 'ACTIVE' ? 'No pending academic records' : 'No completed academic records'}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              {search
                ? 'Try searching with a different name, email, or employee ID.'
                : activeTab === 'ACTIVE'
                  ? 'Fresher referrals requiring academic verification will appear here.'
                  : 'Finalized academic records will appear here.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Showing <span className="font-semibold text-gray-800">{filteredReferrals.length}</span> candidate(s)
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredReferrals.map((referral) => (
                <AcademicDetailsCard
                  key={referral.referral_id}
                  referral={referral}
                  onOpen={setSelectedReferral}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {selectedReferral && (
        <AcademicDetailsForm
          referral={selectedReferral}
          empId={empId}
          onClose={() => setSelectedReferral(null)}
          onSaved={handleSaved}
        />
      )}
    </main>
  );
}