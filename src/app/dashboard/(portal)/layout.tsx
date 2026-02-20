import ClientNav from "../_components/client-nav";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <ClientNav />
      <main className="ml-60 flex-1 p-6">{children}</main>
    </div>
  );
}
