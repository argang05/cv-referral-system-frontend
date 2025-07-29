// pages/api/register.js
import axios from 'axios'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const apiRes = await axios.post(`${process.env.BACKEND_DOMAIN}/api/register/`, req.body)
      res.status(201).json(apiRes.data)
    } catch (err) {
      res.status(err.response?.status || 500).json(err.response?.data || { error: 'Registration failed' })
    }
  } else {
    res.status(405).end('Method Not Allowed')
  }
}
