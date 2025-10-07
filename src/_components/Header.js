'use client'
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const { user, logout } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const adminEmails = ['abhishek.ganguly@tor.ai', 'admin2@gmail.com', 'admin3@gmail.com'];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="bg-[#111111] text-white px-5 py-3 flex justify-between items-center relative">
      {/* Logo */}
      <Link href="/">
        <h1 className="text-lg font-semibold tracking-wide cursor-pointer">Tor-bit</h1>
      </Link>

      {/* Desktop Menu */}
      <nav className="hidden md:flex gap-6 items-center">
        <Link href="/profile" className="text-sm font-semibold hover:underline hover:text-gray-300">
          YOUR PROFILE
        </Link>
        {(user?.role === 'REVIEWER' || user?.role === 'HR') && (
          <Link href="/review-cv" className="text-sm font-semibold hover:underline hover:text-gray-300">
            CV FOR REVIEW
          </Link>
        )}
        {user?.is_hr && (
          <Link href="/hr-evaluation" className="text-sm font-semibold hover:underline hover:text-gray-300">
            CV HR EVALUATION
          </Link>
        )}
        {adminEmails.includes(user?.email) && (
          <Link href="/admin" className="text-sm font-semibold hover:underline hover:text-gray-300">
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

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden p-2 rounded hover:bg-[#222] transition-all"
        aria-label="Toggle menu"
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="absolute top-[60px] right-0 w-48 bg-[#1c1c1c] rounded-lg shadow-xl py-3 flex flex-col items-start gap-2 z-50 border border-gray-800 md:hidden">
          <Link
            href="/profile"
            className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#2a2a2a] rounded"
            onClick={() => setMenuOpen(false)}
          >
            Your Profile
          </Link>

          {(user?.role === 'REVIEWER' || user?.role === 'HR') && (
            <Link
              href="/review-cv"
              className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#2a2a2a] rounded"
              onClick={() => setMenuOpen(false)}
            >
              CV For Review
            </Link>
          )}

          {user?.is_hr && (
            <Link
              href="/hr-evaluation"
              className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#2a2a2a] rounded"
              onClick={() => setMenuOpen(false)}
            >
              CV HR Evaluation
            </Link>
          )}

          {adminEmails.includes(user?.email) && (
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
