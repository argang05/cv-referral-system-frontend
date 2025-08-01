// pages/api/admin-config/sbus/update-departments.js

import axios from 'axios';

const base = process.env.BACKEND_DOMAIN;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const r = await axios.post(`${base}/api/admin-config/sbus/update-departments/`, req.body);
      res.status(200).json(r.data);
    } catch (err) {
      console.error(err);
      res.status(err.response?.status || 500).json({ error: 'Failed to update SBU departments' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
