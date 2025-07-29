'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import axios from 'axios'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [empId, setEmpId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { login } = useUser()

const handleLogin = async () => {
  setLoading(true)
  setError('')
  setSuccess(false)
  try {
    const res = await axios.post('/api/login', { emp_id: empId, password }, {
      withCredentials: true
    })
    login(res.data) // ✅ store in context + localStorage
    setSuccess(true)
    router.push('/')
  } catch (err) {
    setError(err?.response?.data?.error || 'Login failed')
  } finally {
    setLoading(false)
  }
}

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg shadow-md bg-white">
      <h2 className="text-2xl font-bold mb-6 text-black">Employee Login</h2>
      <div className="space-y-4">
        <div>
          <Label className="mb-2" htmlFor="empId">Employee ID</Label>
          <Input id="empId" value={empId} onChange={e => setEmpId(e.target.value)} autoComplete='off' />
        </div>
        <div>
          <Label className="mb-2" htmlFor="password">Password</Label>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              autoComplete='off' 
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Login Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertTitle>Login Success</AlertTitle>
            <AlertDescription>You have logged in successfully.</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleLogin}
          className="w-full bg-[#F6490D] text-white hover:bg-[#d53c07]"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Login'}
        </Button>
      </div>
    </div>
  )
}