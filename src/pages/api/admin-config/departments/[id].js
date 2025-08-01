import axios from 'axios';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === 'PUT') {
    const r = await axios.put(`${process.env.BACKEND_DOMAIN}/api/admin-config/departments/${id}/update/`, req.body);
    res.status(200).json(r.data);
  }
}
