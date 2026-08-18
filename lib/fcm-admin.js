// Firebase Admin SDK — server-side only. Credentials come from environment
// variables; never hard-code or expose the private key in the frontend.
// Loaded via createRequire (Node built-in) so this stays valid ESM on Netlify
// without a static bare import that a frontend bundler would try to resolve.

import { createRequire } from "module";
const require = createRequire(import.meta.url);

let _admin = null;
let initialized = false;

function ensureInit() {
  if (initialized) return _admin;
  _admin = require("firebase-admin");
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in Netlify environment variables."
    );
  }

  if (_admin.apps.length === 0) {
    _admin.initializeApp({
      credential: _admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  initialized = true;
  return _admin;
}

// Send a data-only push so the NutriFlow service worker's onBackgroundMessage
// handler builds the visible notification (with our custom click URL).
export async function sendPush(token, { title, body, data }) {
  const a = ensureInit();
  const message = {
    token,
    data: {
      title: title || "NutriFlow 🍽️",
      body: body || "Time to log your meal!",
      ...(data || {}),
    },
    android: { priority: "high" },
  };
  return a.messaging().send(message);
}

export function isInvalidTokenError(err) {
  const msg = String(err?.message || "");
  const code = String(err?.errorInfo?.code || err?.code || "");
  return (
    /registration-token-not-registered|invalid-registration|UNREGISTERED|messaging\/invalid/i.test(
      msg + " " + code
    )
  );
}

// Verify an FCM registration token server-side via a dry-run send. This is the
// browser-facing endpoints' auth: only the device that holds this token can
// mutate its own registration — no shared secret ever reaches the browser.
// Returns true if the token is valid for this Firebase project.
export async function verifyToken(token) {
  const a = ensureInit();
  try {
    await a.messaging().send({ token, data: { _verify: "1" } }, true);
    return true;
  } catch {
    return false;
  }
}
