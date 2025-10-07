import axios from "axios";

export default async function handler(req, res) {
  const { applicant_id } = req.body;

  if (!applicant_id) {
    return res.status(400).json({ error: "Missing applicant_id" });
  }

  // ✅ PUT — Update Applicant
  if (req.method === "PUT") {
    try {
      const backendRes = await axios.put(
        `${process.env.BACKEND_DOMAIN}/api/job-vacancy/application/${applicant_id}/update/`,
        req.body,
        { headers: { "Content-Type": "application/json" } }
      );
      return res.status(backendRes.status).json(backendRes.data);
    } catch (err) {
      console.error("Applicant update error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json({ error: "Failed to update application" });
    }
  }

  // ✅ DELETE — Delete Applicant
  if (req.method === "DELETE") {
    try {
      const backendRes = await axios.delete(
        `${process.env.BACKEND_DOMAIN}/api/job-vacancy/application/${applicant_id}/delete/`
      );
      return res.status(204).json({ message: "Application deleted successfully" });
    } catch (err) {
      console.error("Applicant delete error:", err.response?.data || err.message);
      return res.status(err.response?.status || 500).json({ error: "Failed to delete application" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
