'use client'

import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-orange-600" size={40} />
      </div>
    );
  }

  // Fallback if user is not logged in
  const userName = user?.name || 'User';

  const modules = [
    {
      title: "CV Referral System",
      description: "Manage employee CV referrals, track candidate applications, and streamline the recruitment workflow.",
      link: "/referrals",
    },
    {
      title: "Internal Job Posting System (Work In Progress)",
      description: "Post internal job openings and allow employees to apply for available positions within the organization.",
      link: "/job-vacancies",
    },
    {
      title: "Internal Job Rotation System (Work In Progress)",
      description: "Facilitate structured internal job rotations for skill development and career growth of employees.",
      link: "/internal-job-rotation",
    },
  ];

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome, {userName}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod, idx) => (
          <Link key={idx} href={mod.link}>
            <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 p-6 flex flex-col justify-between cursor-pointer h-64">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{mod.title}</h2>
                <p className="text-gray-600 text-sm">{mod.description}</p>
              </div>
              <div className="mt-4 text-orange-600 font-medium text-sm underline hover:text-orange-700">
                Go to Module →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
