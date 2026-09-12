import { GuaranteeCard } from "@/components/public/sections/guarantee-card";
import { PhoneMockup } from "@/components/public/sections/phone-mockup";
import type { Locale } from "@/lib/locales";

type ShowcaseSide = "left" | "right";

export type HeroSideProps = {
  side: ShowcaseSide;
  phoneVariant: "left" | "right";
  cards: readonly [{ title: string; content: string }, { title: string; content: string }];
  phoneAlt: string;
  phoneSrc?: string | null;
  locale: Locale;
};

type ShowcaseContent = {
  heading: string;
  guarantees: readonly { title: string; content: string }[];
  phoneLeftAlt: string;
  phoneRightAlt: string;
};

export function HeroSide({ side, phoneVariant, cards, phoneAlt, phoneSrc, locale }: HeroSideProps) {
  return (
    <div className={`hero-side hero-side-${side}`}>
      <div className="hero-side-cards">
        {cards.map((card, index) => (
          <GuaranteeCard
            key={`${side}-${index}`}
            title={card.title}
            content={card.content}
            side={side}
            locale={locale}
          />
        ))}
      </div>
      <PhoneMockup variant={phoneVariant} alt={phoneAlt} src={phoneSrc} />
    </div>
  );
}

export function HeroAppShowcase({ content, locale, media }: { content: ShowcaseContent; locale: Locale; media?: { left: string | null; right: string | null } }) {
  const cards = [
    content.guarantees[0] ?? { title: "", content: "" },
    content.guarantees[1] ?? { title: "", content: "" },
    content.guarantees[2] ?? { title: "", content: "" },
    content.guarantees[3] ?? { title: "", content: "" },
  ] as const;

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
        phoneAlt={content.phoneLeftAlt}
        phoneSrc={media?.left}
        locale={locale}
      />
      <HeroSide
        side="right"
        phoneVariant="right"
        cards={[cards[2], cards[3]]}
        phoneAlt={content.phoneRightAlt}
        phoneSrc={media?.right}
        locale={locale}
      />
    </section>
  );
}
