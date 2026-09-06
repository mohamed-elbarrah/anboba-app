import { AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { PageEditor } from "@/components/dashboard/page-editor";
import { getEditorDocument, listPages } from "@/features/pages/queries";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function PageEditorRoute({ params }: Props) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) return <EditorError message="Invalid page ID." />;
  let pages: Awaited<ReturnType<typeof listPages>>;
  try {
    pages = await listPages();
  } catch (error) {
    console.error(`[dashboard/pages/${id}] Unable to list pages`, error);
    return <EditorError message="The editor could not be loaded. Check the content service configuration." detail={error instanceof Error ? error.message : undefined} />;
  }

  // Resolve the shared page identity first, then load each locale independently.
  const requested = pages.find((page) => page.id.toString() === id);
  if (!requested) return <EditorError message="The requested page was not found." />;
  if (requested.slug === "policies") redirect("/dashboard/policies");
  const matching = pages.filter((page) => page.slug === requested.slug);
  const localePages = {
    ar: matching.find((page) => page.locale === "ar"),
    en: matching.find((page) => page.locale === "en"),
  };
  const documents: { ar: Awaited<ReturnType<typeof getEditorDocument>>; en: Awaited<ReturnType<typeof getEditorDocument>> } = { ar: null, en: null };
  const errors: { ar: string | null; en: string | null } = { ar: null, en: null };
  await Promise.all(((["ar", "en"] as const).map(async (locale) => {
    const page = localePages[locale];
    if (!page) return;
    try {
      documents[locale] = await getEditorDocument(page.id.toString(), locale);
    } catch (error) {
      console.error(`[dashboard/pages/${id}] Unable to load ${locale} editor`, error);
      errors[locale] = "This locale could not be loaded.";
    }
  })));

  return <PageEditor initialDocuments={documents} initialErrors={errors} />;
}

function EditorError({ message, detail }: { message: string; detail?: string }) {
  return <main className="mx-auto w-full max-w-3xl p-4 md:p-8"><div className="rounded-lg border border-destructive/30 bg-card p-10 text-center"><AlertCircle className="mx-auto size-8 text-destructive" /><h1 className="mt-3 font-semibold">{message}</h1>{process.env.NODE_ENV === "development" && detail && <p className="mt-2 break-all text-xs text-destructive">{detail}</p>}</div></main>;
}
