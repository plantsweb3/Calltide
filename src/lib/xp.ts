// XP system for Founder HQ gamification

// Points per touch type
export function computeTouchXp(channel: string, outcome: string): number {
  let xp = 0;

  // Base XP by channel
  if (channel === "call" || channel === "sms") {
    xp = 3;
  } else {
    // email, dm, walk_in
    xp = 1;
  }

  // Bonus XP by outcome
  if (outcome === "circle_back") xp += 2;
  if (outcome === "booked_demo") xp += 10;
  if (outcome === "onboarded") xp += 25;

  return xp;
}

// Level thresholds based on active customer count
const LEVEL_THRESHOLDS = [
  { level: 100, customers: 100 },
  { level: 50, customers: 50 },
  { level: 25, customers: 25 },
  { level: 10, customers: 10 },
  { level: 5, customers: 5 },
  { level: 1, customers: 0 },
] as const;

export function computeLevel(activeCustomers: number): {
  level: number;
  nextLevelAt: number;
} {
  for (const t of LEVEL_THRESHOLDS) {
    if (activeCustomers >= t.customers) {
      // Find the next threshold
      const idx = LEVEL_THRESHOLDS.indexOf(t);
      const nextThreshold = idx > 0 ? LEVEL_THRESHOLDS[idx - 1] : null;
      return {
        level: t.level,
        nextLevelAt: nextThreshold ? nextThreshold.customers : t.customers,
      };
    }
  }
  return { level: 1, nextLevelAt: 5 };
}

// Streak logic — weekends don't break streaks
function isWeekday(dateStr: string): boolean {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  return day !== 0 && day !== 6; // 0=Sun, 6=Sat
}

// Get the previous weekday (skipping Sat/Sun) from a YYYY-MM-DD string
function previousWeekday(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  do {
    d.setDate(d.getDate() - 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return d.toISOString().slice(0, 10);
}

export function computeStreakUpdate(
  lastHitDate: string | null,
  currentStreak: number,
  longestStreak: number,
  todayStr: string
): { currentStreak: number; longestStreak: number; lastHitDate: string } {
  // Already hit today
  if (lastHitDate === todayStr) {
    return { currentStreak, longestStreak, lastHitDate: todayStr };
  }

  // If today is a weekend, don't update streak (weekend pause)
  if (!isWeekday(todayStr)) {
    return { currentStreak, longestStreak, lastHitDate: lastHitDate ?? todayStr };
  }

  const prevWeekday = previousWeekday(todayStr);

  if (lastHitDate === prevWeekday) {
    // Consecutive weekday — extend streak
    const newStreak = currentStreak + 1;
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
      lastHitDate: todayStr,
    };
  }

  // Gap (missed weekday) — reset to 1
  return {
    currentStreak: 1,
    longestStreak: Math.max(longestStreak, 1),
    lastHitDate: todayStr,
  };
}
