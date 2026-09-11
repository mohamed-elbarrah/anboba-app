import { AlertCircle } from "lucide-react";
import { requireAdmin } from "@/features/auth/session";
import { listMedia } from "@/features/media/queries";
import { getSiteSettings } from "@/features/settings/queries";
import { SiteSettingsEditor } from "@/features/settings/components/site-settings-editor";

type Section = "identity" | "header" | "menus" | "footer";
export async function AppearancePage({ section }: { section: Section }) {
  await requireAdmin();
  const [settings, media] = await Promise.all([getSiteSettings(), listMedia()]);
  if (!settings) return <main className="mx-auto w-full max-w-3xl p-4 md:p-8"><div className="rounded-lg border border-destructive/30 bg-card p-10 text-center"><AlertCircle className="mx-auto size-8 text-destructive" /><h1 className="mt-3 font-semibold">Settings are not initialized</h1><p className="mt-2 text-sm text-muted-foreground">Create the initial site settings revision before opening this editor.</p></div></main>;
  return <SiteSettingsEditor initial={settings} media={media} section={section} />;
}
