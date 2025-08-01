// pages/api/admin-config/sbus/[email].js

import axios from 'axios'

export default async function handler(req, res) {
  const { email } = req.query;

  const BACKEND_DOMAIN = process.env.BACKEND_DOMAIN || 'http://localhost:8000';
  const baseUrl = `${BACKEND_DOMAIN}/api/admin-config/sbus/${email}/`;

  try {
    if (req.method === 'PUT') {
      const response = await axios.put(baseUrl, req.body);  // req.body should contain new name/email/departments
      return res.status(200).json(response.data);
    } else if (req.method === 'DELETE') {
      const response = await axios.delete(baseUrl, {
        params: {
          department_id: req.query.department_id, // ✅ include deptId
        },
      });
      return res.status(response.status).json(response.data || {});
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('API error:', err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({
      error: err.response?.data || 'Internal Server Error',
    });
  }
}
