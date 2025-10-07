// pages/api/referrals.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { emp_id } = req.query;
    if (!emp_id) return res.status(400).json({ error: 'emp_id is required' });

    try {
      const backendRes = await axios.get(`${process.env.BACKEND_DOMAIN}/api/referrals/my/?emp_id=${emp_id}`);
      console.log(backendRes.data);
      return res.status(200).json(backendRes.data);
    } catch (err) {
      console.error("Backend error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json({ error: 'Failed to load referrals' });
    }
  }

  if (req.method === 'POST') {
    try {
      const backendRes = await axios.post(
        `${process.env.BACKEND_DOMAIN}/api/referrals/`,
        req.body, // ✅ forward request body
        {
          headers: {
            'Content-Type': 'application/json' // ✅ ensure correct header
          }
        }
      );
      return res.status(backendRes.status).json(backendRes.data);
    } catch (err) {
      console.error("Referral submit error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json({ error: 'Failed to submit referral' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { referral_id, emp_id, candidate_name, candidate_type, additional_comment, cv_url, referral_reason_type } = req.body;
      if (!referral_id) return res.status(400).json({ error: 'Missing referral_id' });

      const backendRes = await axios.put(
        `${process.env.BACKEND_DOMAIN}/api/referrals/${referral_id}/update/`,
        {
          emp_id,
          candidate_name,
          candidate_type,
          additional_comment,
          referral_reason_type,
          cv_url
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return res.status(backendRes.status).json(backendRes.data);
    } catch (err) {
      console.error("Update error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json({ error: 'Update failed' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { referralId, emp_id } = req.body;

      if (!referralId || !emp_id) {
        return res.status(400).json({ error: 'Missing referralId or emp_id' });
      }

      const backendRes = await axios.delete(
        `${process.env.BACKEND_DOMAIN}/api/referrals/${referralId}/delete/?emp_id=${emp_id}`
      );

      return res.status(204).json({ message: 'Referral deleted successfully' });
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json({ error: 'Delete failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}