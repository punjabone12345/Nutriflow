import { sendPush } from "../lib/fcm-admin.js";
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

  // sendPush goes through Firebase Admin, which rejects an invalid token —
  // so only the device that holds this token can target it. No shared secret
  // is sent from the browser.
  try {
    await sendPush(token, {
      title: "NutriFlow test 🧪",
      body: "This is a test push from the NutriFlow reminder service.",
      data: { meal: "test", url: "/log" },
    });
    return json({ ok: true, message: "Test push sent via Firebase Admin." });
  } catch (err) {
    return json({ error: err?.message || String(err) }, 500);
  }
}

export { corsHeaders };
