// pages/api/referrals.js
import axios from 'axios';

const BACKEND_DOMAIN = process.env.BACKEND_DOMAIN?.replace(/\/+$/, '');

export default async function handler(req, res) {
  if (!BACKEND_DOMAIN) {
    return res.status(500).json({ error: 'Backend configuration is missing.' });
  }

  // GET: Fetch referrals submitted by an employee
  if (req.method === 'GET') {
    const { emp_id } = req.query;
    if (!emp_id) {
      return res.status(400).json({ error: 'emp_id is required' });
    }

    try {
      const backendRes = await axios.get(`${BACKEND_DOMAIN}/api/referrals/my/`, {
        params: { emp_id },
        timeout: 30000
      });
      return res.status(backendRes.status).json(backendRes.data);
    } catch (err) {
      console.error('Fetch referrals error:', err.response?.data || err.message);
      return res.status(err.response?.status || 500).json(
        err.response?.data || { error: 'Failed to load referrals' }
      );
    }
  }

  // POST: Submit a new referral
  if (req.method === 'POST') {
    try {
      const backendRes = await axios.post(
        `${BACKEND_DOMAIN}/api/referrals/`,
        req.body,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );
      return res.status(backendRes.status).json(backendRes.data);
    } catch (err) {
      console.error('Referral submit error:', err.response?.data || err.message);
      return res.status(err.response?.status || 500).json(
        err.response?.data || { error: 'Failed to submit referral' }
      );
    }
  }

  // PUT: Update an existing referral
  if (req.method === 'PUT') {
    const {
      referral_id,
      emp_id,
      candidate_name,
      candidate_type,
      candidate_email,
      candidate_phone,
      additional_comment,
      cv_url,
      referral_reason_type
    } = req.body || {};

    if (!referral_id) {
      return res.status(400).json({ error: 'Missing referral_id' });
    }

    try {
      const payload = {
        emp_id,
        candidate_name,
        candidate_type,
        candidate_email,
        candidate_phone,
        additional_comment,
        cv_url,
        referral_reason_type
      };

      const backendRes = await axios.put(
        `${BACKEND_DOMAIN}/api/referrals/${encodeURIComponent(referral_id)}/update/`,
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );
      return res.status(backendRes.status).json(backendRes.data);
    } catch (err) {
      console.error('Update referral error:', err.response?.data || err.message);
      return res.status(err.response?.status || 500).json(
        err.response?.data || { error: 'Update failed' }
      );
    }
  }

  // DELETE: Delete an existing referral
  if (req.method === 'DELETE') {
    const { referralId, emp_id } = req.body || {};

    if (!referralId || !emp_id) {
      return res.status(400).json({ error: 'Missing referralId or emp_id' });
    }

    try {
      await axios.delete(
        `${BACKEND_DOMAIN}/api/referrals/${encodeURIComponent(referralId)}/delete/`,
        {
          params: { emp_id },
          timeout: 30000
        }
      );
      return res.status(204).end();
    } catch (err) {
      console.error('Delete referral error:', err.response?.data || err.message);
      return res.status(err.response?.status || 500).json(
        err.response?.data || { error: 'Delete failed' }
      );
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}