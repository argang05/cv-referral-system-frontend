"use client";
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const sessionVersion = useRef(0);

  const clearUser = useCallback(() => {
    setUser(null);
    try { localStorage.removeItem("user"); }
    catch (error) { console.error("Failed to clear cached user:", error); }
  }, []);

  useEffect(() => {
    let active = true;
    const version = ++sessionVersion.current;
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/me", { withCredentials: true });
        if (!active || version !== sessionVersion.current) return;
        setUser(res.data);
        try { localStorage.setItem("user", JSON.stringify(res.data)); }
        catch (error) { console.error("Failed to cache user:", error); }
      } catch (error) {
        if (!active || version !== sessionVersion.current) return;
        clearUser();
        const status = error.response?.status;
        if (status !== 401) console.error("Failed to restore authenticated session:", error.response?.data || error.message);
      } finally {
        if (active && version === sessionVersion.current) setLoading(false);
      }
    };
    fetchUser();
    return () => { active = false; };
  }, [clearUser]);

  const login = useCallback(userData => {
    sessionVersion.current += 1;
    setUser(userData);
    setLoading(false);
    try { localStorage.setItem("user", JSON.stringify(userData)); }
    catch (error) { console.error("Failed to cache user information:", error); }
  }, []);

  const logout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await axios.post("/api/logout", {}, { withCredentials: true });
      sessionVersion.current += 1;
      clearUser();
      setLoading(false);
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message);
      throw error;
    } finally {
      setLoggingOut(false);
    }
  }, [router, clearUser, loggingOut]);

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, loading, loggingOut }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used inside UserProvider.");
  return context;
};