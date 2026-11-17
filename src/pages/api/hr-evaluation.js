import axios from 'axios';

export default async function handler(req, res) {
  const backendUrl = `${process.env.BACKEND_DOMAIN}/api/hr-evaluation/`;
  if (!['GET', 'POST', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.BACKEND_DOMAIN) {
    return res.status(500).json({ error: 'BACKEND_DOMAIN is not configured.' });
  }
  try {
    const config = { timeout: 30000 };
    let response;
    if (req.method === 'GET') {
      response = await axios.get(backendUrl, { ...config, params: req.query });
    } else if (req.method === 'POST') {
      response = await axios.post(backendUrl, req.body, config);
    } else {
      response = await axios.put(backendUrl, req.body, config);
    }
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('HR evaluation proxy error:', error.response?.data || error.message);
    return res.status(error.response?.status || 502).json(
      error.response?.data || { error: 'Failed to communicate with backend.' }
    );
  }
}