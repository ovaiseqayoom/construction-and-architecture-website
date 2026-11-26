// api/404.js
import { SITE_URL } from "./_shared.js";

/**
 * Unmatched API Route Handler
 * Returns standard JSON 404 for any non-existent /api/* endpoint.
 */
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const requestedUrl = req.url || "/api";

  return res.status(404).json({
    error: "Not Found",
    status: 404,
    statusCode: 404,
    message: `API endpoint '${requestedUrl}' not found.`,
    docs: `${SITE_URL}/contact`
  });
}
