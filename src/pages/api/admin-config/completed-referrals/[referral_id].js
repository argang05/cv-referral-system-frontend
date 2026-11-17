import axios from 'axios'

export default async function handler(req, res) {
  const { referral_id } = req.query

  if (!['GET', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', ['GET', 'DELETE'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const backendUrl = `${process.env.BACKEND_DOMAIN}/api/admin-config/completed-referrals/${referral_id}/`
  const headers = {
    Authorization: req.headers.authorization || '',
    Cookie: req.headers.cookie || ''
  }

  try {
    const response = req.method === 'GET'
      ? await axios.get(backendUrl, { headers })
      : await axios.delete(backendUrl, { headers, data: req.body })

    return res.status(response.status).json(response.data)
  } catch (error) {
    console.error('Completed referral detail proxy error:', error.response?.data || error.message)
    return res.status(error.response?.status || 500).json(
      error.response?.data || { error: 'Completed referral operation failed.' }
    )
  }
}