"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Check, Eye, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { saveDraft, publishPage, discardDraft, type EditorDocumentInput, type PageActionResult } from "@/features/pages/actions";
import { parseSectionContent } from "@/features/pages/content-schemas";
import { sectionNames } from "./page-preview";
import { PagePreview } from "./page-preview";
import type { EditorDocument, SectionKey } from "@/features/pages/types";

type Locale = "ar" | "en";
type Value = string | Value[] | { [key: string]: Value };
type DocumentMap = { title: string; metaTitle: string | null; metaDescription: string | null; sections: EditorDocument["sections"] };
type Props = {
  initialDocuments: Record<Locale, EditorDocument | null>;
  initialErrors: Record<Locale, string | null>;
};

export function PageEditor({ initialDocuments, initialErrors }: Props) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [savedDocuments, setSavedDocuments] = useState(initialDocuments);
  const [locale, setLocale] = useState<Locale>(initialDocuments.ar ? "ar" : "en");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [mobileTab, setMobileTab] = useState<"fields" | "preview">("fields");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const current = documents[locale];
  const localeError = initialErrors[locale];
  const dirty = useMemo(() => Object.entries(documents).some(([key, value]) => value && JSON.stringify(value) !== JSON.stringify(savedDocuments[key as Locale])), [documents, savedDocuments]);

  function updateDocument(update: (document: DocumentMap) => DocumentMap) {
    if (!current) return;
    setDocuments((all) => ({ ...all, [locale]: { ...current, ...update(current) } }));
    setMessage(null); setError(null);
  }
  function updateSection(key: SectionKey, content: Value) {
    updateDocument((document) => ({ ...document, sections: document.sections.map((section) => section.key === key ? { ...section, content } as typeof section : section) }));
  }
  function validate(document: EditorDocument) {
    const issues: string[] = [];
    if (!document.title.trim()) issues.push("Page title is required.");
    document.sections.forEach((section) => { try { parseSectionContent(section.key, section.content); } catch { issues.push(`${sectionNames[section.key]} has invalid or incomplete fields.`); } });
    return issues;
  }
  async function mutate(kind: "draft" | "publish") {
    if (!current) return;
    const issues = validate(current);
    if (issues.length) { setValidationIssues(issues); setError(`Validation summary: ${issues.join(" ")}`); return; }
    setValidationIssues([]);
    setBusy(true); setError(null); setMessage(null);
    const input: EditorDocumentInput = { pageId: current.pageId, locale, revisionToken: current.revisionToken, title: current.title, metaTitle: current.metaTitle, metaDescription: current.metaDescription, sections: current.sections };
    try {
      const result: PageActionResult = kind === "draft" ? await saveDraft(input) : await publishPage(input);
      if (!result.ok) setError(result.message); else { const saved = { ...current, revisionToken: result.revisionToken, revisionId: result.revisionToken, status: result.status }; setDocuments((all) => ({ ...all, [locale]: saved })); setSavedDocuments((all) => ({ ...all, [locale]: saved })); setMessage(kind === "publish" ? "Published successfully." : "Draft saved."); }
    } catch { setError("Unable to complete the request."); }
    finally { setBusy(false); }
  }
  async function discard() {
    if (!current || !window.confirm("Discard unsaved changes and restore the published content?")) return;
    setBusy(true); setError(null);
    try {
      const result = await discardDraft(current.pageId, locale, current.revisionToken);
      if (!result.ok) setError(result.message); else window.location.reload();
    } catch { setError("Unable to complete the request."); }
    finally { setBusy(false); }
  }
  if (!current) return <main className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-8"><header className="flex flex-wrap gap-2"><Button variant={locale === "ar" ? "default" : "outline"} onClick={() => setLocale("ar")}>Arabic</Button><Button variant={locale === "en" ? "default" : "outline"} onClick={() => setLocale("en")}>English</Button></header><Card><CardContent className="space-y-2 p-8 text-destructive"><p>{localeError ?? "This locale is not configured."}</p><p className="text-sm text-muted-foreground">Choose another locale above if it is available.</p></CardContent></Card></main>;
  return <main className="mx-auto w-full max-w-[1600px] space-y-4 p-4 md:p-8">
    <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">Fixed page editor</p><h1 className="text-3xl font-semibold">{current.title}</h1><p className="mt-1 text-sm text-muted-foreground">/{locale}/{current.slug || "home"} · {dirty ? "Unsaved changes" : "All changes saved"}</p></div><div className="flex flex-wrap items-center gap-2"><Button variant={locale === "ar" ? "default" : "outline"} onClick={() => setLocale("ar")}>Arabic</Button><Button variant={locale === "en" ? "default" : "outline"} onClick={() => setLocale("en")}>English</Button>{(initialErrors.ar || initialErrors.en) && <p role="alert" className="text-sm text-destructive">{initialErrors.ar && "Arabic could not be loaded. "}{initialErrors.en && "English could not be loaded."}</p>}</div></header>
    <div className="flex gap-2 md:hidden"><Button variant={mobileTab === "fields" ? "default" : "outline"} onClick={() => setMobileTab("fields")}>Fields</Button><Button variant={mobileTab === "preview" ? "default" : "outline"} onClick={() => setMobileTab("preview")}><Eye className="me-2 size-4" />Preview</Button></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
      <section className={mobileTab === "preview" ? "hidden lg:block" : "space-y-4"}><MetadataFields document={current} update={updateDocument} /><div className="space-y-3">{current.sections.map((section) => <SectionEditor key={section.key} section={section} update={(content) => updateSection(section.key, content)} />)}</div><div className="sticky bottom-3 flex flex-wrap gap-2 rounded-lg border bg-background/95 p-3 shadow-lg"><Button disabled={busy} onClick={() => mutate("draft")}><Save className="me-2 size-4" />Save draft</Button><Button disabled={busy} variant="secondary" onClick={() => mutate("publish")}><Check className="me-2 size-4" />Publish</Button><Button disabled={busy || !dirty} variant="outline" onClick={discard}><Trash2 className="me-2 size-4" />Discard</Button>{busy && <Loader2 className="size-5 animate-spin self-center" />}</div>{error && <p role="alert" className="flex gap-2 text-sm text-destructive"><AlertCircle className="size-4 shrink-0" />{error}</p>}{validationIssues.length > 0 && <ul className="list-disc ps-5 text-xs text-destructive">{validationIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}{message && <p role="status" className="text-sm text-emerald-600">{message}</p>}</section>
      <section className={mobileTab === "fields" ? "hidden lg:block" : ""}><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Live preview</h2><div className="flex gap-1">{(["desktop", "tablet", "mobile"] as const).map((mode) => <Button key={mode} size="sm" variant={device === mode ? "default" : "outline"} onClick={() => setDevice(mode)}>{mode[0].toUpperCase() + mode.slice(1)}</Button>)}</div></div><PagePreview document={current} device={device} /></section>
    </div>
  </main>;
}

