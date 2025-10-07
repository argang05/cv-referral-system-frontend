import { IncomingForm } from "formidable";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = new IncomingForm({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Parsing error:", err);
      return res.status(500).json({ error: "File parsing failed" });
    }

    const file = files.file?.[0];
    const name = fields.name?.[0];
    if (!file || !name) return res.status(400).json({ error: "Missing file or applicant name" });

    try {
      const fileStream = fs.createReadStream(file.filepath);
      const formData = new FormData();
      formData.append("file", fileStream, file.originalFilename);
      formData.append("name", name);

      const backendRes = await axios.post(
        `${process.env.BACKEND_DOMAIN}/api/job-vacancy/upload-applicant-cv/`,
        formData,
        { headers: formData.getHeaders() }
      );

      console.log("Backend Res Data: ",backendRes.data)

      return res.status(200).json(backendRes.data);
    } catch (uploadError) {
      console.error("Upload failed:", uploadError.message);
      return res.status(500).json({ error: "Upload to backend failed" });
    }
  });
}
