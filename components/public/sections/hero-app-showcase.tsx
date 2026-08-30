import { GuaranteeCard } from "@/components/public/sections/guarantee-card";
import { PhoneMockup } from "@/components/public/sections/phone-mockup";
import type { Locale } from "@/lib/locales";

type ShowcaseSide = "left" | "right";

export type HeroSideProps = {
  side: ShowcaseSide;
  phoneVariant: "left" | "right";
  cards: readonly [string, string];
  label: string;
  phoneAlt: string;
  locale: Locale;
};

type ShowcaseContent = {
  heading: string;
  guaranteeLabel: string;
  guarantees: readonly string[];
  phoneLeftAlt: string;
  phoneRightAlt: string;
};

export function HeroSide({ side, phoneVariant, cards, label, phoneAlt, locale }: HeroSideProps) {
  return (
    <div className={`hero-side hero-side-${side}`}>
      <div className="hero-side-cards">
        {cards.map((title, index) => (
          <GuaranteeCard
            key={`${side}-${index}`}
            label={label}
            title={title}
            side={side}
            locale={locale}
          />
        ))}
      </div>
      <PhoneMockup variant={phoneVariant} alt={phoneAlt} />
    </div>
  );
}

export function HeroAppShowcase({ content, locale }: { content: ShowcaseContent; locale: Locale }) {
  const cards: [string, string, string, string] = [
    content.guarantees[0] ?? "",
    content.guarantees[1] ?? "",
    content.guarantees[2] ?? "",
    content.guarantees[3] ?? "",
  ];

  return (
    <section
      aria-labelledby="hero-showcase-heading"
      className="hero-app-showcase mx-auto mt-14 w-full max-w-[1440px]"
    >
      <h2 id="hero-showcase-heading" className="sr-only">
        {content.heading}
      </h2>
      <HeroSide
        side="left"
        phoneVariant="left"
        cards={[cards[0], cards[1]]}
        label={content.guaranteeLabel}
        phoneAlt={content.phoneLeftAlt}
        locale={locale}
      />
      <HeroSide
        side="right"
        phoneVariant="right"
        cards={[cards[2], cards[3]]}
        label={content.guaranteeLabel}
        phoneAlt={content.phoneRightAlt}
        locale={locale}
      />
    </section>
  );
}
