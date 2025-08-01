// pages/api/admin-config/email-templates/index.js
import axios from 'axios';

const BACKEND = process.env.BACKEND_DOMAIN || 'http://localhost:8000';

export default async function handler(req, res) {
  const url = `${BACKEND}/api/admin-config/email-templates/`;

  try {
    if (req.method === 'GET') {
      const backendRes = await axios.get(url, {
        headers: {
          'Cache-Control': 'no-cache',
        },
        params: req.query,
      });
      return res.status(200).json(backendRes.data);
    }

    if (req.method === 'POST') {
      const backendRes = await axios.post(url, req.body);
      return res.status(201).json(backendRes.data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Proxy error:', err.response?.data || err.message);
    return res
      .status(err.response?.status || 500)
      .json({ error: err.response?.data || 'Backend communication failed' });
  }
}
