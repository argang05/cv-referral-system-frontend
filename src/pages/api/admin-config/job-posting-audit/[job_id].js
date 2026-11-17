import axios from 'axios'

export default async function handler(req, res) {
  if (!['GET', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', ['GET', 'DELETE'])
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const { job_id } = req.query
  if (!job_id || Array.isArray(job_id)) return res.status(400).json({ error: 'A valid job posting ID is required.' })

  try {
    const url = `${process.env.BACKEND_DOMAIN}/api/admin-config/job-posting-audit/${encodeURIComponent(job_id)}/`
    const config = { headers: { Cookie: req.headers.cookie || '' }, timeout: 15000 }
    const response = req.method === 'GET'
      ? await axios.get(url, config)
      : await axios.delete(url, { ...config, data: req.body })

    return res.status(response.status).json(response.data)
  } catch (error) {
    console.error('Job posting audit proxy error:', error.response?.data || error.message)
    return res.status(error.response?.status || 500).json(error.response?.data || { error: req.method === 'DELETE' ? 'Failed to permanently delete job posting.' : 'Failed to fetch job posting audit details.' })
  }
}