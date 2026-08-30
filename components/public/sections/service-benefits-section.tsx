import {
  Clock3,
  Headphones,
  Send,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary, ServiceBenefitIcon } from "@/lib/dictionaries";

type ServiceBenefitsContent = Dictionary["serviceBenefits"];

const icons: Record<ServiceBenefitIcon, LucideIcon> = {
  clock: Clock3,
  shield: ShieldCheck,
  send: Send,
  headset: Headphones,
};

export function ServiceBenefitsSection({
  content,
}: {
  content: ServiceBenefitsContent;
}) {
  return (
    <section
      aria-labelledby="service-benefits-heading"
      className="bg-background px-5 py-20 sm:px-8 sm:py-24 lg:py-28"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1440px]">
        <header className="mx-auto max-w-2xl text-center">
          <p className="mx-auto inline-flex rounded-full bg-primary/10 px-5 py-2 text-sm font-extrabold text-primary sm:text-base">
            {content.eyebrow}
          </p>
          <h2
            id="service-benefits-heading"
            className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.9rem]"
          >
            <span className="text-primary">{content.headingHighlight}</span>
            {content.headingRest}
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base lg:text-[1.35rem] lg:leading-relaxed">
            {content.subtitle}
          </p>
        </header>

        <ul
          aria-labelledby="service-benefits-heading"
          className="mt-12 grid grid-cols-1 gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
        >
          {content.items.map((item, index) => {
            const Icon = icons[item.icon];
            const isHighlighted = index === 0;

            return (
              <li
                key={item.title}
                className={`flex min-h-[240px] flex-col items-start rounded-3xl border px-7 py-8 text-right shadow-sm transition-shadow hover:shadow-md lg:min-h-[250px] lg:px-8 lg:py-9 ${
                  isHighlighted
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-card text-foreground"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-14 items-center justify-center rounded-2xl ${
                    isHighlighted
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="size-6" strokeWidth={2} />
                </span>
                <h3 className="mt-7 text-xl font-extrabold lg:text-[1.45rem]">{item.title}</h3>
                <p
                  className={`mt-3 text-base leading-7 lg:text-[1.1rem] lg:leading-8 ${
                    isHighlighted
                      ? "text-primary-foreground/85"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
