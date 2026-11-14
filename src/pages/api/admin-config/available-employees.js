import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const backendRes = await axios.get(
      `${process.env.BACKEND_DOMAIN}/api/available-employees/`
    );

    return res.status(200).json(backendRes.data);
  } catch (err) {
    console.error(
      "Failed to fetch available employees:",
      err.response?.data || err.message
    );

    return res.status(err.response?.status || 500).json({
      error:
        err.response?.data?.error ||
        "Unable to fetch available employees.",
    });
  }
}