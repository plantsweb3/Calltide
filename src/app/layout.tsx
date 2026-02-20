import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Calltide — AI Receptionist for Small Businesses",
  description:
    "Bilingual AI receptionist that answers your phone in English and Spanish, 24/7. Books appointments. Texts you the details. Built in San Antonio, TX.",
  openGraph: {
    title: "Calltide — Never Miss a Call. In Any Language.",
    description:
      "AI receptionist that answers your phone in English and Spanish, 24/7. Books appointments. Texts you the details. Costs less than $17/day.",
    url: "https://calltide.com",
    siteName: "Calltide",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calltide — Never Miss a Call. In Any Language.",
    description:
      "AI receptionist that answers your phone in English and Spanish, 24/7. Books appointments. Costs less than $17/day.",
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
        className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
