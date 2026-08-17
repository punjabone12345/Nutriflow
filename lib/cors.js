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

// Fail-closed shared-secret check. Mutating endpoints (/sync, /unregister,
// /test-push) MUST be authenticated so an unauthenticated party cannot create,
// overwrite, or delete another user's push registration. If AUTH_SECRET is not
// configured on the function, every mutating request is rejected until the
// operator sets it. Returns null on success, or an error message string.
export function checkAuth(req) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return "Server AUTH_SECRET not configured — set it in Netlify env.";
  if (req.headers.get("x-auth-secret") !== secret) return "Unauthorized";
  return null;
}