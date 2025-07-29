import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const emp_id = req.query.emp_id;
    if (!emp_id) return res.status(400).json({ error: 'emp_id is required' });

    try {
      const backendRes = await axios.get(`${process.env.BACKEND_DOMAIN}/api/reviews/?emp_id=${emp_id}`);
      return res.status(200).json(backendRes.data);
    } catch (error) {
      console.error('Error fetching reviews:', error.response?.data || error.message);
      return res.status(error.response?.status || 500).json({ error: 'Failed to fetch reviews' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { referral_id, decision, comment, emp_id } = req.body;

      console.log("📤 Submitting review with:", { referral_id, decision, comment, emp_id });

      if (!referral_id || !decision || !emp_id) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const backendRes = await axios.post(
        `${process.env.BACKEND_DOMAIN}/api/reviews/${referral_id}/submit/`,
        { decision, comment, emp_id }
      );

      return res.status(backendRes.status).json(backendRes.data);

    } catch (error) {
      console.error('❌ Error submitting review:', error.response?.data || error.message);
      return res
        .status(error.response?.status || 500)
        .json({ error: 'Failed to submit review' });
    }
  }

  if (req.method === 'PUT') {
  try {
    const { referral_id, decision, comment, emp_id } = req.body;

    if (!referral_id || !decision || !emp_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const backendRes = await axios.put(
      `${process.env.BACKEND_DOMAIN}/api/reviews/${referral_id}/update/`,
      { decision, comment, emp_id }
    );

    return res.status(backendRes.status).json(backendRes.data);
    } catch (error) {
      console.error('❌ Error updating review:', error.response?.data || error.message);
      return res.status(error.response?.status || 500).json({ error: 'Failed to update review' });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
