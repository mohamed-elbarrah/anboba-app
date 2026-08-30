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
        className="mx-auto max-w-[1440px]"
      >
        <header className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center rounded-full bg-primary/10 px-5 py-2 text-sm font-extrabold text-primary shadow-sm sm:text-base">
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
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base lg:text-[1.35rem] lg:leading-relaxed">
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
              className="h-auto w-[min(72vw,320px)] object-contain sm:w-[min(52vw,360px)] lg:w-full lg:max-w-[620px]"
            />
          </div>

          <div dir="rtl" className="flex flex-col gap-6 text-right">
            <article className="rounded-[2rem] border border-white/90 bg-white/50 px-6 py-7 shadow-[0_5px_8px_rgb(111_78_58_/_10%)] sm:px-9 sm:py-9 lg:rounded-[2.25rem] lg:px-12 lg:py-9">
              <h3 className="text-xl font-extrabold text-foreground sm:text-2xl lg:text-[2rem]">
                {content.cardHeading}
              </h3>
              <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base lg:text-[1.35rem] lg:leading-[1.55]">
                {content.cardParagraph}
              </p>
            </article>

            <div>
              <h3 id="why-choose-us-features-heading" className="sr-only">
                {content.featuresHeading}
              </h3>
              <ul
                aria-labelledby="why-choose-us-features-heading"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-8"
              >
                {content.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex min-h-12 items-center gap-3 rounded-xl border border-white/90 bg-white/50 px-4 py-3 text-sm font-bold text-foreground shadow-[0_5px_8px_rgb(111_78_58_/_8%)] sm:min-h-[74px] sm:px-6 sm:py-4 lg:text-[1.2rem]"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-transparent text-primary"
                    >
                      <Check
                        className="size-4"
                        strokeWidth={2.5}
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
