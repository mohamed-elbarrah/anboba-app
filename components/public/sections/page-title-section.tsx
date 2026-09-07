import type { Locale } from "@/lib/locales";
import { MotionReveal } from "@/components/public/motion";

export type PageTitleContent = {
  eyebrow: string;
  heading: string;
  description: string;
};

type PageTitleSectionProps = {
  content: PageTitleContent;
  locale: Locale;
  asSection?: boolean;
  compact?: boolean;
};

export function PageTitleSection({
  content,
  locale,
  asSection = false,
  compact = false,
}: PageTitleSectionProps) {
  const Element = asSection ? "section" : "main";

  return (
    <Element
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`flex ${compact ? "min-h-0" : "min-h-[min(800px,calc(100vh-420px))]"} flex-1 flex-col bg-background px-5 pb-16 pt-20 text-foreground sm:px-8 sm:pt-20`}
    >
      <section
        aria-labelledby="public-page-title"
        className="mx-auto w-full max-w-4xl text-center"
      >
        <MotionReveal y={14}>
        <p className="mx-auto inline-flex rounded-full border border-primary/10 bg-primary/10 px-6 py-2 text-sm font-semibold text-primary shadow-sm">
          {content.eyebrow}
        </p>
        </MotionReveal>
        <MotionReveal y={18} delay={0.2}>
        <h1
          id="public-page-title"
          className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
        >
          {content.heading}
        </h1>
        </MotionReveal>
        <MotionReveal y={18} delay={0.4}>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg lg:text-[1.25rem] lg:leading-relaxed">
          {content.description}
        </p>
        </MotionReveal>
      </section>
    </Element>
  );
}
