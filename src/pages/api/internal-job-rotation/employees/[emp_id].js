export default async function handler(req, res) {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });
    const backend = process.env.BACKEND_DOMAIN;
    if (!backend) return res.status(500).json({ error: "Backend URL is not configured." });
    const empId = typeof req.query.emp_id === "string" ? req.query.emp_id : "";
    if (!empId) return res.status(400).json({ error: "Employee ID is required." });
    try {
      const response = await fetch(`${backend.replace(/\/$/, "")}/api/internal-job-rotation/employees/${encodeURIComponent(empId)}/`, { method: "GET", headers: { Cookie: req.headers.cookie || "", ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}) } });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      console.error("IJR employee detail proxy error:", error);
      return res.status(502).json({ error: "Unable to retrieve employee details." });
    }
  }