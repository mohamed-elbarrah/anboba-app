import { GuaranteeCard } from "@/components/public/sections/guarantee-card";
import { PhoneMockup } from "@/components/public/sections/phone-mockup";

type ShowcaseContent = {
  heading: string;
  guaranteeLabel: string;
  guarantees: readonly string[];
};

export function HeroAppShowcase({ content }: { content: ShowcaseContent }) {
  const [first, second, third, fourth]: [string, string, string, string] = [
    content.guarantees[0] ?? "",
    content.guarantees[1] ?? "",
    content.guarantees[2] ?? "",
    content.guarantees[3] ?? "",
  ];

  return (
    <section
      aria-labelledby="hero-showcase-heading"
      className="hero-app-showcase mx-auto mt-14 w-full max-w-[920px]"
    >
      <h2 id="hero-showcase-heading" className="sr-only">
        {content.heading}
      </h2>
      <div className="showcase-card showcase-card-top-left">
        <GuaranteeCard label={content.guaranteeLabel} title={first} side="left" />
      </div>
      <div className="showcase-card showcase-card-bottom-left">
        <GuaranteeCard label={content.guaranteeLabel} title={second} side="left" />
      </div>
      <div className="showcase-card showcase-card-top-right">
        <GuaranteeCard label={content.guaranteeLabel} title={third} side="right" />
      </div>
      <div className="showcase-card showcase-card-bottom-right">
        <GuaranteeCard label={content.guaranteeLabel} title={fourth} side="right" />
      </div>
      <div className="showcase-phones flex items-start justify-center">
        <PhoneMockup variant="left" />
        <PhoneMockup variant="right" />
      </div>
    </section>
  );
}
