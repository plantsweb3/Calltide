export function projectBreachDate(
  currentUsage: number,
  monthlyLimit: number,
  dayOfMonth: number,
  growthRate: number = 0,
): Date | null {
  if (monthlyLimit === 0 || !isFinite(monthlyLimit)) return null;
  const remainingCapacity = monthlyLimit - currentUsage;
  if (remainingCapacity <= 0) return new Date(); // Already breached

  const dailyUsage = currentUsage / Math.max(dayOfMonth, 1);
  const projectedDailyUsage = dailyUsage * (1 + growthRate);
  if (projectedDailyUsage <= 0) return null;

  const daysUntilBreach = remainingCapacity / projectedDailyUsage;
  if (daysUntilBreach > 365) return null;

  const breachDate = new Date();
  breachDate.setDate(breachDate.getDate() + Math.floor(daysUntilBreach));
  return breachDate;
}

export function estimatePeakConcurrent(
  activeClients: number,
  callsPerClientPerDay: number = 10,
  avgCallDurationMin: number = 2.5,
  peakMultiplier: number = 3,
): number {
  const callsPerDay = activeClients * callsPerClientPerDay;
  // Calls concentrated in ~12 business hours
  const callsPerBusinessHour = callsPerDay / 12;
  const avgConcurrent = (callsPerBusinessHour / 60) * avgCallDurationMin;
  return Math.ceil(avgConcurrent * peakMultiplier);
}

export function estimateMonthlyCost(activeClients: number): {
  elevenlabs: number;
  anthropic: number;
  twilio: number;
  turso: number;
  vercel: number;
  total: number;
} {
  const callsPerMonth = activeClients * 10 * 30; // 10 calls/client/day
  const minutesPerMonth = callsPerMonth * 2.5; // 2.5 min avg

  const elevenlabs = Math.round(callsPerMonth * 8); // ~$0.08/call avg (ElevenLabs per-conversation pricing)
  const anthropic = Math.round(callsPerMonth * 3); // $0.03/call = 3 cents
  const twilio = Math.round(minutesPerMonth * 1.3 + callsPerMonth * 0.5); // voice + SMS
  const turso = activeClients <= 50 ? 500 : activeClients <= 500 ? 2900 : 9900; // plan tiers
  const vercel = activeClients <= 50 ? 0 : 2000;

  return {
    elevenlabs,
    anthropic,
    twilio,
    turso,
    vercel,
    total: elevenlabs + anthropic + twilio + turso + vercel,
  };
}
