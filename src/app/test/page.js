'use client'
import { useEffect, useState } from 'react'

export default function TestPage() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('http://localhost:8000/api/hello/')
      .then(res => res.json())
      .then(data => setMessage(data.message))
  }, [])

  return <div>Message from Django: {message}</div>
}