import type { Metadata } from "next";
import BookingClient from "./BookingClient";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description: "Schedule your appointment online — fast, easy, and free.",
  robots: { index: true, follow: true },
};

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BookingClient slug={slug} />;
}
