import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { job, name, cv_url, appliers_emp_id } = req.body;

  // ✅ Validate
  if (!job || !name || !cv_url) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // ✅ Correct payload matches Django model
    const backendRes = await axios.post(
      `${process.env.BACKEND_DOMAIN}/api/job-vacancy/${job}/apply/`,
      {
        name,
        cv_url: encodeURI(cv_url),
        appliers_emp_id, // optional
      },
      { headers: { "Content-Type": "application/json" } }
    );

    return res.status(backendRes.status).json(backendRes.data);
  } catch (err) {
    console.error("Apply job error:", err.response?.data || err.message);
    return res
      .status(err.response?.status || 500)
      .json({ error: "Failed to apply for job" });
  }
}
