import axios from 'axios';

export default async function handler(req, res) {
  const BACKEND_DOMAIN = process.env.BACKEND_DOMAIN?.replace(/\/$/, '');

  if (!BACKEND_DOMAIN) {
    return res.status(500).json({ error: 'Backend domain is not configured.' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { emp_id, status = 'ACTIVE' } = req.query;

  if (!emp_id) {
    return res.status(400).json({ error: 'emp_id is required.' });
  }

  try {
    const backendRes = await axios.get(
      `${BACKEND_DOMAIN}/api/referrals/academic-details/`,
      {
        params: { emp_id, status },
        timeout: 20000
      }
    );

    return res.status(backendRes.status).json(backendRes.data);
  } catch (error) {
    console.error(
      'Academic details list error:',
      error.response?.data || error.message
    );

    return res.status(error.response?.status || 500).json(
      error.response?.data || {
        error: 'Failed to fetch academic details.'
      }
    );
  }
}