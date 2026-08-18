// Varied meal-reminder messages (mirrors src/lib/notificationMessages.js).
// Kept in the standalone function so message copy stays consistent.

const POOLS = {
  breakfast: [
    "Rise and dine! 🌅 Log your breakfast to kick off today's fuel.",
    "Morning! Your metabolism's awake — is your food log? 🥣",
    "Breakfast time! Log it before the day sweeps you away. ☀️",
    "Good morning! Don't forget to log what fuels your morning. 🍳",
    "Fuel first, conquer later! Log your breakfast 🥞",
  ],
  lunch: [
    "Lunch break! 🥗 Log what you're having — it takes 5 seconds.",
    "Midday fuel check! Log your lunch to keep your streak alive. 🍽️",
    "Lunchtime! Your protein goal is waiting. Log it now! 💪",
    "Pause, eat, log. Your lunch matters! 🌯",
    "Lunch o'clock! Log your meal and keep the momentum going. 🍛",
  ],
  dinner: [
    "Dinner time! 🍲 Log your evening meal before you forget.",
    "End the day right — log your dinner! 🌆",
    "Evening fuel! Log what's on your plate tonight. 🍝",
    "Wind down and log your dinner. You've earned it! 🌙",
    "Dinner's served! Log it to complete your day's picture. 🍖",
  ],
  snack: [
    "Snack alert! 🍎 Log that bite — every calorie counts.",
    "Quick snack? Log it in seconds! ⏱️",
    "Did you grab a snack? Don't forget to log it! 🥜",
    "Snack time! Log it to keep your tracking streak going. 🍿",
    "Munching something? Log it quick! 🍪",
  ],
};

export function getMealMessage(meal) {
  const pool = POOLS[meal] || POOLS.lunch;
  return pool[Math.floor(Math.random() * pool.length)];
}
