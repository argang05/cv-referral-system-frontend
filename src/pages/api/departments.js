// pages/api/departments.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const backendRes = await axios.get(`${process.env.BACKEND_DOMAIN}/api/departments/`);
      return res.status(200).json(backendRes.data);
    } catch (error) {
      console.error('Backend error:', error.response?.data || error.message);
      return res.status(error.response?.status || 500).json({ error: 'Failed to load departments' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
