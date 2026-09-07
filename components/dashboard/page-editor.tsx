"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Check, Eye, Loader2, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HomeSectionEditor } from "@/components/dashboard/home-section-editor";
import type { MediaItem } from "@/features/media/types";
import type { DashboardFormOption } from "@/features/forms/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  discardDraft,
  publishPage,
  saveDraft,
  type EditorDocumentInput,
  type PageActionResult,
} from "@/features/pages/actions";
import { parseSectionContent, parseStrictSectionOwnedFormContent } from "@/features/pages/content-schemas";
import type { EditorDocument, SectionKey } from "@/features/pages/types";

type Locale = "ar" | "en";
const sectionNames: Record<SectionKey, Record<Locale, string>> = {
  hero: { en: "Hero", ar: "الرئيسية" },
  service_overview: { en: "Service overview", ar: "نظرة عامة على الخدمة" },
  statistics: { en: "Statistics", ar: "الإحصائيات" },
  why_choose_us: { en: "Why choose us", ar: "لماذا تختارنا" },
  service_benefits: { en: "Service benefits", ar: "مزايا الخدمة" },
  join_application: { en: "Join application", ar: "طلب الانضمام" },
  faq_support: { en: "FAQ and support", ar: "الأسئلة الشائعة والدعم" },
  vision_mission: { en: "Vision and mission", ar: "الرؤية والرسالة" },
  contact: { en: "Contact", ar: "اتصل بنا" },
  partner_registration: { en: "Partner registration", ar: "تسجيل الشركاء" },
  policies: { en: "Policies", ar: "السياسات" },
};

const fieldLabels: Record<string, string> = {
  headingStart: "بداية العنوان", headingHighlight: "العنوان المميز", headingHighlightGas: "العنوان المميز للغاز", headingHighlightHome: "العنوان المميز للمنزل", headingMiddle: "وسط العنوان", description: "الوصف", eyebrow: "العنوان التمهيدي", subtitle: "العنوان الفرعي", cardHeading: "عنوان البطاقة", cardParagraph: "نص البطاقة", featuresHeading: "عنوان المزايا", imageAlt: "النص البديل للصورة", cta: "زر الإجراء", countryCode: "رمز الدولة", countryLabel: "اسم الدولة", heading: "العنوان", fileHint: "إرشادات الملف", note: "ملاحظة"
};
const labelFor = (locale: Locale, key: string) => locale === "ar" ? (fieldLabels[key] ?? key) : key;

const editorCopy = {
  en: { workspace: "Content workspace", unsaved: "Unsaved changes", saved: "All changes saved", saveDraft: "Save draft", publish: "Publish", discard: "Discard", preview: "Preview published page", unavailable: "Preview unavailable: this locale has no valid published revision." },
  ar: { workspace: "مساحة المحتوى", unsaved: "تغييرات غير محفوظة", saved: "تم حفظ جميع التغييرات", saveDraft: "حفظ المسودة", publish: "نشر", discard: "تجاهل", preview: "معاينة الصفحة المنشورة", unavailable: "المعاينة غير متاحة؛ لا توجد نسخة منشورة صالحة لهذه اللغة." },
} as const;
type Section = EditorDocument["sections"][number];
type Data = Record<string, unknown>;
type EditableDocument = Pick<
  EditorDocument,
  "title" | "metaTitle" | "metaDescription" | "sections"
>;

const textValue = (data: Data, key: string) => String(data[key] ?? "");

