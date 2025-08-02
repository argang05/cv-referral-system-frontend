import axios from 'axios';

const BACKEND = process.env.BACKEND_DOMAIN || 'http://localhost:8000';

export default async function handler(req, res) {
  const url = `${BACKEND}/api/admin-config/sbus-list/`; // list endpoint

  try {
    if (req.method === 'GET') {
      const backendRes = await axios.get(url);
      return res.status(200).json(backendRes.data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Proxy error:', err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({
      error: err.response?.data || 'Backend communication failed'
    });
  }
}
