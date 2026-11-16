'use client';

import Link from 'next/link';
import axios from 'axios';

import { useUser } from '@/context/UserContext';
import { useEffect, useState } from 'react';

import { Menu, X } from 'lucide-react';

export default function Header() {
  const { user, logout } = useUser();

  const [menuOpen, setMenuOpen] = useState(false);

  // ==========================================================
  // NEW: Track whether the logged-in employee is an SBU reviewer
  // ==========================================================

  const [isSbuReviewer, setIsSbuReviewer] = useState(false);

  const adminEmails = [
    'abhishek.ganguly@tor.ai',
    'admin2@gmail.com',
    'admin3@gmail.com',
  ];

  // ==========================================================
  // NEW: Check reviewer membership from Department configurations
  // ==========================================================

  useEffect(() => {
    // Reset reviewer status when the user changes or logs out.
    setIsSbuReviewer(false);

    // No logged-in user email means we cannot check membership.
    if (!user?.email) {
      return;
    }

    let cancelled = false;

    const checkReviewerAccess = async () => {
      try {
        // Fetch the same department configurations used by
        // the referral submission form.
        const response = await axios.get('/api/departments/');

        const departments = Array.isArray(response.data)
          ? response.data
          : [];

        // Normalize the logged-in employee's email.
        const loggedInEmail = user.email.trim().toLowerCase();

        // Check whether the employee appears as a reviewer
        // in at least one department.
        const reviewerFound = departments.some((department) => {
          const reviewers = Array.isArray(department.reviewers)
            ? department.reviewers
            : [];

          return reviewers.some((reviewer) => {
            const reviewerEmail =
              typeof reviewer?.email === 'string'
                ? reviewer.email.trim().toLowerCase()
                : '';

            return reviewerEmail === loggedInEmail;
          });
        });

        // Avoid updating state after cleanup.
        if (!cancelled) {
          setIsSbuReviewer(reviewerFound);
        }
      } catch (error) {
        console.error(
          'Failed to check SBU reviewer access:',
          error.response?.data || error.message
        );

        if (!cancelled) {
          setIsSbuReviewer(false);
        }
      }
    };

    checkReviewerAccess();

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  // ==========================================================
  // NEW: Combined reviewer access condition
  // ==========================================================

  // Preserve existing role-based visibility.
  const hasReviewerRole =
    user?.role === 'REVIEWER' ||
    user?.role === 'HR';

  // Also recognize employees assigned through Department.reviewers.
  const canReviewCV = hasReviewerRole || isSbuReviewer;

  // ==========================================================
  // Existing HR and admin conditions
  // ==========================================================

  const canEvaluateHR = Boolean(user?.is_hr);

  const isAdmin = adminEmails.some(
    (email) =>
      email.toLowerCase() ===
      (user?.email || '').trim().toLowerCase()
  );

  // ==========================================================
  // Existing logout functionality
  // ==========================================================

  const handleLogout = () => {
    logout();

    window.location.href = '/login';
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <header className="bg-[#111111] text-white px-5 py-3 flex justify-between items-center relative">

      {/* =====================================================
          Logo
      ===================================================== */}

      <Link href="/">
        <h1 className="text-lg font-semibold tracking-wide cursor-pointer">
          Tor-bit
        </h1>
      </Link>

      {/* =====================================================
          Desktop Menu
      ===================================================== */}

      <nav className="hidden md:flex gap-6 items-center">

        <Link
          href="/profile"
          className="text-sm font-semibold hover:underline hover:text-gray-300"
        >
          YOUR PROFILE
        </Link>

        <Link
          href="/referrals"
          className="text-sm font-semibold hover:underline hover:text-gray-300"
        >
          REFER A CV
        </Link>

        {/* NEW: Supports both role-based and assigned reviewers */}
        {canReviewCV && (
          <Link
            href="/review-cv"
            className="text-sm font-semibold hover:underline hover:text-gray-300"
          >
            CV FOR REVIEW
          </Link>
        )}

        {/* Existing HR evaluation access */}
        {canEvaluateHR && (
          <Link
            href="/hr-evaluation"
            className="text-sm font-semibold hover:underline hover:text-gray-300"
          >
            CV HR EVALUATION
          </Link>
        )}

        {/* Existing admin access */}
        {isAdmin && (
          <Link
            href="/admin"
            className="text-sm font-semibold hover:underline hover:text-gray-300"
          >
            ADMIN PANEL
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="bg-[#F6490D] text-white px-3 py-1.5 rounded hover:opacity-90 font-semibold text-[12px]"
        >
          LOG-OUT
        </button>

      </nav>

      {/* =====================================================
          Mobile Menu Button
      ===================================================== */}

      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden p-2 rounded hover:bg-[#222] transition-all"
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
      >
        {menuOpen ? (
          <X size={22} />
        ) : (
          <Menu size={22} />
        )}
      </button>

      {/* =====================================================
          Mobile Dropdown Menu
      ===================================================== */}

      {menuOpen && (
        <div className="absolute top-[60px] right-0 w-48 bg-[#1c1c1c] rounded-lg shadow-xl py-3 flex flex-col items-start gap-2 z-50 border border-gray-800 md:hidden">

          <Link
            href="/profile"
            className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#2a2a2a] rounded"
            onClick={() => setMenuOpen(false)}
          >
            Your Profile
          </Link>

          <Link
            href="/referrals"
            className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#2a2a2a] rounded"
            onClick={() => setMenuOpen(false)}
          >
            Refer A CV
          </Link>

          {/* NEW: Same reviewer visibility as desktop */}
          {canReviewCV && (
            <Link
              href="/review-cv"
              className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#2a2a2a] rounded"
              onClick={() => setMenuOpen(false)}
            >
              CV For Review
            </Link>
          )}

          {/* Existing HR evaluation access */}
          {canEvaluateHR && (
            <Link
              href="/hr-evaluation"
              className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#2a2a2a] rounded"
              onClick={() => setMenuOpen(false)}
            >
              CV HR Evaluation
            </Link>
          )}

          {/* Existing admin access */}
          {isAdmin && (
            <Link
              href="/admin"
              className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#2a2a2a] rounded"
              onClick={() => setMenuOpen(false)}
            >
              Admin Panel
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full text-left bg-[#F6490D] text-white px-4 py-2 rounded font-semibold mt-2"
          >
            Log-out
          </button>

        </div>
      )}

    </header>
  );
}