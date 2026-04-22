export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="dark"
      style={{ background: "var(--db-bg)", color: "var(--db-text)" }}
      className="min-h-screen"
    >
      {/* God-mode signal strip — a thin amber bar across the top so admin
          pages visually differ from the client dashboard at a glance. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "var(--db-accent, #D4A843)",
          zIndex: 100,
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}
