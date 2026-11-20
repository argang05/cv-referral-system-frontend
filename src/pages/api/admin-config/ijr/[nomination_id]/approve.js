export default async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).json({ error: 'Method not allowed.' })
    }
  
    const backend = process.env.BACKEND_DOMAIN
  
    if (!backend) {
      return res.status(500).json({ error: 'Backend domain is not configured.' })
    }
  
    const { nomination_id } = req.query
  
    if (typeof nomination_id !== 'string') {
      return res.status(400).json({ error: 'Invalid nomination ID.' })
    }
  
    try {
      const response = await fetch(
        `${backend.replace(/\/$/, '')}/api/admin-config/ijr/${encodeURIComponent(nomination_id)}/approve/`,
        {
          method: 'POST',
          headers: {
            Cookie: req.headers.cookie || '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(req.body || {}),
          cache: 'no-store'
        }
      )
  
      const data = await response.json()
      return res.status(response.status).json(data)
    } catch (error) {
      console.error('IJR approval proxy error:', error)
      return res.status(502).json({ error: 'Unable to approve IJR nomination.' })
    }
  }