// Shared CORS + JSON helpers for the Netlify functions.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-auth-secret",
};

export function preflight() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders },
  });
}

// Shared-secret guard reserved for admin-only / internal endpoints. It is NOT
// used by the browser-facing /sync, /unregister, /test-push — those authenticate
// via FCM token verification (fcm-admin.verifyToken), so no server secret ever
// reaches the browser. AUTH_SECRET lives only in the Netlify function env.
// Returns null on success, or an error message string.
export function checkAuth(req) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return "Server AUTH_SECRET not configured — set it in Netlify env.";
  if (req.headers.get("x-auth-secret") !== secret) return "Unauthorized";
  return null;
}