function MetadataFields({ document, update }: { document: EditorDocument; update: (fn: (doc: DocumentMap) => DocumentMap) => void }) { return <Card><CardHeader><CardTitle className="text-base">Metadata</CardTitle></CardHeader><CardContent className="space-y-3"><label className="block text-sm font-medium">Page title<Input value={document.title} onChange={(e) => update((d) => ({ ...d, title: e.target.value }))} /></label><label className="block text-sm font-medium">SEO title<Input value={document.metaTitle ?? ""} onChange={(e) => update((d) => ({ ...d, metaTitle: e.target.value || null }))} /></label><label className="block text-sm font-medium">SEO description<textarea className="mt-1 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" value={document.metaDescription ?? ""} onChange={(e) => update((d) => ({ ...d, metaDescription: e.target.value || null }))} /></label></CardContent></Card>; }

function SectionEditor({ section, update }: { section: EditorDocument["sections"][number]; update: (value: Value) => void }) { return <Card><CardHeader><CardTitle className="text-base">{sectionNames[section.key]} <span className="text-xs font-normal text-muted-foreground">Section {section.sortOrder + 1}</span></CardTitle></CardHeader><CardContent><ValueFields value={section.content as Value} onChange={update} path={section.key} /></CardContent></Card>; }

function ValueFields({ value, onChange, path }: { value: Value; onChange: (value: Value) => void; path: string }) {
  if (typeof value === "string") return <Input required value={value} onChange={(e) => onChange(e.target.value)} aria-label={path} />;
  if (Array.isArray(value)) return <div className="space-y-3 border-s-2 ps-3">{value.map((item, index) => <div key={`${path}-${index}`}><p className="mb-1 text-xs font-medium text-muted-foreground">Item {index + 1}</p><ValueFields value={item} path={`${path}.${index}`} onChange={(next) => { const copy = [...value]; copy[index] = next; onChange(copy); }} /></div>)}</div>;
  return <div className="grid gap-3 sm:grid-cols-2">{Object.entries(value).map(([key, item]) => <label key={key} className="block text-xs font-medium text-muted-foreground">{key.replace(/([A-Z])/g, " $1")}<div className="mt-1"> <ValueFields value={item} path={`${path}.${key}`} onChange={(next) => onChange({ ...value, [key]: next })} /></div></label>)}</div>;
}
