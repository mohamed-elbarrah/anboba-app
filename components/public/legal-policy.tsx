import Link from "next/link";

import { PageTitleSection } from "@/components/public/sections/page-title-section";
import type { PageTitleContent } from "@/components/public/sections/page-title-section";
import type { LegalDocument } from "@/content/legal/policies";
import { arabicLegalDocuments } from "@/content/legal/policies";

const documentLinks = {
  privacy: "الخصوصية",
  terms: "الشروط والأحكام",
  refunds: "الاسترداد",
} as const;

export function LegalPolicyNavigation({ current }: { current?: LegalDocument["slug"] }) {
  return (
    <nav aria-label="التنقل بين الوثائق القانونية">
      <ul className="flex flex-wrap gap-2 sm:gap-3">
        {arabicLegalDocuments.map((document) => (
          <li key={document.slug}>
            <Link
              href={`/ar/policies/${document.slug}`}
              aria-current={current === document.slug ? "page" : undefined}
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {documentLinks[document.slug]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function LegalPolicyOverview({ heroContent }: { heroContent: PageTitleContent }) {
  return (
    <main dir="rtl" className="flex-1 bg-background text-foreground">
      <PageTitleSection content={heroContent} locale="ar" asSection compact />
      <section className="px-5 py-12 sm:px-8 sm:py-16" aria-labelledby="policies-overview-title">
        <div className="mx-auto w-full max-w-5xl">
        <header className="max-w-3xl">
          <h2 id="policies-overview-title" className="text-2xl font-bold sm:text-3xl">
            السياسات القانونية
          </h2>
          <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
            اختر الوثيقة التي تريد قراءتها.
          </p>
        </header>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {arabicLegalDocuments.map((document) => (
            <article
              key={document.slug}
              className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold">{document.title}</h2>
              <p className="mt-3 flex-1 text-base leading-8 text-muted-foreground">
                {document.summary}
              </p>
              <Link
                href={`/ar/policies/${document.slug}`}
                className="mt-6 inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                قراءة الوثيقة <span aria-hidden="true" className="ms-2">←</span>
              </Link>
            </article>
          ))}
        </div>
        </div>
      </section>
    </main>
  );
}

export function LegalPolicyDocument({ document }: { document: LegalDocument }) {
  return (
    <main dir="rtl" className="flex-1 bg-background text-foreground">
      <PageTitleSection
        content={{
          eyebrow: "تطبيق أنبوبة",
          heading: document.title,
          description: document.summary,
        }}
        locale="ar"
        asSection
        compact
      />
      <article className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="divide-y divide-border">
          {document.sections.map((section) => (
            <section key={section.heading} className="py-8 first:pt-10">
              <h2 className="text-xl font-bold sm:text-2xl">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
                  {paragraph}
                </p>
              ))}
              {section.items ? (
                <ul className="mt-4 list-disc space-y-3 pe-6 text-base leading-8 text-muted-foreground sm:text-lg">
                  {section.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
        <div className="border-t border-border pt-8">
          <LegalPolicyNavigation current={document.slug} />
        </div>
      </article>
    </main>
  );
}
