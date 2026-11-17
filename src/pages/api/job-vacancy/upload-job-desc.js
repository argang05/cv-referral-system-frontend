import { IncomingForm } from "formidable";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const form = new IncomingForm({ multiples: false, keepExtensions: true, maxFileSize: 5 * 1024 * 1024 });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("File parsing error:", err);
      return res.status(400).json({ error: "File parsing failed or file exceeds 5MB." });
    }
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded." });
    }
    try {
      const formData = new FormData();
      formData.append("file", fs.createReadStream(file.filepath), file.originalFilename);
      const backendRes = await axios.post(
        `${process.env.BACKEND_DOMAIN}/api/job-vacancy/upload-job-desc/`,
        formData,
        { headers: { ...formData.getHeaders(), Cookie: req.headers.cookie || "" }, maxBodyLength: Infinity }
      );
      return res.status(backendRes.status).json(backendRes.data);
    } catch (error) {
      console.error("Job description upload failed:", error.response?.data || error.message);
      return res.status(error.response?.status || 500).json(error.response?.data || { error: "Job description upload failed." });
    }
  });
}