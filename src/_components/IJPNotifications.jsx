"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Bell, X, BriefcaseBusiness, Loader2 } from "lucide-react";

export default function IJPNotifications() {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);
  const requestRef = useRef(false);
  const mountedRef = useRef(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openingId, setOpeningId] = useState(null);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (requestRef.current) return;
    requestRef.current = true;
    try {
      if (!silent) setLoading(true);
      const res = await axios.get("/api/job-vacancy/notifications");
      if (!mountedRef.current) return;
      setNotifications(Array.isArray(res.data?.results) ? res.data.results : []);
      setUnreadCount(res.data?.unread_count ?? 0);
    } catch (error) {
      console.error("Notification fetch failed:", error.response?.data || error.message);
    } finally {
      requestRef.current = false;
      if (mountedRef.current && !silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchNotifications(true);
    }, 60000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchNotifications(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setOpen(false);
    };
    const handleEscape = event => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleToggle = () => {
    if (!open) fetchNotifications();
    setOpen(prev => !prev);
  };

  const handleNotificationClick = async notification => {
    if (openingId) return;
    setOpeningId(notification.id);
    try {
      if (!notification.is_read) {
        await axios.post(`/api/job-vacancy/notifications/${notification.id}/read`);
        setNotifications(prev => prev.map(item => item.id === notification.id ? { ...item, is_read: true } : item));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setOpen(false);
      const jobId = notification.job_posting?.job_id;
      if (jobId) router.push(`/job-vacancies?job_id=${encodeURIComponent(jobId)}`);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to open notification.");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button type="button" onClick={handleToggle} aria-label={`Job notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={open} aria-haspopup="true" className="relative rounded-xl border border-gray-200 bg-white p-2.5 text-gray-700 transition hover:bg-orange-50">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F6490D] px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(90vw,380px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Job Notifications</h3>
              {unreadCount > 0 && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-[#F6490D]">{unreadCount} new</span>}
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="text-gray-500 hover:text-gray-900"><X size={18} /></button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-gray-500"><Loader2 size={17} className="animate-spin" /> Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500">No job notifications yet.</p>
            ) : (
              notifications.map(notification => (
                <button key={notification.id} type="button" disabled={Boolean(openingId)} onClick={() => handleNotificationClick(notification)} className={`w-full border-b px-4 py-3 text-left transition hover:bg-orange-50 disabled:cursor-wait ${notification.is_read ? "bg-white" : "bg-orange-50/60"}`}>
                  <div className="flex items-start gap-3">
                    <BriefcaseBusiness size={18} className="mt-0.5 shrink-0 text-[#F6490D]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-600">{notification.message}</p>
                      <p className="mt-1 text-[11px] text-gray-400">{notification.created_at ? new Date(notification.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}</p>
                    </div>
                    {openingId === notification.id ? <Loader2 size={15} className="mt-1 shrink-0 animate-spin text-[#F6490D]" /> : !notification.is_read ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#F6490D]" /> : null}
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="border-t bg-gray-50 px-4 py-2 text-center text-xs text-gray-500">Showing the latest {notifications.length} notifications</div>
        </div>
      )}
    </div>
  );
}