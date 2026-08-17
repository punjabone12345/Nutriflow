# NutriFlow Push Reminders — Standalone Netlify Function

Standalone Netlify scheduled function that sends FCM Web Push meal reminders to
NutriFlow users. Deploy this folder as **its own Netlify site** (separate from
your Base44-hosted NutriFlow frontend). No GitHub required.

---

## What this does

- `/sync` (POST) — the NutriFlow app calls this when push is enabled/updated to
  register the user's FCM token, reminder times, and IANA timezone.
- `/unregister` (POST) — removes a token when the user turns push off.
- `/test-push` (POST) — sends a real push through Firebase Admin (the same
  pathway real reminders use) so you can verify end-to-end delivery.
- `send-reminders` (scheduled, every 5 min) — reads all registrations, computes
  each user's local time via their stored timezone, sends due reminders, and
  prevents duplicates.

Data is stored in **Netlify Blobs** (key-value store built into Netlify
Functions). The NutriFlow Base44 database remains the source of truth; this
service keeps a lightweight scheduling mirror in Blobs.

> Why Blobs instead of querying Base44 directly? Reading ALL users' reminder
> data from outside Base44 requires bypassing Row-Level Security, which is only
> available inside Base44-hosted backend functions (a Builder+ feature you
> chose to avoid). Syncing the needed scheduling fields into the function's own
> Blobs keeps this path free of Builder+.

---

## 1. Firebase server credentials (secret)

In the **Firebase Console**:
1. Project settings → **Service accounts** tab → **Generate new private key**.
2. Open the downloaded JSON. You need three values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

These are **server-only secrets**. Never put them in the Base44 frontend.

---

## 2. Netlify environment variables

In your Netlify site for this function → **Site settings → Environment
variables**, add:

| Variable | Public/Secret | Value |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Secret | from the service-account JSON |
| `FIREBASE_CLIENT_EMAIL` | Secret | from the service-account JSON |
| `FIREBASE_PRIVATE_KEY` | Secret | from the JSON, **keep the `\n` escapes and wrap in double quotes** |
| `AUTH_SECRET` | Secret (**required**) | any random string; **MUST** be set — `/sync`, `/unregister` and `/test-push` reject every request when it is unset. Put the same value in `reminderFunctionSecret` in `src/lib/firebaseConfig.js`. |

`FIREBASE_PRIVATE_KEY` example:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

---

## 3. Deploy to Netlify (no GitHub)

Install the Netlify CLI once:
```bash
npm install -g netlify-cli
```

Then from **this folder** (`netlify-push-reminders`):

```bash
# 1. log in (opens browser, no GitHub needed)
netlify login

# 2. create a new site linked to this folder
netlify sites:create --name nutriflow-reminders

# 3. set the site as the current site for this folder
netlify link

# 4. add the environment variables (from step 2) in the dashboard, OR:
netlify env:set FIREBASE_PROJECT_ID "your-project-id"
netlify env:set FIREBASE_CLIENT_EMAIL "firebase-adminsdk-xxxx@your-project.iam.gserviceaccount.com"
netlify env:set FIREBASE_PRIVATE_KEY "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
netlify env:set AUTH_SECRET "some-random-string"   # REQUIRED — mutating endpoints reject requests without it

# 5. deploy the functions
netlify deploy --build --prod
```

After deploy, your function base URL is something like
`https://nutriflow-reminders.netlify.app`.

> The scheduled function (`send-reminders`) is activated by the
> `[functions.send-reminders] schedule` line in `netlify.toml`. Scheduled
> functions run on **paid Netlify plans** (Starter+). On the free plan the
> schedule is ignored, but you can still trigger `send-reminders` manually via
> its HTTP URL for testing. See "Limitations" below.

---

## 4. Point the app at the function

In your Base44 app, edit `src/lib/firebaseConfig.js`:
- Set `reminderFunctionUrl` to your deployed function URL
  (e.g. `https://nutriflow-reminders.netlify.app`).
- If you set `AUTH_SECRET`, put the same value in `reminderFunctionSecret`.
- Put your Firebase Web config + VAPID public key in the same file.
- Put the **same** firebaseConfig values into `public/firebase-messaging-sw.js`
  (the service worker can't import the app's config file).

---

## Security

- `/sync`, `/unregister`, and `/test-push` are gated by the shared secret `AUTH_SECRET`. **If `AUTH_SECRET` is not set on the function, all three reject every request (fail-closed)** — an unauthenticated person cannot create, overwrite, or delete another user's push registration or reminders.
- Registrations are keyed by the device's FCM token, a long, per-device, unguessable value known only to that browser and Firebase. Even with the shared secret, an attacker cannot target a specific victim's reminders without that victim's token.
- The same secret is set as `reminderFunctionSecret` in `src/lib/firebaseConfig.js` so the app's requests carry it in the `x-auth-secret` header.
- `/send-reminders` (the scheduled function) is intentionally callable without auth for manual testing — it only sends reminders that are already due (idempotent and duplicate-guarded) and cannot mutate registrations.

## 5. How the function accesses reminder data

The app pushes scheduling data to the function via `/sync`:
```json
{ "user_id": "...", "token": "fcm-token", "reminder_times": {"breakfast":"08:00",...}, "timezone": "Asia/Kolkata", "enabled": true }
```
The function stores this in Netlify Blobs keyed by token. The scheduler reads
all registrations from Blobs, converts UTC now → the user's local time using
their `timezone`, and sends reminders whose local time falls in the current
5-minute window. Sent occurrences are recorded in a separate Blobs store
(keyed `token:meal:date`) so they aren't re-sent on the next run.

---

## 6. Test the closed-app flow

1. Deploy the function (step 3) and configure the app (step 4).
2. On your phone/desktop, open NutriFlow, go to **Profile → Meal Reminders**.
3. Turn on **Closed-app push**. Confirm the browser permission prompt.
4. Tap **Send test push** — a real push arrives via Firebase Admin (the
   notification appears even if you background/close the tab).
5. Set a meal reminder time 5–10 minutes ahead. Close the tab/app entirely.
6. Within ~5 minutes you should receive the push (the scheduler runs every
   5 min, so delivery is within ~5 min of the configured time).

You can also run the scheduler manually to test immediately:
```bash
curl -X POST https://nutriflow-reminders.netlify.app/send-reminders
# or, if AUTH_SECRET is set:
curl -X POST -H "x-auth-secret: YOUR_SECRET" https://nutriflow-reminders.netlify.app/send-reminders
```
The response is `{ "ok": true, "results": { "checked": N, "sent": N, ... } }`.

---

## 7. Manual test of /test-push

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"token":"YOUR_FCM_TOKEN"}' \
  https://nutriflow-reminders.netlify.app/test-push
```
Add `-H "x-auth-secret: ..."` if you set `AUTH_SECRET`.

---

## Limitations

- **Scheduled functions require a paid Netlify plan (Starter+).** On the free
  plan the cron schedule is ignored — `/test-push` and manual
  `/send-reminders` still work, but automatic closed-app reminders won't fire
  on their own.
- **Delivery timing is approximate.** The scheduler runs every 5 minutes, so a
  reminder set for 08:00 IST is delivered within ~5 minutes of 08:00, not to
  the exact minute.
- **Service Worker + HTTPS required.** Web Push needs HTTPS (Base44 provides
  this) and the registered service worker. iOS Safari requires the PWA to be
  installed to the Home Screen before it can receive push.
- **Data-only messages.** Pushes are sent data-only so the service worker
  builds the visible notification with the correct click URL. If the SW is not
  registered, no visible notification appears.
