// Scheduled reminder sender — runs every 5 minutes (UTC) via the Netlify
// cron schedule in netlify.toml. Can also be triggered manually at /send-reminders.

import {
  listRegistrations,
  markSent,
  isSent,
  deleteRegistration,
} from "../lib/blobs.js";
import { sendPush, isInvalidTokenError } from "../lib/fcm-admin.js";
import { getMealMessage } from "../lib/messages.js";
import { getLocalParts, timeToMinutes } from "../lib/time.js";
import { json } from "../lib/cors.js";

const WINDOW_MINUTES = 5; // cron runs every 5 min — send within this window

export default async function () {
  const results = { checked: 0, sent: 0, failed: 0, skipped: 0, pruned: 0 };

  let regs = [];
  try {
    regs = await listRegistrations();
  } catch (err) {
    return json({ ok: false, error: "Blobs read failed: " + err.message }, 500);
  }

  results.checked = regs.length;

  for (const reg of regs) {
    if (!reg.enabled || reg.invalid) {
      results.skipped++;
      continue;
    }

    const local = getLocalParts(reg.timezone);

    for (const [meal, timeStr] of Object.entries(reg.reminder_times || {})) {
      const target = timeToMinutes(timeStr);
      if (target === null) continue;

      // Is the user's local time within the send window for this reminder?
      if (local.minutesOfDay < target || local.minutesOfDay >= target + WINDOW_MINUTES) {
        continue;
      }

      // Already sent this occurrence? (duplicate prevention)
      if (await isSent(reg.token, meal, local.date)) {
        results.skipped++;
        continue;
      }

      try {
        await sendPush(reg.token, {
          title: "NutriFlow 🍽️",
          body: getMealMessage(meal),
          data: { meal, url: "/log" },
        });
        await markSent(reg.token, meal, local.date);
        results.sent++;
      } catch (err) {
        results.failed++;
        if (isInvalidTokenError(err)) {
          await deleteRegistration(reg.token);
          results.pruned++;
        }
      }
    }
  }

  return json({ ok: true, results });
}
