// pages/api/logout.js
import axios from 'axios'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const apiRes = await axios.post(`${process.env.BACKEND_DOMAIN}/api/logout/`, {}, {
        headers: {
          Cookie: req.headers.cookie || '',
        },
        withCredentials: true,
      })

      const cookies = apiRes.headers['set-cookie']
      if (cookies) {
        res.setHeader('Set-Cookie', cookies)
      }

      res.status(200).json({ message: 'Logged out' })
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' })
    }
  } else {
    res.status(405).end('Method Not Allowed')
  }
}
