import axios from 'axios'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const apiRes = await axios.get(`${process.env.BACKEND_DOMAIN}/api/me/`, {
        headers: {
          Cookie: req.headers.cookie, // Forward cookies
        },
        withCredentials: true,
      })
      res.status(200).json(apiRes.data)
    } catch (err) {
      res.status(err?.response?.status || 500).json(err?.response?.data || { error: 'Failed to fetch user' })
    }
  } else {
    res.status(405).end('Method Not Allowed')
  }
}
