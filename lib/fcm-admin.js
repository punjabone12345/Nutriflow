// Firebase Admin SDK — server-side only. Credentials come from environment
// variables; never hard-code or expose the private key in the frontend.
//
// firebase-admin is imported as a normal static ESM import so Netlify's esbuild
// bundler resolves + bundles it into the function at deploy time (declared in
// this folder's package.json). A runtime require() leaves the module OUT of the
// esbuild bundle, and Netlify ships no node_modules for bundled functions — so
// a runtime require() of firebase-admin fails with "Cannot find module
// 'firebase-admin'". The app's Vite build never bundles this real dep —
// vite.config.js aliases firebase-admin to an inert stub so the app build stays
// isolated from this standalone backend.

import admin from "firebase-admin";

let initialized = false;

function ensureInit() {
  if (initialized) return admin;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in Netlify environment variables."
    );
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  initialized = true;
  return admin;
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
