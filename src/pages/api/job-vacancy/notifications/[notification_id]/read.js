import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { notification_id } = req.query;
  if (!notification_id || Array.isArray(notification_id)) {
    return res.status(400).json({ error: "Invalid notification ID." });
  }
  try {
    const response = await axios.post(
      `${process.env.BACKEND_DOMAIN}/api/job-vacancy/notifications/${notification_id}/read/`,
      {},
      { headers: { Cookie: req.headers.cookie || "" } }
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json(
      error.response?.data || { error: "Failed to mark notification as read." }
    );
  }
}