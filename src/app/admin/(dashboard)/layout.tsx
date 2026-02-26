import AdminNav from "../_components/admin-nav";
import ErrorBoundary from "@/components/error-boundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main
        className="ml-60 flex-1 p-6"
        style={{ background: "var(--db-bg)" }}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
