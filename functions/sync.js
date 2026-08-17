import { saveRegistration } from "../lib/blobs.js";
import { corsHeaders, preflight, json, checkAuth } from "../lib/cors.js";

export default async function (req) {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const authErr = checkAuth(req);
  if (authErr) return json({ error: authErr }, 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { user_id, token, reminder_times, timezone, enabled } = body;
  if (!token || !user_id) return json({ error: "Missing token or user_id" }, 400);

  await saveRegistration({
    user_id,
    token,
    reminder_times: reminder_times || {},
    timezone: timezone || "UTC",
    enabled: enabled !== false,
    invalid: false,
  });

  return json({ ok: true });
}

export { corsHeaders };