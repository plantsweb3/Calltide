import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Calltide — AI Receptionist for Home Service Businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Inter, sans-serif",
          position: "relative",
        }}
      >
        {/* Accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #C59A27, #E8C547)",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#22c55e",
            }}
          />
          <span style={{ color: "#94a3b8", fontSize: 18, letterSpacing: 2 }}>
            AI RECEPTIONIST
          </span>
        </div>

        {/* Logo text */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#C59A27",
            letterSpacing: -2,
            marginBottom: 16,
          }}
        >
          Calltide
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#f1f5f9",
            marginBottom: 12,
          }}
        >
          Every Call Answered. Every Job Booked.
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 20,
            color: "#94a3b8",
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Bilingual AI receptionist for home service businesses. 24/7 in English
          &amp; Spanish.
        </div>

        {/* Bottom features */}
        <div
          style={{
            display: "flex",
            gap: 32,
            marginTop: 40,
            color: "#64748b",
            fontSize: 16,
          }}
        >
          <span>24/7 Coverage</span>
          <span style={{ color: "#475569" }}>|</span>
          <span>Bilingual EN/ES</span>
          <span style={{ color: "#475569" }}>|</span>
          <span>Appointment Booking</span>
          <span style={{ color: "#475569" }}>|</span>
          <span>Emergency Detection</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
