import { Headphones } from "lucide-react";
import Link from "next/link";

import { PublicCtaLink } from "@/components/public/public-cta-link";
import type { Dictionary } from "@/lib/dictionaries";

type FaqSupportContent = Dictionary["faqSupport"];

type FaqSupportSectionProps = {
  content: FaqSupportContent;
  faqHref: string;
  supportHref: string;
};

export function FaqSupportSection({
  content,
  faqHref,
  supportHref,
}: FaqSupportSectionProps) {
  return (
    <section
      id="faq"
      aria-labelledby="faq-support-heading"
      className="bg-background px-5 py-16 sm:px-8 sm:py-24 lg:py-28"
      dir="rtl"
    >
      <h2 id="faq-support-heading" className="sr-only">
        {content.faq.heading}
      </h2>
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 [direction:ltr] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
        <article className="relative isolate flex min-h-[300px] min-w-0 flex-col overflow-hidden rounded-3xl border border-primary/10 bg-card px-7 py-8 text-right shadow-sm sm:px-10 sm:py-10 lg:col-start-2 lg:row-start-1">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-5 left-8 size-20 rotate-12 rounded-2xl border-2 border-primary/10 bg-primary/[0.025] text-center text-6xl font-black leading-[4.5rem] text-primary/10 shadow-[0_8px_18px_color-mix(in_srgb,var(--primary)_4%,transparent)]"
          >
            ?
          </span>
          <div className="relative z-10 flex h-full flex-col items-start [direction:rtl]">
            <p className="text-sm font-extrabold text-primary">FAQ</p>
            <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-[2rem]">
              {content.faq.heading}
            </h3>
            <p className="mt-4 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg lg:text-[1.15rem] lg:leading-relaxed">
              {content.faq.description}
            </p>
            <PublicCtaLink href={faqHref} className="mt-auto pt-3">
              {content.faq.cta}
            </PublicCtaLink>
          </div>
        </article>

        <article className="flex min-h-[300px] min-w-0 flex-col rounded-3xl border border-primary/20 bg-primary px-7 py-8 text-right text-primary-foreground shadow-sm sm:px-8 sm:py-10 lg:col-start-1 lg:row-start-1">
          <div className="flex h-full flex-col items-start [direction:rtl]">
            <Headphones
              className="size-7 text-white"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <h3 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-[2rem]">
              {content.support.heading}
            </h3>
            <p className="mt-4 text-base leading-8 text-primary-foreground/85 sm:text-lg lg:text-[1.15rem] lg:leading-relaxed">
              {content.support.description}
            </p>
            <Link
              href={supportHref}
              className="mt-auto inline-flex min-h-11 items-center justify-center rounded-full bg-white/90 px-5 py-2.5 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {content.support.cta}
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
