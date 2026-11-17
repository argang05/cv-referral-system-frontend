import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const { search = "", status = "ALL", action = "ALL", start_date = "", end_date = "", page = "1", page_size = "10" } = req.query;
    const response = await axios.get(`${process.env.BACKEND_DOMAIN}/api/admin-config/job-posting-audit/`, {
      headers: { Cookie: req.headers.cookie || "" },
      params: { search, status, action, start_date, end_date, page, page_size },
      timeout: 60000
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Job posting audit list proxy error:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to fetch job posting audit records." });
  }
}