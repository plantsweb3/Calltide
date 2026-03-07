import { redirect } from "next/navigation";

// Temporary redirect until the full setup "hiring flow" page is built.
// All marketing links now point to /setup instead of /audit.
export default function SetupPage() {
  redirect("/#signup");
}
