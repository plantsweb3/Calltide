import AdminNav from "../_components/admin-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="ml-60 flex-1 p-6">{children}</main>
    </div>
  );
}
