import { GuaranteeCard } from "@/components/public/sections/guarantee-card";
import { PhoneMockup } from "@/components/public/sections/phone-mockup";

type ShowcaseSide = "left" | "right";

export type HeroSideProps = {
  side: ShowcaseSide;
  phoneVariant: "left" | "right";
  cards: readonly [string, string];
  label: string;
};

type ShowcaseContent = {
  heading: string;
  guaranteeLabel: string;
  guarantees: readonly string[];
};

export function HeroSide({ side, phoneVariant, cards, label }: HeroSideProps) {
  return (
    <div className={`hero-side hero-side-${side}`}>
      <div className="hero-side-cards">
        {cards.map((title, index) => (
          <GuaranteeCard key={`${side}-${index}`} label={label} title={title} side={side} />
        ))}
      </div>
      <PhoneMockup variant={phoneVariant} />
    </div>
  );
}

export function HeroAppShowcase({ content }: { content: ShowcaseContent }) {
  const cards: [string, string, string, string] = [
    content.guarantees[0] ?? "",
    content.guarantees[1] ?? "",
    content.guarantees[2] ?? "",
    content.guarantees[3] ?? "",
  ];

  return (
    <section
      aria-labelledby="hero-showcase-heading"
      className="hero-app-showcase mx-auto mt-14 w-full max-w-[1400px]"
    >
      <h2 id="hero-showcase-heading" className="sr-only">
        {content.heading}
      </h2>
      <HeroSide
        side="left"
        phoneVariant="left"
        cards={[cards[0], cards[1]]}
        label={content.guaranteeLabel}
      />
      <HeroSide
        side="right"
        phoneVariant="right"
        cards={[cards[2], cards[3]]}
        label={content.guaranteeLabel}
      />
    </section>
  );
}
