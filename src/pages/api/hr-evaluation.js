// pages/api/hr-evaluation.js

import axios from 'axios';

export default async function handler(req, res) {
  const backendUrl = `${process.env.BACKEND_DOMAIN}/api/hr-evaluation/`;

  try {
    if (req.method === 'GET') {
      const response = await axios.get(backendUrl);
      return res.status(200).json(response.data);
    }

    if (req.method === 'POST') {
      console.log("POST /api/hr-evaluation payload:", req.body);
      const response = await axios.post(backendUrl, req.body);
      return res.status(200).json(response.data);
    }

    if (req.method === 'PUT') {
      console.log("PUT /api/hr-evaluation payload:", req.body);
      const response = await axios.put(backendUrl, req.body);
      return res.status(200).json(response.data);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('❌ Proxy error:', err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || 'Failed to communicate with backend'
    });
  }
}
