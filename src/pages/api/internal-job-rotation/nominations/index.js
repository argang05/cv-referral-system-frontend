export default async function handler(req, res) {
    if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ error: "Method not allowed." });
    const backend = process.env.BACKEND_DOMAIN;
    if (!backend) return res.status(500).json({ error: "Backend URL is not configured." });
    try {
      const response = await fetch(`${backend.replace(/\/$/, "")}/api/internal-job-rotation/nominations/`, {
        method: req.method,
        headers: { Cookie: req.headers.cookie || "", ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}), ...(req.method === "POST" ? { "Content-Type": "application/json" } : {}) },
        ...(req.method === "POST" ? { body: JSON.stringify(req.body) } : {})
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      console.error("IJR nominations proxy error:", error);
      return res.status(502).json({ error: "Unable to process IJR nominations." });
    }
  }