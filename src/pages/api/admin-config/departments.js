import axios from 'axios';

export default async function handler(req, res) {
  const { method } = req;
  const base = process.env.BACKEND_DOMAIN;

  if (method === 'GET') {
    const r = await axios.get(`${base}/api/admin-config/departments/`);
    res.status(200).json(r.data);
  } else if (method === 'POST') {
    const r = await axios.post(`${base}/api/admin-config/departments/create/`, req.body);
    res.status(201).json(r.data);
  }
}
