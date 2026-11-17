import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await axios.get(
      `${process.env.BACKEND_DOMAIN}/api/admin-config/completed-referrals/`,
      {
        params: req.query,
        headers: {
          Authorization: req.headers.authorization || '',
          Cookie: req.headers.cookie || ''
        }
      }
    )
    return res.status(200).json(response.data)
  } catch (error) {
    console.error('Completed referrals proxy error:', error.response?.data || error.message)
    return res.status(error.response?.status || 500).json(
      error.response?.data || { error: 'Failed to fetch completed referrals.' }
    )
  }
}