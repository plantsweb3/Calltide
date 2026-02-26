import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Calltide — The Front Office for Your Business",
  description:
    "AI receptionist that answers your phone in English and Spanish, 24/7. Books appointments. Texts you the details. Built for service businesses.",
  openGraph: {
    title: "Calltide — Every Call Answered. Every Job Booked.",
    description:
      "AI receptionist that answers your phone in English and Spanish, 24/7. Books appointments. Texts you the details. Less than $17/day.",
    url: "https://calltide.app",
    siteName: "Calltide",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://calltide.app/images/og.png",
        width: 1200,
        height: 630,
        alt: "Calltide — AI Receptionist for Service Businesses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Calltide — Every Call Answered. Every Job Booked.",
    description:
      "AI receptionist that answers your phone in English and Spanish, 24/7. Books appointments. Less than $17/day.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
