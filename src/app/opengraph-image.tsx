import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Capta — AI Receptionist for Home Service Businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#F8FAFC",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top gold stripe */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "#D4A843",
          }}
        />

        {/* Kicker */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#D4A843",
            }}
          />
          <span
            style={{
              color: "#1B2A4A",
              fontSize: 20,
              letterSpacing: 3.6,
              textTransform: "uppercase",
              fontWeight: 800,
            }}
          >
            AI Receptionist · Bilingual 24/7
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 1040 }}>
          <div
            style={{
              fontSize: 108,
              fontWeight: 900,
              color: "#0F1729",
              letterSpacing: -4,
              lineHeight: 0.92,
            }}
          >
            Never miss a
          </div>
          <div
            style={{
              fontSize: 108,
              fontWeight: 900,
              color: "#0F1729",
              letterSpacing: -4,
              lineHeight: 0.92,
            }}
          >
            call <span style={{ color: "#D4A843" }}>again.</span>
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderTop: "1px solid #E2E8F0",
            paddingTop: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                color: "#1B2A4A",
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: -0.5,
              }}
            >
              Capta
            </div>
            <div
              style={{
                fontSize: 18,
                color: "#475569",
                fontWeight: 600,
              }}
            >
              Unlimited bilingual calls · 14-day free trial · Flat rate
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              color: "#0F1729",
            }}
          >
            <span style={{ fontSize: 64, fontWeight: 900, letterSpacing: -2 }}>$497</span>
            <span style={{ fontSize: 22, color: "#475569", fontWeight: 600 }}>/mo</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
