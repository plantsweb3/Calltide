import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, customers, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { sendSMS } from "@/lib/twilio/sms";
import { getStripe } from "@/lib/stripe/client";

/**
 * POST /api/dashboard/invoices/[id]/send
 * Send invoice to customer via SMS with a Stripe payment link.
 * Generates a payment link if one doesn't exist yet.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-invoice-send:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const { id } = await params;

  try {
    // Fetch invoice with customer and business info
    const [row] = await db
      .select({
        invoice: invoices,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerEmail: customers.email,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(eq(invoices.id, id), eq(invoices.businessId, businessId)))
      .limit(1);

    if (!row) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const invoice = row.invoice;

    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 });
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json({ error: "Cannot send a cancelled invoice" }, { status: 400 });
    }

    if (!row.customerPhone) {
      return NextResponse.json({ error: "Customer has no phone number on file" }, { status: 400 });
    }

    // Get business info for SMS
    const [biz] = await db
      .select({
        name: businesses.name,
        twilioNumber: businesses.twilioNumber,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    // Generate Stripe payment link if not already set
    let paymentUrl = invoice.paymentLinkUrl;
    let stripePaymentLinkId = invoice.stripePaymentLinkId;

    if (!paymentUrl) {
      try {
        const stripe = getStripe();
        const amountCents = Math.round(invoice.amount * 100);
        const invoiceLabel = invoice.invoiceNumber || `Invoice #${id.slice(0, 8)}`;

        const paymentLink = await stripe.paymentLinks.create({
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: invoiceLabel,
                  description: `Payment to ${biz.name}`,
                },
                unit_amount: amountCents,
              },
              quantity: 1,
            },
          ],
          metadata: {
            invoiceId: id,
            businessId,
          },
        });

        paymentUrl = paymentLink.url;
        stripePaymentLinkId = paymentLink.id;
      } catch (stripeError) {
        reportError("Failed to create Stripe payment link", stripeError, { businessId });
        return NextResponse.json({
          error: "Failed to generate payment link. Please check your Stripe configuration.",
        }, { status: 500 });
      }
    }

    // Format amount for SMS
    const formattedAmount = `$${invoice.amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    const customerFirstName = row.customerName?.split(" ")[0] || "there";
    const message = `Hi ${customerFirstName}, your invoice from ${biz.name} for ${formattedAmount} is ready. Pay here: ${paymentUrl}`;

    // Send SMS
    const smsResult = await sendSMS({
      to: row.customerPhone,
      from: biz.twilioNumber,
      body: message,
      businessId,
      templateType: "invoice_send",
    });

    if (!smsResult.success) {
      return NextResponse.json({
        error: "Failed to send SMS. Invoice saved but message not delivered.",
      }, { status: 500 });
    }

    // Update invoice status and record SMS
    const now = new Date().toISOString();
    await db
      .update(invoices)
      .set({
        status: invoice.status === "pending" ? "sent" : invoice.status,
        paymentLinkUrl: paymentUrl,
        stripePaymentLinkId,
        smsSentAt: now,
        reminderCount: (invoice.reminderCount || 0) + 1,
        lastReminderAt: now,
        updatedAt: now,
      })
      .where(and(eq(invoices.id, id), eq(invoices.businessId, businessId)));

    return NextResponse.json({
      success: true,
      paymentUrl,
      message: "Invoice sent to customer via SMS",
    });
  } catch (error) {
    reportError("Failed to send invoice", error, { businessId });
    return NextResponse.json({ error: "Failed to send invoice" }, { status: 500 });
  }
}
