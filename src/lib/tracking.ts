/**
 * Client-side analytics/tracking helpers.
 * All functions are safe to call regardless of whether the pixel/tag is loaded —
 * they silently no-op when the global isn't present.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
  }
}

// ── Meta Pixel ──

function fbq(...args: any[]) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(...args);
  }
}

// ── Google Analytics / Google Ads ──

function gtag(...args: any[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

// ── Public API ──

/** Fire on every page view (called by TrackingScripts on route change). */
export function trackPageView(url: string) {
  fbq("track", "PageView");
  gtag("event", "page_view", { page_path: url });
}

/** Fire when a user clicks a CTA (signup, book demo, call). */
export function trackLead(label?: string) {
  fbq("track", "Lead", label ? { content_name: label } : undefined);
  gtag("event", "generate_lead", { event_label: label });
}

/** Fire when a user views the pricing page. */
export function trackViewContent(contentName?: string) {
  fbq("track", "ViewContent", { content_name: contentName ?? "pricing" });
  gtag("event", "view_item", { items: [{ item_name: contentName ?? "pricing" }] });
}

/** Fire when a user completes onboarding (step 9). */
export function trackCompleteRegistration() {
  fbq("track", "CompleteRegistration");
  gtag("event", "sign_up", { method: "onboarding" });

  // Google Ads conversion (if configured)
  const gadsId = process.env.NEXT_PUBLIC_GADS_ID;
  const gadsOnboardingLabel = process.env.NEXT_PUBLIC_GADS_ONBOARDING_LABEL;
  if (gadsId && gadsOnboardingLabel) {
    gtag("event", "conversion", {
      send_to: `${gadsId}/${gadsOnboardingLabel}`,
    });
  }
}

/** Fire when a Stripe subscription is created (called from success page). */
export function trackPurchase(value?: number, currency?: string) {
  fbq("track", "Purchase", { value: value ?? 497, currency: currency ?? "USD" });
  gtag("event", "purchase", {
    value: value ?? 497,
    currency: currency ?? "USD",
  });

  // Google Ads conversion (if configured)
  const gadsId = process.env.NEXT_PUBLIC_GADS_ID;
  const gadsSubscriptionLabel = process.env.NEXT_PUBLIC_GADS_SUBSCRIPTION_LABEL;
  if (gadsId && gadsSubscriptionLabel) {
    gtag("event", "conversion", {
      send_to: `${gadsId}/${gadsSubscriptionLabel}`,
      value: value ?? 497,
      currency: currency ?? "USD",
    });
  }
}
