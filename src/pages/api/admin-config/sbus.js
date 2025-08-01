// /pages/api/admin-config/sbus.js
import axios from 'axios';

export default async function handler(req, res) {
  const base = process.env.BACKEND_DOMAIN;
  try {
    if (req.method === 'GET') {
      const response = await axios.get(`${base}/api/admin-config/sbus/`);
      return res.status(200).json(response.data);

    } else if (req.method === 'POST') {
      const response = await axios.post(`${base}/api/admin-config/sbus/`, req.body);
      return res.status(201).json(response.data);

    } else {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
