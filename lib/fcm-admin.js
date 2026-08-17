// Firebase Admin SDK — server-side only. Credentials come from environment
// variables; never hard-code or expose the private key in the frontend.

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