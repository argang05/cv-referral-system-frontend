"use client";
import Link from "next/link";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, UserRound, LogOut, BriefcaseBusiness, ClipboardCheck, GraduationCap, ShieldCheck, LayoutDashboard, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Notifications from "@/_components/Notifications";

export default function Header() {
  const { user, logout, loggingOut } = useUser();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isSbuReviewer, setIsSbuReviewer] = useState(false);
  const headerRef = useRef(null);
  const adminEmails = ["abhishek.ganguly@tor.ai", "admin2@gmail.com", "admin3@gmail.com"];
  const isAdmin = adminEmails.some(email => email.toLowerCase() === (user?.email || "").trim().toLowerCase());

  useEffect(() => {
    setIsSbuReviewer(false);
    if (!user?.email) return;
    let cancelled = false;
    const checkReviewerAccess = async () => {
      try {
        const response = await axios.get("/api/departments/");
        const departments = Array.isArray(response.data) ? response.data : response.data?.results || [];
        const email = user.email.trim().toLowerCase();
        const found = departments.some(department => (Array.isArray(department.reviewers) ? department.reviewers : []).some(reviewer => typeof reviewer?.email === "string" && reviewer.email.trim().toLowerCase() === email));
        if (!cancelled) setIsSbuReviewer(found);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to check SBU reviewer access:", error.response?.data || error.message);
          setIsSbuReviewer(false);
        }
      }
    };
    checkReviewerAccess();
    return () => { cancelled = true; };
  }, [user?.email]);

  useEffect(() => {
    setMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  useEffect(() => {
    const handleOutsideClick = event => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setActiveDropdown(null);
        setMenuOpen(false);
      }
    };
    const handleEscape = event => {
      if (event.key === "Escape") {
        setActiveDropdown(null);
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const canReviewCV = user?.role === "REVIEWER" || user?.role === "HR" || isSbuReviewer;
  const canEvaluateHR = Boolean(user?.is_hr);
  const canManageAcademicDetails = canEvaluateHR;
  const recruitmentLinks = [
    ...(canReviewCV ? [{ label: "CV for Review", href: "/review-cv", icon: ClipboardCheck, description: "Review referred candidates" }] : []),
    ...(canManageAcademicDetails ? [{ label: "Academic Details", href: "/academic-details", icon: GraduationCap, description: "Manage candidate academics" }] : []),
    ...(canEvaluateHR ? [{ label: "CV HR Evaluation", href: "/hr-evaluation", icon: CheckCircle2, description: "Evaluate candidate profiles" }] : [])
  ];

  const isActive = href => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const recruitmentActive = recruitmentLinks.some(link => isActive(link.href));
  const toggleDropdown = name => setActiveDropdown(current => current === name ? null : name);

  const handleLogout = async () => {
    setMenuOpen(false);
    setActiveDropdown(null);
    try {
      await logout();
    } catch (error) {
      toast.error(error.response?.data?.error || "Logout failed. Please try again.");
    }
  };

  const navLinkClass = href => `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${isActive(href) ? "bg-[#F6490D]/15 text-[#FF7143]" : "text-gray-300 hover:bg-white/10 hover:text-white"}`;
  const dropdownButtonClass = active => `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${active ? "bg-[#F6490D]/15 text-[#FF7143]" : "text-gray-300 hover:bg-white/10 hover:text-white"}`;
  const mobileLinkClass = href => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive(href) ? "bg-[#F6490D]/15 text-[#FF7143]" : "text-gray-300 hover:bg-white/10 hover:text-white"}`;
  const initials = (user?.name || user?.email || "U").trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("");

  return (
    <header ref={headerRef} className="relative z-40 border-b border-white/10 bg-[#111111] text-white">
      <div className="mx-auto flex min-h-[70px] w-full items-center justify-between gap-4 px-5 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6490D] text-lg font-bold text-white shadow-sm">T</div>
          <span className="text-lg font-bold tracking-tight text-white">Tor<span className="text-[#FF7143]">-bit</span></span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          <Link href="/" className={navLinkClass("/")} aria-current={isActive("/") ? "page" : undefined}><LayoutDashboard size={16} /> Dashboard</Link>
          <Link href="/referrals" className={navLinkClass("/referrals")} aria-current={isActive("/referrals") ? "page" : undefined}><Users size={16} /> CV Referrals</Link>
          <Link href="/job-vacancies" className={navLinkClass("/job-vacancies")} aria-current={isActive("/job-vacancies") ? "page" : undefined}><BriefcaseBusiness size={16} /> Job Postings</Link>
          {recruitmentLinks.length > 0 && (
            <div className="relative">
              <button type="button" onClick={() => toggleDropdown("recruitment")} aria-expanded={activeDropdown === "recruitment"} aria-haspopup="menu" className={dropdownButtonClass(recruitmentActive || activeDropdown === "recruitment")}>
                <ClipboardCheck size={16} /> Recruitment
                <ChevronDown size={15} className={`transition-transform ${activeDropdown === "recruitment" ? "rotate-180" : ""}`} />
              </button>
              {activeDropdown === "recruitment" && (
                <div role="menu" className="absolute left-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-xl border border-gray-100 bg-white p-2 shadow-2xl">
                  <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Recruitment Workflow</p>
                  {recruitmentLinks.map(({ label, href, icon: Icon, description }) => (
                    <Link key={href} href={href} role="menuitem" onClick={() => setActiveDropdown(null)} className={`flex items-start gap-3 rounded-lg px-3 py-3 transition-colors ${isActive(href) ? "bg-orange-50" : "hover:bg-gray-50"}`}>
                      <div className={`mt-0.5 rounded-lg p-2 ${isActive(href) ? "bg-orange-100 text-[#F6490D]" : "bg-gray-100 text-gray-600"}`}><Icon size={17} /></div>
                      <div>
                        <p className={`text-sm font-semibold ${isActive(href) ? "text-[#F6490D]" : "text-gray-900"}`}>{label}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          {isAdmin && <Link href="/admin" className={navLinkClass("/admin")} aria-current={isActive("/admin") ? "page" : undefined}><ShieldCheck size={16} /> Admin Panel</Link>}
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user && <Notifications />}
          {user && (
            <div className="relative hidden lg:block">
              <button type="button" onClick={() => toggleDropdown("profile")} aria-expanded={activeDropdown === "profile"} aria-haspopup="menu" className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors ${activeDropdown === "profile" ? "bg-white/10" : "hover:bg-white/10"}`}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6490D] text-xs font-bold text-white">{initials || "U"}</div>
                <ChevronDown size={15} className={`text-gray-400 transition-transform ${activeDropdown === "profile" ? "rotate-180" : ""}`} />
              </button>
              {activeDropdown === "profile" && (
                <div role="menu" className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white p-2 shadow-2xl">
                  <div className="border-b border-gray-100 px-3 py-3">
                    <p className="truncate text-sm font-semibold text-gray-900">{user.name || "Employee"}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Link href="/profile" role="menuitem" onClick={() => setActiveDropdown(null)} className={`mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive("/profile") ? "bg-orange-50 text-[#F6490D]" : "text-gray-700 hover:bg-gray-50"}`}><UserRound size={17} /> Your Profile</Link>
                  <button type="button" role="menuitem" onClick={handleLogout} disabled={loggingOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                    <LogOut size={17} /> {loggingOut ? "Logging out..." : "Log Out"}
                  </button>
                </div>
              )}
            </div>
          )}
          <button type="button" onClick={() => setMenuOpen(prev => !prev)} className="rounded-lg p-2 text-gray-200 transition hover:bg-white/10 lg:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav id="mobile-navigation" className="absolute left-0 right-0 top-full z-50 max-h-[calc(100vh-70px)] overflow-y-auto border-t border-white/10 bg-[#171717] px-4 py-4 shadow-2xl lg:hidden" aria-label="Mobile navigation">
          {user && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F6490D] text-sm font-bold">{initials || "U"}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user.name || "Employee"}</p>
                <p className="truncate text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Link href="/" className={mobileLinkClass("/")} onClick={() => setMenuOpen(false)}><LayoutDashboard size={18} /> Dashboard</Link>
            <Link href="/referrals" className={mobileLinkClass("/referrals")} onClick={() => setMenuOpen(false)}><Users size={18} /> CV Referrals</Link>
            <Link href="/job-vacancies" className={mobileLinkClass("/job-vacancies")} onClick={() => setMenuOpen(false)}><BriefcaseBusiness size={18} /> Job Postings</Link>
            <Link href="/profile" className={mobileLinkClass("/profile")} onClick={() => setMenuOpen(false)}><UserRound size={18} /> Your Profile</Link>
          </div>
          {recruitmentLinks.length > 0 && (
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500">Recruitment</p>
              <div className="space-y-1">
                {recruitmentLinks.map(({ label, href, icon: Icon }) => (
                  <Link key={href} href={href} className={mobileLinkClass(href)} onClick={() => setMenuOpen(false)}><Icon size={18} /> {label}</Link>
                ))}
              </div>
            </div>
          )}
          {isAdmin && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <Link href="/admin" className={mobileLinkClass("/admin")} onClick={() => setMenuOpen(false)}><ShieldCheck size={18} /> Admin Panel</Link>
            </div>
          )}
          {user && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <button type="button" onClick={handleLogout} disabled={loggingOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50">
                <LogOut size={18} /> {loggingOut ? "Logging out..." : "Log Out"}
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}