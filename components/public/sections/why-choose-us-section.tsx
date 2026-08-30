import Image from "next/image";
import { Check } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import { ANBOBA_IMAGE_DIMENSIONS } from "@/lib/public-images";

type WhyChooseUsContent = Dictionary["whyChooseUs"];
type WhyChooseUsVariant = "default" | "about";
type WhyChooseUsHeadingLevel = "h1" | "h2";

export function WhyChooseUsSection({
  content,
  variant = "default",
  headingLevel = "h2",
}: {
  content: WhyChooseUsContent;
  variant?: WhyChooseUsVariant;
  headingLevel?: WhyChooseUsHeadingLevel;
}) {
  const isAbout = variant === "about";
  const Heading = headingLevel;

  return (
    <section
      aria-labelledby="why-choose-us-heading"
      className={`bg-background px-5 sm:px-8 ${
        isAbout ? "py-20 sm:py-20 lg:py-24" : "py-20 sm:py-24 lg:py-32"
      }`}
      dir="rtl"
    >
      <div
        className={`mx-auto ${isAbout ? "max-w-[1440px]" : "max-w-[1100px]"}`}
      >
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-extrabold text-primary sm:text-base">
            {content.eyebrow}
          </p>
          <Heading
            id="why-choose-us-heading"
            className={`mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl ${
              isAbout ? "lg:text-4xl" : "lg:text-5xl"
            }`}
          >
            {content.headingStart}
            <span className="text-primary">{content.headingHighlight}</span>
          </Heading>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
            {content.subtitle}
          </p>
        </header>

        <div className="mt-14 grid items-center gap-12 [direction:ltr] sm:mt-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-20">
          <div className="flex justify-center lg:justify-start">
            <Image
              src="/images/anboba-img.png"
              alt={content.imageAlt}
              width={ANBOBA_IMAGE_DIMENSIONS.width}
              height={ANBOBA_IMAGE_DIMENSIONS.height}
              sizes="(max-width: 639px) 260px, (max-width: 1023px) 340px, 430px"
              className="h-auto w-[min(72vw,320px)] object-contain sm:w-[min(52vw,360px)] lg:w-full lg:max-w-[430px]"
            />
          </div>

          <div dir="rtl" className="flex flex-col gap-6 text-right">
            <article className="rounded-[2rem] border border-border/70 bg-card px-6 py-7 shadow-sm sm:px-9 sm:py-9">
              <h3 className="text-xl font-extrabold text-foreground sm:text-2xl">
                {content.cardHeading}
              </h3>
              <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">
                {content.cardParagraph}
              </p>
            </article>

            <div>
              <h3 id="why-choose-us-features-heading" className="sr-only">
                {content.featuresHeading}
              </h3>
              <ul
                aria-labelledby="why-choose-us-features-heading"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
              >
                {content.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex min-h-12 items-center gap-3 rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm font-bold text-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className={`flex shrink-0 items-center justify-center rounded-full ${
                        isAbout
                          ? "size-5 border-2 border-primary bg-transparent text-primary"
                          : "size-6 bg-primary text-primary-foreground"
                      }`}
                    >
                      <Check
                        className={isAbout ? "size-3.5" : "size-4"}
                        strokeWidth={isAbout ? 2.5 : 3}
                      />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
