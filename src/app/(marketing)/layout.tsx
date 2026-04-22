/**
 * Marketing group layout.
 *
 * Each Client page renders its own industrial Nav + Footer, so this
 * layout is intentionally bare — wrapping in a Nav/Footer here double-
 * mounts them on every page.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
