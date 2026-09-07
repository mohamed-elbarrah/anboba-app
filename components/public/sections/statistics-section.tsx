import type { Dictionary } from "@/lib/dictionaries";
import { AnimatedCounter, MotionReveal } from "@/components/public/motion";

type StatisticsContent = Dictionary["statistics"];

export function StatisticsSection({ content, locale = "ar" }: { content: StatisticsContent; locale?: "ar" | "en" }) {
  return (
    <section
      aria-labelledby="statistics-heading"
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="relative isolate overflow-hidden bg-primary px-5 py-10 text-primary-foreground sm:px-8 sm:py-12 lg:flex lg:min-h-[344px] lg:flex-col lg:justify-center lg:py-0"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute start-[8.5%] top-1/2 -z-10 size-[360px] -translate-y-1/2 rounded-full border-4 border-primary-foreground/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute end-[8.5%] top-1/2 -z-10 size-[360px] -translate-y-1/2 rounded-full border-4 border-primary-foreground/10"
      />
      <h2 id="statistics-heading" className="sr-only">
        {content.heading}
      </h2>
      <dl className="mx-auto grid w-full max-w-[1440px] grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-y-0">
        {content.items.map((item, index) => (
          <MotionReveal key={item.label} y={24} delay={index * 0.2}>
          <div
            key={item.label}
            className="flex flex-col items-center justify-center px-2 text-center sm:min-h-24"
          >
            <dt className="order-2 mt-4 text-xs font-medium leading-5 text-primary-foreground/90 sm:text-base lg:mt-7 lg:text-[1.25rem] lg:leading-normal">
              {item.label}
            </dt>
            <dd className="order-1 text-3xl font-extrabold leading-none tracking-tight sm:text-4xl lg:text-[4.25rem]">
              <AnimatedCounter value={item.value} />
            </dd>
          </div>
          </MotionReveal>
        ))}
      </dl>
    </section>
  );
}
