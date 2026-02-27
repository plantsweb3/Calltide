export const PROVIDER_LIMITS = {
  hume: {
    planName: "Pro",
    concurrentLimit: 10,
    monthlyMinutes: 1200,
    costPerOverageMinute: 0.06,
  },
  anthropic: {
    tier: 2,
    rpmLimit: 1000,
    itpmLimit: 80000,
    otpmLimit: 16000,
    monthlySpendLimit: 50000, // cents ($500)
  },
  turso: {
    planName: "Developer",
    rowReadLimit: 2_500_000_000,
    rowWriteLimit: 10_000_000,
    storageLimitMb: 5000,
  },
  vercel: {
    planName: "Pro",
    gbHourLimit: 1000,
    bandwidthLimitGb: 1000,
    concurrentExecutionLimit: 30000,
  },
  twilio: {
    planName: "Pay-as-you-go",
    // Twilio doesn't have hard caps, but track usage
  },
};

export const TIER_THRESHOLDS = {
  seed: { min: 0, max: 50 },
  growth: { min: 51, max: 200 },
  scale: { min: 201, max: 500 },
  enterprise: { min: 501, max: 1000 },
  hypergrowth: { min: 1001, max: Infinity },
};

export function determineTier(activeClients: number): string {
  if (activeClients <= 50) return "seed";
  if (activeClients <= 200) return "growth";
  if (activeClients <= 500) return "scale";
  if (activeClients <= 1000) return "enterprise";
  return "hypergrowth";
}
