import axios from "axios";

export default async function handler(req, res) {
  const { job_id } = req.query;
  const baseUrl = `${process.env.BACKEND_DOMAIN}/api/job-vacancy/${job_id}/`;

  // ✅ GET — Get Job Details
  if (req.method === "GET") {
    try {
      const backendRes = await axios.get(baseUrl);
      return res.status(200).json(backendRes.data);
    } catch (err) {
      console.error("Fetch job details error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json({ error: "Failed to fetch job" });
    }
  }

  // ✅ PUT — Update Job
  if (req.method === "PUT") {
    try {
      const backendRes = await axios.put(
        `${baseUrl}update/`,
        req.body,
        { headers: { "Content-Type": "application/json" } }
      );
      return res.status(backendRes.status).json(backendRes.data);
    } catch (err) {
      console.error("Update job error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json({ error: "Failed to update job" });
    }
  }

  // ✅ DELETE — Delete Job
  if (req.method === "DELETE") {
    try {
      const backendRes = await axios.delete(`${baseUrl}delete/`);
      return res.status(204).json({ message: "Job deleted successfully" });
    } catch (err) {
      console.error("Delete job error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json({ error: "Failed to delete job" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
