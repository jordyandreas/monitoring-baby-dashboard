export type TimeOfDayGreeting = {
  message: string;
  emoji: string;
};

/** Greeting label and emoji based on local hour (browser timezone). */
export function getTimeOfDayGreeting(date: Date): TimeOfDayGreeting {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return { message: "Good Morning", emoji: "☀️" };
  }
  if (hour >= 12 && hour < 17) {
    return { message: "Good Afternoon", emoji: "🌤️" };
  }
  if (hour >= 17 && hour < 21) {
    return { message: "Good Evening", emoji: "🌙" };
  }
  return { message: "Good Night", emoji: "✨" };
}

/** e.g. "09:41 PM • Monday" in the user's locale and timezone. */
export function formatLiveClockLine(date: Date, locale?: string): string {
  const time = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  const day = new Intl.DateTimeFormat(locale, {
    weekday: "long",
  }).format(date);

  return `${time} • ${day}`;
}
