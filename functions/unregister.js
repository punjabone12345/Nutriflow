import { deleteRegistration } from "../lib/blobs.js";
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

  const { token } = body;
  if (!token) return json({ error: "Missing token" }, 400);

  // Idempotent: only the holder of this FCM token can unregister it, and a
  // token that's already invalid has nothing left to delete. No shared secret
  // is needed — the token itself is the device-bound credential.
  await deleteRegistration(token);
  return json({ ok: true });
}

export { corsHeaders };
