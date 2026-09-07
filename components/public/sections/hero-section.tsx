import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/locales";
import { getDownloadAppHref } from "@/lib/navigation";
import { PublicCtaLink } from "@/components/public/public-cta-link";
import { HeroAppShowcase } from "@/components/public/sections/hero-app-showcase";
import { MotionReveal } from "@/components/public/motion";

type HeroContent = Dictionary["hero"];

export function HeroSection({
  content,
  locale,
  showcaseMedia,
}: {
  content: HeroContent;
  locale: Locale;
  showcaseMedia?: { left: string | null; right: string | null };
}) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="public-hero-surface relative isolate overflow-hidden px-5 pb-20 pt-36 sm:px-8 sm:pb-28 sm:pt-40 lg:pb-32 lg:pt-44"
    >
      <div
        aria-hidden="true"
        className="absolute -start-24 top-16 -z-10 size-64 rounded-full bg-primary/10 blur-3xl sm:size-80"
      />
      <div
        aria-hidden="true"
        className="absolute -end-28 bottom-0 -z-10 size-72 rounded-full bg-primary/5 blur-3xl sm:size-96"
      />
      <div className="mx-auto flex max-w-[1440px] flex-col items-center text-center">
        <div className="flex max-w-7xl flex-col items-center">
          <MotionReveal y={22}>
          <h1
            id="hero-heading"
            className="text-balance text-4xl font-extrabold leading-[1.3] tracking-tight text-foreground sm:text-5xl sm:leading-[1.25] lg:text-6xl"
          >
            {content.headingStart}
            <span className="text-primary">{content.headingHighlightGas}</span>
            {content.headingMiddle}
            <span className="text-primary">{content.headingHighlightHome}</span>
          </h1>
          </MotionReveal>
          <MotionReveal y={20} delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-loose text-muted-foreground sm:mt-7 sm:text-xl">
            {content.description}
          </p>
          </MotionReveal>
          <MotionReveal y={20} delay={0.4}>
          <PublicCtaLink
            href={getDownloadAppHref(locale)}
            className="mt-8 min-h-12 px-8 text-base"
          >
            {content.cta}
          </PublicCtaLink>
          </MotionReveal>
        </div>
        {content.showcase ? (
          <MotionReveal y={34} delay={0.6}>
            <HeroAppShowcase content={content.showcase} locale={locale} media={showcaseMedia} />
          </MotionReveal>
        ) : null}
      </div>
    </section>
  );
}
