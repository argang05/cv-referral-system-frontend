import axios from "axios";

const ALLOWED_ACTIONS = ["publish", "close", "reopen", "archive"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { job_id, action } = req.query;
  if (!job_id || Array.isArray(job_id) || !action || Array.isArray(action)) {
    return res.status(400).json({ error: "Invalid job ID or action." });
  }
  if (!ALLOWED_ACTIONS.includes(action)) {
    return res.status(400).json({ error: "Unsupported job action." });
  }
  try {
    const backendRes = await axios.post(
      `${process.env.BACKEND_DOMAIN}/api/job-vacancy/${job_id}/${action}/`,
      req.body || {},
      { headers: { Cookie: req.headers.cookie || "", "Content-Type": "application/json" } }
    );
    return res.status(backendRes.status).json(backendRes.data);
  } catch (err) {
    console.error(`Job ${action} error:`, err.response?.data || err.message);
    return res.status(err.response?.status || 500).json(err.response?.data || { error: `Failed to ${action} job` });
  }
}