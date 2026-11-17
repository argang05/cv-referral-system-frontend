import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { job_id, candidate_name, candidate_type, cv_url } = req.body || {};
  if (!job_id || !candidate_name || !candidate_type || !cv_url) {
    return res.status(400).json({ error: "Job ID, candidate name, candidate type and CV are required." });
  }
  try {
    const backendRes = await axios.post(
      `${process.env.BACKEND_DOMAIN}/api/referrals/ijp/`,
      req.body,
      { headers: { Cookie: req.headers.cookie || "", "Content-Type": "application/json" } }
    );
    return res.status(backendRes.status).json(backendRes.data);
  } catch (err) {
    console.error("IJP referral submission error:", err.response?.data || err.message);
    return res.status(err.response?.status || 500).json(err.response?.data || { error: "Failed to submit IJP referral." });
  }
}