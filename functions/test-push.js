import { sendPush } from "../lib/fcm-admin.js";
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

  const { token } = body;
  if (!token) return json({ error: "Missing token" }, 400);

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