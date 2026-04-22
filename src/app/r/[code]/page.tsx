import { db } from "@/db";
import { businesses, referrals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ReferralPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Look up the business with this referral code
  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.referralCode, code))
    .limit(1);

  if (business) {
    // Create a pending referral record
    await db.insert(referrals).values({
      referrerBusinessId: business.id,
      referralCode: code,
      status: "pending",
    });

    redirect(`/setup?ref=${code}`);
  }

  // Invalid referral code — show friendly fallback
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#E2E8F0] bg-white p-8 text-center sm:p-10"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)" }}
      >
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: "#F5E6BC" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d97706"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1
          className="mt-6 text-xl font-extrabold tracking-tight"
          style={{ color: "#0F1729" }}
        >
          This referral link is no longer valid
        </h1>

        <p className="mt-3 text-sm leading-relaxed" style={{ color: "#666" }}>
          The referral code may have expired or is no longer active. You can
          still check out Capta and get started for free.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/setup"
            className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#C59A27" }}
          >
            Get Capta &rarr;
          </Link>
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:underline"
            style={{ color: "#666" }}
          >
            Go to Capta
          </Link>
        </div>
      </div>
    </div>
  );
}
