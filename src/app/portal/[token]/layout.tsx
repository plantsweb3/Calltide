import { redirect } from "next/navigation";
import { validatePortalToken } from "@/lib/portal/auth";
import { PortalShell } from "./portal-shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await validatePortalToken(token);
  if (!result) {
    return { title: "Customer Portal | Capta" };
  }
  return {
    title: `${result.business.name} — Customer Portal | Powered by Capta`,
    description: `View your appointments, estimates, and invoices with ${result.business.name}`,
  };
}

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await validatePortalToken(token);

  if (!result) {
    redirect("/portal/expired");
  }

  const { customer, business } = result;

  return (
    <PortalShell
      token={token}
      customerName={customer.name || "Customer"}
      businessName={business.name}
      businessType={business.type}
    >
      {children}
    </PortalShell>
  );
}
