import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  const backend = process.env.BACKEND_DOMAIN;
  if (!backend) return res.status(500).json({ error: "Backend URL is not configured." });

  try {
    const response = await axios.post(
      `${backend.replace(/\/$/, "")}/api/notifications/mark-all-read/`,
      {},
      {
        headers: {
          Cookie: req.headers.cookie || "",
          ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {})
        }
      }
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Mark all notifications read failed:", error.response?.data || error.message);
    return res.status(error.response?.status || 502).json(
      error.response?.data || { error: "Unable to mark notifications as read." }
    );
  }
}