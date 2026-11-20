export default async function handler(req, res) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).json({ error: 'Method not allowed.' })
    }
  
    const backend = process.env.BACKEND_DOMAIN
  
    if (!backend) {
      return res.status(500).json({ error: 'Backend domain is not configured.' })
    }
  
    try {
      const query = new URLSearchParams()
  
      for (const key of ['search', 'status', 'date_from', 'date_to']) {
        if (typeof req.query[key] === 'string' && req.query[key].trim()) {
          query.set(key, req.query[key].trim())
        }
      }
  
      const url = `${backend.replace(/\/$/, '')}/api/admin-config/ijr/${query.toString() ? `?${query}` : ''}`
  
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Cookie: req.headers.cookie || ''
        },
        cache: 'no-store'
      })
  
      const data = await response.json()
      return res.status(response.status).json(data)
    } catch (error) {
      console.error('IJR admin list proxy error:', error)
      return res.status(502).json({ error: 'Unable to retrieve IJR nominations.' })
    }
  }