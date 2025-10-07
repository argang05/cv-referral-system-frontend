import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { job_id } = req.query;
  if (!job_id) return res.status(400).json({ error: "Missing job_id" });

  try {
    const backendRes = await axios.get(`${process.env.BACKEND_DOMAIN}/api/job-vacancy/${job_id}/applicants/`);
    return res.status(200).json(backendRes.data);
  } catch (err) {
    console.error("Fetch applicants error:", err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({ error: "Failed to fetch applicants" });
  }
}
