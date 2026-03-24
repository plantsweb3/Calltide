import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Link Expired | Customer Portal",
};

export default function PortalExpired() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-[var(--font-inter)]">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-12 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Portal Link Expired
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          This customer portal link is no longer valid. It may have expired or
          been revoked. Please contact your service provider to request a new
          link.
        </p>
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Powered by{" "}
            <a
              href="https://captahq.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D4A843] hover:text-[#c49a38] font-medium"
            >
              Capta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
