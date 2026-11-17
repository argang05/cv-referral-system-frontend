"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, BriefcaseBusiness, UserRound, X } from "lucide-react";

export default function ReferralSuccessModal({ isOpen, candidateName, jobTitle, onClose }) {
  const router = useRouter();
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = event => { if (event.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const handleTrackReferral = () => {
    onClose?.();
    router.push("/referrals");
  };
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[3px]" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="referral-success-title" className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#F6490D] via-orange-400 to-green-500" />
        <button type="button" onClick={onClose} aria-label="Close success message" className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"><X size={19} /></button>
        <div className="px-6 pb-7 pt-10 text-center sm:px-8">
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <div className="absolute inset-0 rounded-full border border-green-100" />
            <CheckCircle2 size={44} strokeWidth={1.8} className="relative text-green-600" />
          </div>
          <div className="mb-3 inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-green-700">Successfully Submitted</div>
          <h2 id="referral-success-title" className="text-2xl font-bold tracking-tight text-gray-900">Referral Submitted!</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-600">Your candidate referral has been submitted successfully and is now awaiting review.</p>
          <div className="mt-6 space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#F6490D] shadow-sm"><UserRound size={18} /></div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Candidate</p>
                <p className="break-words text-sm font-semibold text-gray-900">{candidateName || "Referred Candidate"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#F6490D] shadow-sm"><BriefcaseBusiness size={18} /></div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Job Posting</p>
                <p className="break-words text-sm font-semibold text-gray-900">{jobTitle || "Internal Job Posting"}</p>
              </div>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-gray-600">Want to follow the progress? Track your referral through the recruitment workflow in <span className="font-semibold text-gray-800">CV Referrals</span>.</p>
          <div className="mt-7 space-y-3">
            <button type="button" onClick={handleTrackReferral} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F6490D] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d63f09] focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2">
              Track Referral <ArrowRight size={17} />
            </button>
            <button type="button" onClick={onClose} className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
              Back to Job Postings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}