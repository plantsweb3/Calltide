/**
 * Sample Stripe webhook event payloads for testing.
 * These mirror the 7 event types the system handles.
 */

export function makeStripeEvent(
  type: string,
  data: Record<string, unknown>,
  id = `evt_test_${Date.now()}`,
) {
  return {
    id,
    type,
    data: { object: data },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    api_version: "2025-04-30.basil",
  };
}

export const paymentSucceededInvoice = {
  id: "in_test_succeeded",
  customer: "cus_test_active",
  amount_paid: 49700,
  currency: "usd",
  status: "paid",
};

export const paymentFailedInvoice = {
  id: "in_test_failed",
  customer: "cus_test_active",
  amount_due: 49700,
  currency: "usd",
  status: "open",
  charge: {
    failure_code: "card_declined",
    failure_message: "Your card was declined.",
  },
};

export const checkoutSession = {
  id: "cs_test_completed",
  customer: "cus_test_new",
  subscription: "sub_test_new",
  customer_email: "new@customer.com",
  metadata: { email: "new@customer.com" },
};

export const subscriptionCreated = {
  id: "sub_test_created",
  customer: "cus_test_active",
  status: "active",
};

export const subscriptionUpdated = {
  id: "sub_test_updated",
  customer: "cus_test_active",
  status: "active",
  current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
};

export const subscriptionDeleted = {
  id: "sub_test_deleted",
  customer: "cus_test_active",
  status: "canceled",
};

export const chargeRefunded = {
  id: "ch_test_refunded",
  customer: "cus_test_active",
  amount_refunded: 49700,
  currency: "usd",
};
