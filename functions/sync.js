import { saveRegistration } from "../lib/blobs.js";
import { verifyToken } from "../lib/fcm-admin.js";
import { corsHeaders, preflight, json } from "../lib/cors.js";

export default async function (req) {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { user_id, token, reminder_times, timezone, enabled } = body;
  if (!token || !user_id) return json({ error: "Missing token or user_id" }, 400);

  // Server-side auth: verify the caller owns this FCM token via Firebase Admin
  // (dry-run). No shared secret ever reaches the browser.
  const valid = await verifyToken(token);
  if (!valid) return json({ error: "Invalid FCM token" }, 401);

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
