export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="dark" style={{ background: "var(--db-bg)", color: "var(--db-text)" }} className="min-h-screen">
      {children}
    </div>
  );
}
