'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    emp_id: '',
    name: '',
    email: '',
    password_og: '',
    role: 'EMPLOYEE'
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async () => {
    setError('')
    setSuccess('')
    try {
      const res = await axios.post('/api/register', formData)
      setSuccess('Registration successful!')
      router.push('/login')
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-lg space-y-4">
      <h2 className="text-2xl font-bold">Register</h2>

      <div>
        <Label className="mb-2" htmlFor="emp_id">Employee ID</Label>
        <Input id="emp_id" name="emp_id" value={formData.emp_id} onChange={handleChange} />
      </div>

      <div>
        <Label className="mb-2" htmlFor="name">Full Name</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} />
      </div>

      <div>
        <Label className="mb-2" htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
      </div>

      <div>
        <Label className="mb-2" htmlFor="password_og">Password</Label>
        <Input id="password_og" name="password_og" type="password" value={formData.password_og} onChange={handleChange} />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      <Button className="w-full" onClick={handleRegister}>
        Register
      </Button>
    </div>
  )
}
