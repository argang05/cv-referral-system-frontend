// pages/api/admin-config/email-templates/[purpose].js
import axios from 'axios';

const BACKEND = process.env.BACKEND_DOMAIN || 'http://localhost:8000';

export default async function handler(req, res) {
  const { purpose } = req.query;
  const url = `${BACKEND}/api/admin-config/email-templates/${purpose}/`;

  try {
    if (req.method === 'GET') {
      const backendRes = await axios.get(url, {
        headers: {
          'Cache-Control': 'no-cache', // prevent 304 from masking updates
        },
      });
      return res.status(200).json(backendRes.data);
    }

    if (req.method === 'PUT') {
      const backendRes = await axios.put(url, req.body);
      return res.status(200).json(backendRes.data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Proxy error:', err.response?.data || err.message);
    return res
      .status(err.response?.status || 500)
      .json({ error: err.response?.data || 'Backend communication failed' });
  }
}
