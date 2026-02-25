import type { Metadata } from "next";
import { DM_Serif_Display, Outfit } from "next/font/google";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
        className={`${dmSerif.variable} ${outfit.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
