// pages/api/login.js
import axios from 'axios'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const apiRes = await axios.post(`${process.env.BACKEND_DOMAIN}/api/login/`, req.body, {
        withCredentials: true,
      })
      // Forward cookies from Django to browser
      const cookies = apiRes.headers['set-cookie']
      if (cookies) {
        res.setHeader('Set-Cookie', cookies)
      }

      res.status(200).json(apiRes.data)
    } catch (error) {
      res.status(error?.response?.status || 500).json(
        error?.response?.data || { error: 'Login failed' }
      )
    }
  } else {
    res.status(405).end('Method Not Allowed')
  }
}
