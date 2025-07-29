'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ✅ Run once on mount to check login
  useEffect(() => {
      const stored = localStorage.getItem('user')
  if (stored) {
    setUser(JSON.parse(stored))
    setLoading(false)
    return
  }
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/me', { withCredentials: true })
        setUser(res.data)
      } catch (err) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  // ✅ Add this login method
  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))  // Optional: store in localStorage
  }

  const logout = async () => {
    try {
      await axios.post('/api/logout', {}, { withCredentials: true })
    } catch (err) {
      console.error('Logout failed', err)
    }
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