function Field({
  label,
  value,
  onChange,
  multi = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multi?: boolean;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      {label}
      {multi ? (
        <textarea
          className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function Locales({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}) {
  return (
    <div className="flex rounded-lg border bg-muted/40 p-1">
      <Button
        size="sm"
        variant={locale === "ar" ? "default" : "ghost"}
        onClick={() => setLocale("ar")}
      >
        العربية
      </Button>
      <Button
        size="sm"
        variant={locale === "en" ? "default" : "ghost"}
        onClick={() => setLocale("en")}
      >
        English
      </Button>
    </div>
  );
}

export function PageEditor({
  initialDocuments,
  initialErrors,
  isHome = false,
  media = [],
  forms = [],
}: {
  isHome?: boolean;
  media?: readonly MediaItem[];
  forms?: readonly DashboardFormOption[];
  initialDocuments: Record<Locale, EditorDocument | null>;
  initialErrors: Record<Locale, string | null>;
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [savedDocuments, setSavedDocuments] = useState(initialDocuments);
  const [locale, setLocale] = useState<Locale>(
    initialDocuments.ar ? "ar" : "en",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);

  const current = documents[locale];
  const ui = editorCopy[locale];
  const dirty = useMemo(
    () =>
      (["ar", "en"] as Locale[]).some(
        (key) =>
          documents[key] &&
          JSON.stringify(documents[key]) !== JSON.stringify(savedDocuments[key]),
      ),
    [documents, savedDocuments],
  );
  const currentDirty =
    !!current &&
    JSON.stringify(current) !== JSON.stringify(savedDocuments[locale]);

  const update = (change: (document: EditableDocument) => EditableDocument) => {
    if (current) {
      setDocuments((all) => ({
        ...all,
        [locale]: { ...current, ...change(current) },
      }));
    }
    setError(null);
    setMessage(null);
  };

  const setSectionForm = (key: SectionKey, formId: string | null) => {
    update((document) => ({
      ...document,
      sections: document.sections.map((section) => section.key === key ? { ...section, formId } : section),
    }));
  };

  const setSection = (key: SectionKey, content: unknown) => {
    update((document) => ({
      ...document,
      sections: document.sections.map((section) =>
        section.key === key ? ({ ...section, content } as Section) : section,
      ),
    }));
  };

  const validate = (document: EditorDocument) => {
    const validationIssues: string[] = [];
    if (!document.title.trim()) validationIssues.push("Page title is required.");

    document.sections.forEach((section) => {
      try {
        if (section.key === "contact" || section.key === "join_application" || section.key === "partner_registration") parseStrictSectionOwnedFormContent(section.key, section.content);
        else parseSectionContent(section.key as keyof typeof import("@/features/pages/content-schemas").sectionContentSchemas, section.content);
      } catch {
        validationIssues.push(
          `${sectionNames[section.key]} has invalid or incomplete fields.`,
        );
      }
    });
    return validationIssues;
  };

  async function mutate(kind: "draft" | "publish") {
    if (!current) return;

    const validationIssues = validate(current);
    if (validationIssues.length) {
      setIssues(validationIssues);
      setError("Please complete the highlighted content before continuing.");
      return;
    }

    setBusy(true);
    setError(null);
    setIssues([]);

    try {
      const input: EditorDocumentInput = {
        pageId: current.pageId,
        locale,
        revisionToken: current.revisionToken,
        title: current.title,
        metaTitle: current.metaTitle,
        metaDescription: current.metaDescription,
        sections: current.sections,
      };
      const result: PageActionResult =
        kind === "draft" ? await saveDraft(input) : await publishPage(input);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      const nextDocument = {
        ...current,
        revisionToken: result.revisionToken,
        revisionId: result.revisionToken,
        status: result.status,
        // Publishing creates a verified public revision; saving a draft does not.
        hasPublishedRevision:
          kind === "publish" ? true : current.hasPublishedRevision,
      };
      setDocuments((all) => ({ ...all, [locale]: nextDocument }));
      setSavedDocuments((all) => ({ ...all, [locale]: nextDocument }));
      setMessage(
        kind === "publish" ? "Published successfully." : "Draft saved.",
      );
    } catch {
      setError("Unable to complete the request. Please try again.");
    } finally {
      setBusy(false);
    }
  }


  function openPublishedPage() {
    if (!current || !current.hasPublishedRevision) {
      setError(ui.unavailable);
      return;
    }
    const previewWindow = window.open(
      `/${locale}${current.slug ? `/${current.slug}` : ""}`,
      "_blank",
    );
    if (!previewWindow) {
      setError(locale === "ar" ? "تم حظر المعاينة. اسمح بالنوافذ المنبثقة لهذا الموقع ثم حاول مرة أخرى." : "Preview was blocked. Allow pop-ups for this site and try again.");
      return;
    }
    previewWindow.opener = null;
  }

  async function discard() {
    if (
      !current ||
      !window.confirm("Discard unsaved changes and restore the published content?")
    ) {
      return;
    }

    setBusy(true);
    try {
      const result = await discardDraft(
        current.pageId,
        locale,
        current.revisionToken,
      );
      if (!result.ok) setError(result.message);
      else window.location.reload();
    } catch {
      setError("Unable to discard the draft.");
    } finally {
      setBusy(false);
    }
  }

  if (!current) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-6">
        <Locales locale={locale} setLocale={setLocale} />
        <Card>
          <CardContent className="p-8 text-destructive">
            {initialErrors[locale] ?? "This locale is not configured."}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-none space-y-6 px-4 py-4 md:px-8 md:py-8">
      <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{ui.workspace}</p>
          <h1 className="mt-1 text-3xl font-semibold">{current.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            /{locale}/{current.slug || "home"} ·{" "}
            <span className={dirty ? "text-amber-600" : "text-emerald-600"}>
              {dirty ? ui.unsaved : ui.saved}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Locales locale={locale} setLocale={setLocale} />
          <div className="flex flex-col items-start gap-1">
            <button
              type="button"
              onClick={openPublishedPage}
              disabled={!current.hasPublishedRevision || busy}
              title={
                current.hasPublishedRevision
                  ? "Open the public page"
                  : "Preview is unavailable because this locale has no valid published revision."
              }
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
            >
              <Eye className="size-4" />
              {ui.preview}
            </button>
            {!current.hasPublishedRevision && (
              <p className="max-w-64 text-xs text-muted-foreground">
                {ui.unavailable}
              </p>
            )}
          </div>
        </div>
      </header>

      {(initialErrors.ar || initialErrors.en) && (
        <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          {initialErrors.ar && (locale === "ar" ? "تعذر تحميل العربية. " : "Arabic could not be loaded. ")}
          {initialErrors.en && (locale === "ar" ? "تعذر تحميل الإنجليزية." : "English could not be loaded.")}
        </p>
      )}

      <Metadata document={current} locale={locale} update={update} />
      <div className="space-y-4">
        {current.sections.map((section) => isHome ? (
          <HomeSectionEditor
            key={section.key}
            section={section}
            locale={locale}
            media={media}
            forms={forms}
            onFormChange={(formId) => setSectionForm(section.key, formId)}
            update={(content) => setSection(section.key, content)}
          />
        ) : (
          <SectionForm
            key={section.key}
            section={section}
            locale={locale}
            update={(content) => setSection(section.key, content)}
          />
        ))}
      </div>

      <footer className="sticky bottom-3 z-10 flex flex-wrap gap-2 rounded-xl border bg-background/95 p-3 shadow-lg">
        <Button disabled={busy} onClick={() => mutate("draft")}>
          <Save className="me-2 size-4" />
          {ui.saveDraft}
        </Button>
        <Button disabled={busy} variant="secondary" onClick={() => mutate("publish")}>
          <Check className="me-2 size-4" />
          {ui.publish}
        </Button>
        <Button disabled={busy || !currentDirty} variant="outline" onClick={discard}>
          <Trash2 className="me-2 size-4" />
          {ui.discard}
        </Button>
        {busy && <Loader2 className="size-5 animate-spin" />}
      </footer>

      {error && (
        <p role="alert" className="flex gap-2 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {error}
        </p>
      )}
      {issues.map((issue) => (
        <p key={issue} className="text-xs text-destructive">
          {issue}
        </p>
      ))}
      {message && <p role="status" className="text-sm text-emerald-600">{message}</p>}

    </main>
  );
}

function Metadata({
  document,
  locale,
  update,
}: {
  document: EditorDocument;
  locale: Locale;
  update: (change: (document: EditableDocument) => EditableDocument) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{locale === "ar" ? "بيانات الصفحة" : "Page metadata"}</CardTitle>
        <CardDescription>{locale === "ar" ? "حقول البحث وهوية الصفحة لهذه اللغة." : "Search and page identity fields for this locale."}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field label={locale === "ar" ? "عنوان الصفحة" : "Page title"} value={document.title} onChange={(value) => update((d) => ({ ...d, title: value }))} />
        <Field label={locale === "ar" ? "عنوان SEO" : "SEO title"} value={document.metaTitle ?? ""} onChange={(value) => update((d) => ({ ...d, metaTitle: value || null }))} />
        <Field label={locale === "ar" ? "وصف SEO" : "SEO description"} multi value={document.metaDescription ?? ""} onChange={(value) => update((d) => ({ ...d, metaDescription: value || null }))} />
      </CardContent>
    </Card>
  );
}

function SectionForm({
  section,
  locale,
  update,
}: {
  section: Section;
  locale: Locale;
  update: (value: unknown) => void;
}) {
  const data = section.content as Data;
  const set = (key: string, value: string) =>
    update({ ...data, [key]: value });
  const fields = (keys: string[], multi: string[] = []) => (
    <div className="grid gap-4 md:grid-cols-2">
      {keys.map((key) => (
        <Field
          key={key}
          label={labelFor(locale, key)}
          multi={multi.includes(key)}
          value={textValue(data, key)}
          onChange={(value) => set(key, value)}
        />
      ))}
    </div>
  );

  let body: React.ReactNode;
  switch (section.key) {
    case "hero":
      body = (
        <>
          {fields(
            [
              "headingStart",
              "headingHighlightGas",
              "headingMiddle",
              "headingHighlightHome",
              "description",
              "cta",
            ],
            ["description"],
          )}
          {data.showcase && (
            <>
              <Nested
                data={data}
                name="showcase"
                keys={["heading", "guaranteeLabel", "phoneLeftAlt", "phoneRightAlt"]}
                update={update}
              />
              <Strings
                data={data.showcase as Data}
                update={(value) => update({ ...data, showcase: value })}
                name="guarantees"
                count={4}
              />
            </>
          )}
        </>
      );
      break;
    case "service_overview":
      body = fields(
        [
          "highlightedHeading",
          "primaryHeadingStart",
          "primaryHeadingHighlight",
          "description",
          "imageAlt",
        ],
        ["description"],
      );
      break;
    case "statistics":
      body = (
        <>
          <Field
            label="heading"
            value={textValue(data, "heading")}
            onChange={(value) => set("heading", value)}
          />
          <Fixed
            data={data}
            update={update}
            title="Statistic"
            keys={["value", "label"]}
            count={4}
          />
        </>
      );
      break;
    case "why_choose_us":
      body = (
        <>
          {fields(
            [
              "eyebrow",
              "headingStart",
              "headingHighlight",
              "subtitle",
              "cardHeading",
              "cardParagraph",
              "featuresHeading",
              "imageAlt",
            ],
            ["subtitle", "cardParagraph"],
          )}
          <Strings data={data} update={update} name="features" count={4} />
        </>
      );
      break;
    case "vision_mission":
      body = (
        <div className="grid gap-4 md:grid-cols-2">
          <Nested
            data={data}
            name="vision"
            keys={["heading", "description"]}
            update={update}
          />
          <Nested
            data={data}
            name="mission"
            keys={["heading", "description"]}
            update={update}
          />
        </div>
      );
      break;
    case "service_benefits":
      body = (
        <>
          {fields(["eyebrow", "headingHighlight", "headingRest", "subtitle"], ["subtitle"])}
          <Fixed
            data={data}
            update={update}
            title="Benefit"
            keys={["title", "description", "icon"]}
            count={4}
          />
        </>
      );
      break;
    case "faq_support":
      body = (
        <div className="grid gap-4 md:grid-cols-2">
          <Nested
            data={data}
            name="faq"
            keys={["heading", "description", "cta", "href"]}
            update={update}
          />
          <Nested
            data={data}
            name="support"
            keys={["heading", "description", "cta", "href"]}
            update={update}
          />
        </div>
      );
      break;
    case "contact":
      body = (
        <div className="space-y-4">
          {fields(["eyebrow", "headingStart", "headingHighlight", "description", "countryCode", "countryLabel"], ["description"])}
          <Details data={data} update={update} />
        </div>
      );
      break;
    case "partner_registration":
      body = (
        <div className="space-y-4">
          {fields(["eyebrow", "headingStart", "headingHighlight", "description", "countryCode", "countryLabel"], ["description"])}
        </div>
      );
      break;
    case "join_application":
      body = (
        <div className="space-y-4">
          {fields(["heading", "description", "countryCode", "countryLabel", "fileHint", "note"], ["description", "note"])}
          <Strings data={data} update={update} name="benefits" count={3} />
        </div>
      );
      break;
    case "policies":
      body = <Policies data={data} update={update} />;
      break;
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex justify-between">
          {sectionNames[section.key][locale]}
          <span className="text-xs font-normal text-muted-foreground">
            {locale === "ar" ? `القسم ${section.sortOrder + 1} · ثابت` : `Section ${section.sortOrder + 1} · fixed`}
          </span>
        </CardTitle>
        <CardDescription>
          {locale === "ar" ? "يمكنك تعديل الحقول المعتمدة فقط. البنية والترتيب ثابتان." : "Edit approved fields only. Structure and order are fixed."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">{body}</CardContent>
    </Card>
  );
}

function Nested({
  data,
  name,
  keys,
  update,
}: {
  data: Data;
  name: string;
  keys: string[];
  update: (value: unknown) => void;
}) {
  const nested = (data[name] ?? {}) as Data;

  return (
    <fieldset className="rounded-lg border bg-muted/20 p-4">
      <legend className="px-1 text-sm font-semibold">{name}</legend>
      <div className="grid gap-3 md:grid-cols-2">
        {keys.map((key) => (
          <Field
            key={key}
            label={key}
            multi={key.includes("description")}
            value={textValue(nested, key)}
            onChange={(value) =>
              update({ ...data, [name]: { ...nested, [key]: value } })
            }
          />
        ))}
      </div>
    </fieldset>
  );
}

function Fixed({
  data,
  update,
  title,
  keys,
  count,
}: {
  data: Data;
  update: (value: unknown) => void;
  title: string;
  keys: string[];
  count: number;
}) {
  const items = Array.isArray(data.items) ? (data.items as Data[]) : [];

  return (
    <fieldset className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <legend className="px-1 text-sm font-semibold">
        {title} list ({count} fixed items)
      </legend>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-md border bg-background p-3 md:grid-cols-2"
        >
          <p className="text-xs font-semibold text-muted-foreground md:col-span-2">
            {title} {index + 1}
          </p>
          {keys.map((key) => (
            <Field
              key={key}
              label={key}
              multi={key === "description"}
              value={textValue(items[index] ?? {}, key)}
              onChange={(value) => {
                const next = [...items];
                next[index] = { ...(next[index] ?? {}), [key]: value };
                update({ ...data, items: next });
              }}
            />
          ))}
        </div>
      ))}
    </fieldset>
  );
}

function Strings({
  data,
  update,
  name,
  count,
}: {
  data: Data;
  update: (value: unknown) => void;
  name: string;
  count: number;
}) {
  const values = Array.isArray(data[name]) ? data[name] : [];

  return (
    <fieldset className="grid gap-3 rounded-lg border bg-muted/20 p-4 md:grid-cols-2">
      <legend className="px-1 text-sm font-semibold">
        {name} ({count} fixed items)
      </legend>
      {Array.from({ length: count }, (_, index) => (
        <Field
          key={index}
          label={`${name} ${index + 1}`}
          value={String(values[index] ?? "")}
          onChange={(value) => {
            const next = [...values];
            next[index] = value;
            update({ ...data, [name]: next });
          }}
        />
      ))}
    </fieldset>
  );
}

function Policies({
  data,
  update,
}: {
  data: Data;
  update: (value: unknown) => void;
}) {
  const documents = Array.isArray(data.documents)
    ? (data.documents as Data[])
    : [];

  return (
    <div className="space-y-4">
      <Nested
        data={data}
        name="hero"
        keys={["eyebrow", "heading", "description"]}
        update={update}
      />
      <p className="text-sm font-semibold">
        Policy documents (3 fixed documents)
      </p>
      {Array.from({ length: 3 }, (_, index) => (
        <DocumentForm
          key={index}
          data={data}
          document={documents[index] ?? {}}
          index={index}
          update={update}
        />
      ))}
    </div>
  );
}

function DocumentForm({
  data,
  document,
  index,
  update,
}: {
  data: Data;
  document: Data;
  index: number;
  update: (value: unknown) => void;
}) {
  const parts = Array.isArray(document.sections)
    ? (document.sections as Data[])
    : [];

  const updateDocument = (changes: Data) => {
    const documents = [
      ...((data.documents as unknown[] | undefined) ?? []),
    ] as Data[];
    documents[index] = { ...document, ...changes };
    update({ ...data, documents });
  };

  return (
    <fieldset className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <legend className="px-1 text-sm font-semibold">
        Document {index + 1} · {textValue(document, "slug")}
      </legend>
      <Field
        label="Title"
        value={textValue(document, "title")}
        onChange={(value) => updateDocument({ title: value })}
      />
      <Field
        label="Summary"
        multi
        value={textValue(document, "summary")}
        onChange={(value) => updateDocument({ summary: value })}
      />
      {parts.map((part, partIndex) => (
        <div
          key={partIndex}
          className="grid gap-3 border-t pt-3 md:grid-cols-2"
        >
          <Field
            label={`Section ${partIndex + 1} heading`}
            value={textValue(part, "heading")}
            onChange={(value) => {
              const next = [...parts];
              next[partIndex] = { ...part, heading: value };
              updateDocument({ sections: next });
            }}
          />
          <Field
            label="Paragraphs (one per line)"
            multi
            value={Array.isArray(part.paragraphs) ? part.paragraphs.join("\n") : ""}
            onChange={(value) => {
              const next = [...parts];
              next[partIndex] = {
                ...part,
                paragraphs: value.split("\n").filter(Boolean),
              };
              updateDocument({ sections: next });
            }}
          />
          <Field
            label="List items (one per line)"
            multi
            value={Array.isArray(part.items) ? part.items.join("\n") : ""}
            onChange={(value) => {
              const next = [...parts];
              next[partIndex] = {
                ...part,
                items: value.split("\n").filter(Boolean),
              };
              updateDocument({ sections: next });
            }}
          />
        </div>
      ))}
    </fieldset>
  );
}

function Details({
  data,
  update,
}: {
  data: Data;
  update: (value: unknown) => void;
}) {
  const items = Array.isArray(data.details) ? (data.details as Data[]) : [];

  const updateDetail = (index: number, key: string, value: string) => {
    const next = [...items];
    const detail = { ...(next[index] ?? {}) };

    // Optional links must be absent when cleared; an empty URL is invalid.
    if (key === "href" && !value.trim()) delete detail.href;
    else detail[key] = value;

    next[index] = detail;
    update({ ...data, details: next });
  };

  return (
    <fieldset className="grid gap-3 rounded-lg border bg-muted/20 p-4">
      <legend className="px-1 text-sm font-semibold">
        Contact details (4 fixed items)
      </legend>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="grid gap-3 md:grid-cols-3">
          <Field
            label={`Type ${index + 1}`}
            value={textValue(items[index] ?? {}, "kind")}
            onChange={(value) => updateDetail(index, "kind", value)}
          />
          <Field
            label="Value"
            value={textValue(items[index] ?? {}, "value")}
            onChange={(value) => updateDetail(index, "value", value)}
          />
          <Field
            label="Link (optional)"
            value={textValue(items[index] ?? {}, "href")}
            onChange={(value) => updateDetail(index, "href", value)}
          />
        </div>
      ))}
    </fieldset>
  );
}
