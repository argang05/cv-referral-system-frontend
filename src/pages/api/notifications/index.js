import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const response = await axios.get(`${process.env.BACKEND_DOMAIN}/api/notifications/`, { headers: { Cookie: req.headers.cookie || "" } });
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to fetch notifications." });
  }
}