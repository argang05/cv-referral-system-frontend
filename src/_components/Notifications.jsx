"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Bell, X, BriefcaseBusiness, Loader2, UserRound, CheckCircle2, XCircle, RefreshCw, ClipboardList, CheckCheck } from "lucide-react";

const notificationIcons = {
  NEW_JOB: BriefcaseBusiness,
  IJR_NOMINATED: UserRound,
  IJR_APPROVED: CheckCircle2,
  IJR_REJECTED: XCircle,
  IJR_IMPLEMENTED: RefreshCw,
  REFERRAL_UPDATED: ClipboardList,
  REVIEW_ASSIGNED: ClipboardList,
  HR_EVALUATION_UPDATED: ClipboardList
};

export default function Notifications() {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);
  const requestRef = useRef(false);
  const mountedRef = useRef(false);
  const pendingRefreshRef = useRef(false);
  const mutationRef = useRef(false);
  const versionRef = useRef(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openingId, setOpeningId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!mountedRef.current) return;
    if (requestRef.current || mutationRef.current) {
      pendingRefreshRef.current = true;
      return;
    }

    requestRef.current = true;
    const version = versionRef.current;

    try {
      if (!silent) setLoading(true);
      const res = await axios.get("/api/notifications");
      if (!mountedRef.current || version !== versionRef.current) return;
      setNotifications(Array.isArray(res.data?.results) ? res.data.results : []);
      setUnreadCount(res.data?.unread_count ?? 0);
    } catch (error) {
      console.error("Notification fetch failed:", error.response?.data || error.message);
    } finally {
      requestRef.current = false;
      if (mountedRef.current) {
        if (!silent) setLoading(false);
        if (pendingRefreshRef.current && !mutationRef.current) {
          pendingRefreshRef.current = false;
          setTimeout(() => window.dispatchEvent(new Event("notifications:refresh")), 0);
        }
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchNotifications(true);
    }, 7000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchNotifications(true);
    };

    const handleFocus = () => fetchNotifications(true);
    const handleRefresh = () => fetchNotifications(true);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("notifications:refresh", handleRefresh);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("notifications:refresh", handleRefresh);
    };
  }, [fetchNotifications]);

  useEffect(() => { setOpen(false); }, [pathname]);

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

  const handleMarkAllRead = async () => {
    if (markingAll || openingId || unreadCount === 0) return;
    setMarkingAll(true);
    mutationRef.current = true;
    versionRef.current++;

    try {
      await axios.post("/api/notifications/mark-all-read");
      if (!mountedRef.current) return;
      setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to mark notifications as read.");
    } finally {
      mutationRef.current = false;
      if (mountedRef.current) {
        setMarkingAll(false);
        pendingRefreshRef.current = false;
        fetchNotifications(true);
      }
    }
  };

  const handleNotificationClick = async notification => {
    if (openingId || markingAll) return;
    setOpeningId(notification.id);
    mutationRef.current = true;
    versionRef.current++;

    try {
      if (!notification.is_read) {
        await axios.post(`/api/notifications/${notification.id}/read`);
        if (mountedRef.current) {
          setNotifications(prev => prev.map(item => item.id === notification.id ? { ...item, is_read: true } : item));
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }

      setOpen(false);
      const jobId = notification.job_posting?.job_id;
      const targetUrl = notification.target_url || (jobId ? `/job-vacancies?job_id=${encodeURIComponent(jobId)}` : "");
      if (targetUrl && targetUrl.startsWith("/") && !targetUrl.startsWith("//") && !targetUrl.includes("\\")) router.push(targetUrl);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to open notification.");
    } finally {
      mutationRef.current = false;
      if (mountedRef.current) {
        setOpeningId(null);
        pendingRefreshRef.current = false;
        fetchNotifications(true);
      }
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button type="button" onClick={handleToggle} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={open} aria-haspopup="true" className="relative rounded-xl border border-gray-200 bg-white p-2.5 text-gray-700 transition hover:bg-orange-50">
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
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-[#F6490D]">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="text-gray-500 hover:text-gray-900">
              <X size={18} />
            </button>
          </div>

          {unreadCount > 0 && (
            <div className="flex justify-end border-b bg-gray-50 px-4 py-2">
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll || Boolean(openingId)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F6490D] transition hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {markingAll ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
                {markingAll ? "Marking..." : "Mark All as Read"}
              </button>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-gray-500">
                <Loader2 size={17} className="animate-spin" /> Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500">No notifications yet.</p>
            ) : (
              notifications.map(notification => {
                const Icon = notificationIcons[notification.notification_type] || Bell;
                return (
                  <button
                    key={notification.id}
                    type="button"
                    disabled={Boolean(openingId) || markingAll}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full border-b px-4 py-3 text-left transition hover:bg-orange-50 disabled:cursor-wait ${notification.is_read ? "bg-white" : "bg-orange-50/60"}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon size={18} className="mt-0.5 shrink-0 text-[#F6490D]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                        <p className="mt-1 text-xs leading-5 text-gray-600">{notification.message}</p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {notification.created_at ? new Date(notification.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                        </p>
                      </div>
                      {openingId === notification.id ? (
                        <Loader2 size={15} className="mt-1 shrink-0 animate-spin text-[#F6490D]" />
                      ) : !notification.is_read ? (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#F6490D]" />
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t bg-gray-50 px-4 py-2 text-center text-xs text-gray-500">
            Showing the latest {notifications.length} notifications
          </div>
        </div>
      )}
    </div>
  );
}