'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ✅ Run once on mount to check login
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/me', { withCredentials: true });
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch (err) {
        // fallback to localStorage if backend says unauthenticated
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchUser();
  }, []);
  
  

  // ✅ Add this login method
  const login = (userData) => {
    setUser(userData)
    try {
      localStorage.setItem('user', JSON.stringify(userData))
    } catch {}
  }

  const logout = async () => {
    try {
      await axios.post('/api/logout', {}, { withCredentials: true })
    } catch (err) {
      console.error('Logout failed', err)
    } finally {
      setUser(null)
      localStorage.removeItem('user')
      // ensure redirect if needed
      router.replace('/login')
    }
  }

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
