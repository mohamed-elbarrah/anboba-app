import { ArrowLeft, ArrowRight, Headphones } from "lucide-react";
import Link from "next/link";

import { PublicCtaLink } from "@/components/public/public-cta-link";
import type { Dictionary } from "@/lib/dictionaries";

type FaqSupportContent = Dictionary["faqSupport"];

type FaqSupportSectionProps = {
  content: FaqSupportContent;
  faqHref: string;
  supportHref: string;
  locale?: "ar" | "en";
};

export function FaqSupportSection({
  content,
  faqHref,
  supportHref,
  locale = "ar",
}: FaqSupportSectionProps) {
  return (
    <section
      id="faq"
      dir={locale === "ar" ? "rtl" : "ltr"}
      aria-labelledby="faq-support-heading"
      className="bg-background px-5 py-16 sm:px-8 sm:py-24 lg:py-28"
    >
      <h2 id="faq-support-heading" className="sr-only">
        {content.faq.heading}
      </h2>
      <div
        className={`mx-auto grid max-w-[1326px] grid-cols-1 gap-5 [direction:ltr] lg:gap-10 ${locale === "ar" ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,2.05fr)]" : "lg:grid-cols-[minmax(0,2.05fr)_minmax(0,1fr)]"}`}
      >
        <article
          className={`relative isolate flex min-h-[340px] min-w-0 flex-col overflow-hidden rounded-3xl border border-white/90 bg-white/50 px-7 py-8 shadow-[0_5px_8px_rgb(111_78_58_/_10%)] sm:px-10 sm:py-10 lg:min-h-[420px] lg:rounded-[2rem] lg:px-8 lg:py-12 ${locale === "ar" ? "text-right lg:col-start-2" : "text-left lg:col-start-1"} lg:row-start-1`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute -bottom-7 size-40 rotate-12 rounded-2xl border-2 border-primary/10 bg-primary/[0.025] text-center text-8xl font-black leading-[9rem] text-primary/10 shadow-[0_8px_18px_color-mix(in_srgb,var(--primary)_4%,transparent)] ${locale === "ar" ? "left-0" : "right-0"}`}
          >
            ?
          </span>
          <div
            className={`relative z-10 flex h-full flex-col items-start ${locale === "ar" ? "text-right" : "text-left"}`}
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            <p className="text-base font-extrabold text-primary">FAQ</p>
            <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-[2.25rem]">
              {content.faq.heading}
            </h3>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg lg:text-[1.25rem] lg:leading-relaxed">
              {content.faq.description}
            </p>
            <PublicCtaLink href={faqHref} className="mt-auto min-h-14 gap-3 px-7 pt-3 text-lg">
              {content.faq.cta}
              {locale === "ar" ? (
                <ArrowLeft className="size-6" aria-hidden="true" />
              ) : (
                <ArrowRight className="size-6" aria-hidden="true" />
              )}
            </PublicCtaLink>
          </div>
        </article>

        <article
          className={`flex min-h-[340px] min-w-0 flex-col rounded-3xl border border-primary/20 bg-primary px-7 py-8 text-primary-foreground shadow-sm sm:px-8 sm:py-10 lg:min-h-[420px] lg:rounded-[2rem] lg:px-10 lg:py-[4.25rem] ${locale === "ar" ? "text-right lg:col-start-1" : "text-left lg:col-start-2"} lg:row-start-1`}
        >
          <div
            className={`flex h-full flex-col items-start ${locale === "ar" ? "text-right" : "text-left"}`}
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            <Headphones
              className="size-12 text-white"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <h3 className="mt-8 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-[2.25rem]">
              {content.support.heading}
            </h3>
            <p className="mt-4 text-base leading-8 text-primary-foreground/85 sm:text-lg lg:text-[1.2rem] lg:leading-relaxed">
              {content.support.description}
            </p>
            <Link
              href={supportHref}
              className="mt-auto inline-flex min-h-14 w-full max-w-[255px] self-center items-center justify-center rounded-full bg-white/35 px-6 py-3 text-lg font-bold text-primary-foreground shadow-sm transition-colors hover:bg-white/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {content.support.cta}
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
