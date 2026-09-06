import { AlertCircle, FileText } from "lucide-react";
import { PagesList } from "@/components/dashboard/pages-list";
import { getDashboardPages, type DashboardPage } from "@/features/pages/dashboard-queries";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function PagesWorkspace({ pages }: { pages: DashboardPage[] }) {
  return <main className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8">
    <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="space-y-2"><p className="text-sm font-medium text-primary">Content workspace</p><h1 className="text-3xl font-semibold tracking-tight">Pages</h1><p className="max-w-2xl text-muted-foreground">Manage the fixed public page set and monitor translation readiness.</p></div>
      <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground"><FileText className="size-4 text-primary" />{pages.length} public pages</div>
    </section>
    {pages.length ? <PagesList pages={pages} /> : <Card><CardContent className="flex flex-col items-center gap-2 p-12 text-center"><FileText className="size-8 text-muted-foreground" /><h2 className="font-medium">No pages configured</h2><p className="text-sm text-muted-foreground">The fixed public page identities are not available yet.</p></CardContent></Card>}
  </main>;
}

function PagesError({ error }: { error: unknown }) {
  return <main className="mx-auto w-full max-w-3xl p-4 md:p-8"><Card className="border-destructive/30"><CardContent className="flex flex-col items-center gap-3 p-12 text-center"><AlertCircle className="size-8 text-destructive" /><h1 className="font-semibold">Pages could not be loaded</h1><p className="text-sm text-muted-foreground">The content service is unavailable. Check the server configuration and try again.</p>{process.env.NODE_ENV === "development" && <p className="max-w-full break-all text-xs text-destructive">{error instanceof Error ? error.message : String(error)}</p>}</CardContent></Card></main>;
}

export default async function DashboardPagesPage() {
  let pages: DashboardPage[];
  try {
    pages = await getDashboardPages();
  } catch (error) {
    console.error("[dashboard/pages] Unable to load pages", error);
    return <PagesError error={error} />;
  }
  return <PagesWorkspace pages={pages} />;
}
