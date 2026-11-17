'use client';

import Link from 'next/link';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const { user, logout } = useUser();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSbuReviewer, setIsSbuReviewer] = useState(false);

  const adminEmails = [
    'abhishek.ganguly@tor.ai',
    'admin2@gmail.com',
    'admin3@gmail.com'
  ];

  // Check SBU reviewer membership from department configurations.
  useEffect(() => {
    setIsSbuReviewer(false);
    if (!user?.email) return;

    let cancelled = false;

    const checkReviewerAccess = async () => {
      try {
        const response = await axios.get('/api/departments/');
        const departments = Array.isArray(response.data) ? response.data : [];
        const loggedInEmail = user.email.trim().toLowerCase();

        const reviewerFound = departments.some((department) => {
          const reviewers = Array.isArray(department.reviewers) ? department.reviewers : [];
          return reviewers.some((reviewer) => {
            const reviewerEmail = typeof reviewer?.email === 'string'
              ? reviewer.email.trim().toLowerCase()
              : '';
            return reviewerEmail === loggedInEmail;
          });
        });

        if (!cancelled) setIsSbuReviewer(reviewerFound);
      } catch (error) {
        console.error(
          'Failed to check SBU reviewer access:',
          error.response?.data || error.message
        );
        if (!cancelled) setIsSbuReviewer(false);
      }
    };

    checkReviewerAccess();

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Existing reviewer access logic.
  const hasReviewerRole = user?.role === 'REVIEWER' || user?.role === 'HR';
  const canReviewCV = hasReviewerRole || isSbuReviewer;

  // HR access: shared by Academic Details and HR Evaluation.
  const canEvaluateHR = Boolean(user?.is_hr);
  const canManageAcademicDetails = canEvaluateHR;

  // Existing administrator access.
  const isAdmin = adminEmails.some(
    (email) => email.toLowerCase() === (user?.email || '').trim().toLowerCase()
  );

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    window.location.href = '/login';
  };

  const desktopLinkClass = 'text-sm font-semibold hover:underline hover:text-gray-300';
  const mobileLinkClass = 'w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#2a2a2a] rounded';

  return (
    <header className="bg-[#111111] text-white px-5 py-3 flex justify-between items-center relative">
      {/* Logo */}
      <Link href="/">
        <h1 className="text-lg font-semibold tracking-wide cursor-pointer">
          Tor-bit
        </h1>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-6 items-center">
        <Link href="/profile" className={desktopLinkClass}>
          YOUR PROFILE
        </Link>

        <Link href="/referrals" className={desktopLinkClass}>
          REFER A CV
        </Link>

        {/* SBU reviewer access */}
        {canReviewCV && (
          <Link href="/review-cv" className={desktopLinkClass}>
            CV FOR REVIEW
          </Link>
        )}

        {/* NEW: HR-only academic details collection */}
        {canManageAcademicDetails && (
          <Link href="/academic-details" className={desktopLinkClass}>
            ACADEMIC DETAILS
          </Link>
        )}

        {/* Existing HR evaluation */}
        {canEvaluateHR && (
          <Link href="/hr-evaluation" className={desktopLinkClass}>
            CV HR EVALUATION
          </Link>
        )}

        {/* Existing admin panel */}
        {isAdmin && (
          <Link href="/admin" className={desktopLinkClass}>
            ADMIN PANEL
          </Link>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="bg-[#F6490D] text-white px-3 py-1.5 rounded hover:opacity-90 font-semibold text-[12px]"
        >
          LOG-OUT
        </button>
      </nav>

      {/* Mobile Menu Toggle */}
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className="md:hidden p-2 rounded hover:bg-[#222] transition-all"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Navigation */}
      {menuOpen && (
        <nav
          id="mobile-navigation"
          className="absolute top-full right-0 w-56 bg-[#1c1c1c] rounded-lg shadow-xl py-3 flex flex-col items-start gap-2 z-50 border border-gray-800 md:hidden"
        >
          <Link
            href="/profile"
            className={mobileLinkClass}
            onClick={() => setMenuOpen(false)}
          >
            Your Profile
          </Link>

          <Link
            href="/referrals"
            className={mobileLinkClass}
            onClick={() => setMenuOpen(false)}
          >
            Refer A CV
          </Link>

          {/* SBU reviewer access */}
          {canReviewCV && (
            <Link
              href="/review-cv"
              className={mobileLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              CV For Review
            </Link>
          )}

          {/* NEW: HR-only academic details collection */}
          {canManageAcademicDetails && (
            <Link
              href="/academic-details"
              className={mobileLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Academic Details
            </Link>
          )}

          {/* Existing HR evaluation */}
          {canEvaluateHR && (
            <Link
              href="/hr-evaluation"
              className={mobileLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              CV HR Evaluation
            </Link>
          )}

          {/* Existing admin panel */}
          {isAdmin && (
            <Link
              href="/admin"
              className={mobileLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Admin Panel
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left bg-[#F6490D] text-white px-4 py-2 rounded font-semibold mt-2"
          >
            Log-out
          </button>
        </nav>
      )}
    </header>
  );
}