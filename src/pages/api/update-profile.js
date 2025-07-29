// pages/api/update-profile.js
import axios from 'axios';

export default async function handler(req, res) {
  const backendUrl = `${process.env.BACKEND_DOMAIN}/api/update-profile/`;

  try {
    const response = await axios.put(backendUrl, req.body);
    res.status(200).json(response.data);
  } catch (err) {
    console.error("Profile update error:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'Profile update failed' });
  }
}
