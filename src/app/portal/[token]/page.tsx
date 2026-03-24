import { redirect } from "next/navigation";
import { validatePortalToken } from "@/lib/portal/auth";
import { db } from "@/db";
import { appointments, estimates, invoices, leads } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PortalOverview({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await validatePortalToken(token);
  if (!result) redirect("/portal/expired");

  const { customer, business } = result;
  const today = new Date().toISOString().slice(0, 10);
  const basePath = `/portal/${token}`;

  // Get leads linked to customer phone
  const customerLeads = await db
    .select({ id: leads.id })
    .from(leads)
    .where(
      and(eq(leads.businessId, business.id), eq(leads.phone, customer.phone))
    );
  const leadIds = customerLeads.map((l) => l.id);

  // Upcoming appointments
  let upcomingAppointments: Array<{
    id: string;
    service: string;
    date: string;
    time: string;
    status: string;
  }> = [];
  if (leadIds.length > 0) {
    for (const leadId of leadIds) {
      const rows = await db
        .select({
          id: appointments.id,
          service: appointments.service,
          date: appointments.date,
          time: appointments.time,
          status: appointments.status,
        })
        .from(appointments)
        .where(
          and(
            eq(appointments.businessId, business.id),
            eq(appointments.leadId, leadId),
            gte(appointments.date, today)
          )
        )
        .limit(5);
      upcomingAppointments.push(...rows);
    }
    upcomingAppointments.sort((a, b) => a.date.localeCompare(b.date));
    upcomingAppointments = upcomingAppointments.slice(0, 5);
  }

  // Open estimates
  const openEstimates = await db
    .select({
      id: estimates.id,
      service: estimates.service,
      amount: estimates.amount,
      status: estimates.status,
      createdAt: estimates.createdAt,
    })
    .from(estimates)
    .where(
      and(eq(estimates.businessId, business.id), eq(estimates.customerId, customer.id))
    )
    .orderBy(desc(estimates.createdAt))
    .limit(50);

  const pendingEstimates = openEstimates.filter((e) =>
    ["new", "sent", "follow_up"].includes(e.status)
  );

  // Invoices
  const allInvoices = await db
    .select({
      id: invoices.id,
      amount: invoices.amount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .where(
      and(eq(invoices.businessId, business.id), eq(invoices.customerId, customer.id))
    )
    .orderBy(desc(invoices.createdAt))
    .limit(50);

  const outstandingInvoices = allInvoices.filter((i) =>
    ["pending", "sent", "overdue"].includes(i.status)
  );
  const outstandingTotal = outstandingInvoices.reduce(
    (sum, i) => sum + i.amount,
    0
  );

  // Build activity timeline from all data
  const timeline: Array<{
    id: string;
    type: "appointment" | "estimate" | "invoice";
    title: string;
    subtitle: string;
    date: string;
    status: string;
  }> = [];

  for (const apt of upcomingAppointments) {
    timeline.push({
      id: apt.id,
      type: "appointment",
      title: apt.service,
      subtitle: `${formatDate(apt.date)} at ${formatTime(apt.time)}`,
      date: apt.date,
      status: apt.status,
    });
  }

  for (const est of openEstimates.slice(0, 5)) {
    timeline.push({
      id: est.id,
      type: "estimate",
      title: est.service || "Estimate",
      subtitle: est.amount ? `$${est.amount.toFixed(2)}` : "Pending amount",
      date: est.createdAt,
      status: est.status,
    });
  }

  for (const inv of allInvoices.slice(0, 5)) {
    timeline.push({
      id: inv.id,
      type: "invoice",
      title: `Invoice — $${inv.amount.toFixed(2)}`,
      subtitle: inv.dueDate ? `Due ${formatDate(inv.dueDate)}` : "No due date",
      date: inv.createdAt,
      status: inv.status,
    });
  }

  timeline.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Welcome back, {customer.name || "there"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Here is an overview of your account with {business.name}.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          href={`${basePath}/appointments`}
          label="Upcoming Appointments"
          value={String(upcomingAppointments.filter((a) => a.status !== "cancelled").length)}
          color="blue"
        />
        <SummaryCard
          href={`${basePath}/estimates`}
          label="Pending Estimates"
          value={String(pendingEstimates.length)}
          color="amber"
        />
        <SummaryCard
          href={`${basePath}/invoices`}
          label="Outstanding Balance"
          value={`$${outstandingTotal.toFixed(2)}`}
          color={outstandingTotal > 0 ? "red" : "green"}
        />
      </div>

      {/* Recent Activity */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Recent Activity
            </h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {timeline.slice(0, 8).map((item) => (
              <li key={`${item.type}-${item.id}`} className="px-5 py-3.5 flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.type === "appointment"
                      ? "bg-blue-50 text-blue-600"
                      : item.type === "estimate"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-green-50 text-green-600"
                  }`}
                >
                  {item.type === "appointment" ? (
                    <CalendarIcon />
                  ) : item.type === "estimate" ? (
                    <FileIcon />
                  ) : (
                    <DollarIcon />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">{item.subtitle}</p>
                </div>
                <StatusBadge status={item.status} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {timeline.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-500 text-sm">
            No recent activity to display.
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  href,
  label,
  value,
  color,
}: {
  href: string;
  label: string;
  value: string;
  color: "blue" | "amber" | "red" | "green";
}) {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    red: "bg-red-50 border-red-100 text-red-700",
    green: "bg-green-50 border-green-100 text-green-700",
  };

  const valueBg = {
    blue: "text-blue-900",
    amber: "text-amber-900",
    red: "text-red-900",
    green: "text-green-900",
  };

  return (
    <Link
      href={href}
      className={`block rounded-xl border p-5 transition-shadow hover:shadow-md ${colors[color]}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${valueBg[color]}`}>{value}</p>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
    no_show: "bg-red-100 text-red-700",
    paid: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    sent: "bg-blue-100 text-blue-700",
    overdue: "bg-red-100 text-red-700",
    new: "bg-blue-100 text-blue-700",
    won: "bg-green-100 text-green-700",
    lost: "bg-gray-100 text-gray-500",
    expired: "bg-gray-100 text-gray-500",
    follow_up: "bg-amber-100 text-amber-700",
  };

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatTime(time: string): string {
  try {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display}:${m} ${ampm}`;
  } catch {
    return time;
  }
}

function CalendarIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
