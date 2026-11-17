import axios from "axios";

export default async function handler(req, res) {
  const { job_id } = req.query;
  if (!job_id || Array.isArray(job_id)) {
    return res.status(400).json({ error: "Invalid job ID." });
  }
  const baseUrl = `${process.env.BACKEND_DOMAIN}/api/job-vacancy/${job_id}/`;
  const headers = { Cookie: req.headers.cookie || "" };
  if (req.method === "GET") {
    try {
      const backendRes = await axios.get(baseUrl, { headers });
      return res.status(backendRes.status).json(backendRes.data);
    } catch (err) {
      console.error("Fetch job error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json(err.response?.data || { error: "Failed to fetch job" });
    }
  }
  if (req.method === "PUT") {
    try {
      const backendRes = await axios.put(`${baseUrl}update/`, req.body, { headers: { ...headers, "Content-Type": "application/json" } });
      return res.status(backendRes.status).json(backendRes.data);
    } catch (err) {
      console.error("Update job error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json(err.response?.data || { error: "Failed to update job" });
    }
  }
  if (req.method === "DELETE") {
    try {
      const backendRes = await axios.delete(`${baseUrl}delete/`, { headers });
      return res.status(backendRes.status).json(backendRes.data);
    } catch (err) {
      console.error("Delete job error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json(err.response?.data || { error: "Failed to delete job" });
    }
  }
  return res.status(405).json({ error: "Method not allowed" });
}