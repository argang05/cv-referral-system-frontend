import axios from "axios";

export default async function handler(req, res) {
  const baseUrl = `${process.env.BACKEND_DOMAIN}/api/job-vacancy/`;
  const headers = { Cookie: req.headers.cookie || "" };
  if (req.method === "GET") {
    try {
      const backendRes = await axios.get(baseUrl, { headers, params: req.query });
      return res.status(backendRes.status).json(backendRes.data);
    } catch (err) {
      console.error("Fetch jobs error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json(err.response?.data || { error: "Failed to load jobs" });
    }
  }
  if (req.method === "POST") {
    try {
      const backendRes = await axios.post(baseUrl, req.body, { headers: { ...headers, "Content-Type": "application/json" } });
      return res.status(backendRes.status).json(backendRes.data);
    } catch (err) {
      console.error("Create job error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json(err.response?.data || { error: "Failed to create job" });
    }
  }
  return res.status(405).json({ error: "Method not allowed" });
}