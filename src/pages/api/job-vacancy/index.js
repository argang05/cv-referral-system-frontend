import axios from "axios";

export default async function handler(req, res) {
  const baseUrl = `${process.env.BACKEND_DOMAIN}/api/job-vacancy/`;

  // ✅ GET — List Jobs
  if (req.method === "GET") {
    try {
      const backendRes = await axios.get(baseUrl);
      return res.status(200).json(backendRes.data);
    } catch (err) {
      console.error("Fetch jobs error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json({ error: "Failed to load jobs" });
    }
  }

  // ✅ POST — Create Job
  if (req.method === "POST") {
    try {
      const backendRes = await axios.post(baseUrl, req.body, {
        headers: { "Content-Type": "application/json" },
      });
      return res.status(backendRes.status).json(backendRes.data);
    } catch (err) {
      console.error("Create job error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json({ error: "Failed to create job" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
