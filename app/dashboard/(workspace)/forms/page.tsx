import { AlertCircle, Braces } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FormsList } from "@/components/dashboard/forms-list";
import { getFormInventory, type FormInventory } from "@/features/forms/queries";

export const dynamic = "force-dynamic";

function FormsError({ error }: { error: unknown }) {
  return <Card className="border-destructive/30"><CardContent className="flex flex-col items-center gap-3 p-12 text-center"><AlertCircle className="size-8 text-destructive" /><h2 className="font-semibold">Forms could not be loaded</h2><p className="text-sm text-muted-foreground">The form inventory service is unavailable. Check the server configuration and try again.</p>{process.env.NODE_ENV === "development" && <p className="max-w-full break-all text-xs text-destructive">{error instanceof Error ? error.message : String(error)}</p>}</CardContent></Card>;
}

export default async function DashboardFormsPage() {
  let forms: FormInventory[];
  try {
    forms = await getFormInventory();
  } catch (error) {
    console.error("[dashboard/forms] Unable to load form inventory", error);
    return <main className="mx-auto w-full max-w-7xl p-4 md:p-8"><FormsError error={error} /></main>;
  }

  return <main className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8">
    <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="space-y-2"><p className="text-sm font-medium text-primary">Content workspace</p><h1 className="text-3xl font-semibold tracking-tight">Forms</h1><p className="max-w-2xl text-muted-foreground">Inventory of the three system forms connected to the public site.</p></div><div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground"><Braces className="size-4 text-primary" />{forms.length} system forms</div></section>
    {forms.length ? <FormsList forms={forms} /> : <Card><CardContent className="flex flex-col items-center gap-2 p-12 text-center"><Braces className="size-8 text-muted-foreground" /><h2 className="font-medium">No system forms configured</h2><p className="text-sm text-muted-foreground">Run the form seed after the database is configured to restore the built-in inventory.</p></CardContent></Card>}
  </main>;
}
