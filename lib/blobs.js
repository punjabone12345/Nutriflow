// Netlify Blobs storage for reminder registrations + sent tracking.
// The app pushes scheduling data here via /sync; the scheduled function reads
// it to deliver pushes. This keeps the service self-contained (no Base44
// RLS-bypass needed from outside).
//
// @netlify/blobs v0 is a pure-ESM package, so it is imported as a normal static
// ESM import that Netlify's esbuild bundler resolves + bundles at deploy time
// (declared in this folder's package.json). A runtime require() does NOT work
// for pure-ESM deps. The app's Vite build never bundles this real dep -
// vite.config.js aliases @netlify/blobs to an inert stub (which also exports
// getStore) so the app build stays isolated from this standalone backend.

import { getStore } from "@netlify/blobs";

const REG_STORE = "nutriflow-registrations";
const SENT_STORE = "nutriflow-sent";

export async function saveRegistration(reg) {
  
}

export async function deleteRegistration(token) {
  
}

export async function listRegistrations() {
  
}

// Duplicate-prevention: record that a reminder occurrence (token+meal+date)
// has been sent so the next scheduler run skips it.
export async function markSent(token, meal, localDate) {
  
}

export async function isSent(token, meal, localDate) {
  
}
return regs;
}

// Duplicate-prevention: record that a reminder occurrence (token+meal+date)
// has been sent so the next scheduler run skips it.
export async function markSent(token, meal, localDate) {
  const store = getStore(SENT_STORE);
  await store.set(`${token}:${meal}:${localDate}`, "1");
}

export async function isSent(token, meal, localDate) {
  const store = getStore(SENT_STORE);
  const v = await store.get(`${token}:${meal}:${localDate}`);
  return !!v;
}
