import axios from 'axios';

export default async function handler(req, res) {
  const { emp_id } = req.query;

  try {
    const response = await axios.get(
      `${process.env.BACKEND_DOMAIN}/api/get-user-by-empid/`,
      { params: { emp_id } }
    );
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Fetch user failed:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({ error: 'Failed to fetch user data' });
  }
}
