import type { Dictionary } from "@/lib/dictionaries";

type StatisticsContent = Dictionary["statistics"];

export function StatisticsSection({ content }: { content: StatisticsContent }) {
  return (
    <section
      aria-labelledby="statistics-heading"
      className="relative isolate overflow-hidden bg-primary px-5 py-10 text-primary-foreground sm:px-8 sm:py-12 lg:flex lg:min-h-[245px] lg:flex-col lg:justify-center lg:py-0"
      dir="rtl"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -start-28 top-1/2 -z-10 size-72 -translate-y-1/2 rounded-full border border-primary-foreground/10 sm:-start-20 sm:size-80"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-28 top-1/2 -z-10 size-72 -translate-y-1/2 rounded-full border border-primary-foreground/10 sm:-end-20 sm:size-80"
      />
      <h2 id="statistics-heading" className="sr-only">
        {content.heading}
      </h2>
      <dl className="mx-auto grid max-w-[1400px] grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-y-0">
        {content.items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center justify-center px-2 text-center sm:min-h-24"
          >
            <dt className="order-2 mt-2 text-xs font-medium leading-5 text-primary-foreground/90 sm:text-sm">
              {item.label}
            </dt>
            <dd className="order-1 text-3xl font-extrabold leading-none tracking-tight sm:text-4xl">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
