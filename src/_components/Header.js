// components/Header.js
'use client'
import Link from 'next/link';
import { useUser } from '@/context/UserContext';

export default function Header() {
  const { user, logout } = useUser();
  console.log(user)

  const adminEmails = ['abhishek.ganguly@tor.ai', 'admin2@gmail.com', 'admin3@gmail.com']

  return (
    <header className="bg-[#111111] text-white px-4 py-3 flex justify-between items-center">
      <Link href="/"><h1 className="text-lg font-semibold">{"CV Referral System".toUpperCase()}</h1></Link>
      <nav className="flex gap-4 items-center">
        {/* <Link href="/">Home</Link> */}
        <Link href="/profile"><h3 className="text-[13px] font-semibold hover:underline hover:text-gray-300">{"Your Profile".toUpperCase()}</h3></Link>
        {(user?.role === 'REVIEWER' || user?.role === 'HR') && (
          <Link href="/review-cv"><h3 className="text-[13px] font-semibold hover:underline hover:text-gray-300">{"CV For Review".toUpperCase()}</h3></Link>
        )}
        {user?.is_hr === true && <Link href="/hr-evaluation"><h3 className="text-[13px] font-semibold hover:underline hover:text-gray-300">
          {"CV HR Evaluation".toUpperCase()}
        </h3></Link>}
        {adminEmails.includes(user?.email) ? <Link href="/admin"><h3 className="text-[13px] font-semibold hover:underline hover:text-gray-300">
          {"Admin Panel".toUpperCase()}
        </h3></Link> : null} {/* Future toggle */}
        <button
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          className="bg-[#F6490D] text-white px-3 py-1.5 cursor-pointer rounded hover:opacity-90 font-semibold text-[12px]"
        >
          {"Log-out".toUpperCase()}
        </button>
      </nav>
    </header>
  );
}