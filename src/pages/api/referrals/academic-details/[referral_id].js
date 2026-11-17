import axios from 'axios';

export default async function handler(req, res) {
  const BACKEND_DOMAIN = process.env.BACKEND_DOMAIN?.replace(/\/$/, '');
  const { referral_id } = req.query;

  if (!BACKEND_DOMAIN) {
    return res.status(500).json({ error: 'Backend domain is not configured.' });
  }

  if (!referral_id || !/^\d+$/.test(String(referral_id))) {
    return res.status(400).json({ error: 'Invalid referral ID.' });
  }

  const backendUrl = `${BACKEND_DOMAIN}/api/referrals/academic-details/${referral_id}/`;

  try {
    if (req.method === 'GET') {
      const { emp_id } = req.query;

      if (!emp_id) {
        return res.status(400).json({ error: 'emp_id is required.' });
      }

      const backendRes = await axios.get(backendUrl, {
        params: { emp_id },
        timeout: 20000
      });

      return res.status(backendRes.status).json(backendRes.data);
    }

    if (req.method === 'PATCH') {
      const { emp_id, action } = req.body || {};

      if (!emp_id) {
        return res.status(400).json({ error: 'emp_id is required.' });
      }

      if (!['SAVE_DRAFT', 'FINALIZE'].includes(action)) {
        return res.status(400).json({ error: 'Invalid academic action.' });
      }

      const backendRes = await axios.patch(backendUrl, req.body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000
      });

      return res.status(backendRes.status).json(backendRes.data);
    }

    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error(
      'Academic details request error:',
      error.response?.data || error.message
    );

    return res.status(error.response?.status || 500).json(
      error.response?.data || {
        error: 'Failed to process academic details.'
      }
    );
  }
}