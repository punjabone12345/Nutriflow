// Timezone helpers — compute a user's local time from UTC using their IANA zone.

// Returns { date: "YYYY-MM-DD", minutesOfDay: number } in the given timezone.
export function getLocalParts(timezone) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone || "UTC",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now);

  const map = {};
  for (const p of parts) map[p.type] = p.value;

  const hour = parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    minutesOfDay: hour * 60 + minute,
  };
}

// Parse "HH:MM" → minutes of day.
export function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}