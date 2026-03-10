"use client";

/**
 * Capta branded loading spinner.
 * Gold dot in the center with the navy C rotating around it.
 */
export default function CaptaSpinner({ size = 40, className = "" }: { size?: number; className?: string }) {
  const dotSize = size * 0.3;
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Gold dot — static center */}
      <div
        className="absolute rounded-full"
        style={{
          width: dotSize,
          height: dotSize,
          backgroundColor: "#C59A27",
        }}
      />
      {/* Navy C — rotates */}
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="animate-spin"
        style={{ animationDuration: "1.2s" }}
      >
        <path
          d="M82,50 A32,32 0 1,0 68,76"
          fill="none"
          stroke="#1B2A4A"
          strokeWidth="14"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/** Tiny inline spinner for buttons (inherits text color) */
export function CaptaSpinnerInline({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="animate-spin inline-block"
      style={{ animationDuration: "1.2s" }}
    >
      <circle cx="50" cy="50" r="12" fill="currentColor" opacity="0.4" />
      <path
        d="M82,50 A32,32 0 1,0 68,76"
        fill="none"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
      />
    </svg>
  );
}
