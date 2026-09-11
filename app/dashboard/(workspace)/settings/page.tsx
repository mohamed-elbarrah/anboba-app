import { redirect } from "next/navigation";

/** Compatibility URL retained for bookmarks; appearance is now split into focused pages. */
export default function SettingsPage() {
  redirect("/dashboard/appearance/site-identity");
}
