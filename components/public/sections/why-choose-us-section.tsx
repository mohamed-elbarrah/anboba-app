import Image from "next/image";
import { Check } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import { ANBOBA_IMAGE_DIMENSIONS } from "@/lib/public-images";
import { MotionListItem, MotionReveal } from "@/components/public/motion";

const isExternalSource = (src: string) => src.startsWith("https:");

type WhyChooseUsContent = Dictionary["whyChooseUs"];
type WhyChooseUsVariant = "default" | "about";
type WhyChooseUsHeadingLevel = "h1" | "h2";

export function WhyChooseUsSection({
  content,
  variant = "default",
  headingLevel = "h2",
  locale = "ar",
  imageSrc = "/images/anboba-img.png",
}: {
  content: WhyChooseUsContent;
  variant?: WhyChooseUsVariant;
  headingLevel?: WhyChooseUsHeadingLevel;
  locale?: "ar" | "en";
  imageSrc?: string;
}) {
  const isAbout = variant === "about";
  const Heading = headingLevel;

  return (
    <section
      aria-labelledby="why-choose-us-heading"
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`bg-background px-4 sm:px-8 ${
        isAbout ? "py-20 sm:py-20 lg:py-24" : "py-20 sm:py-24 lg:py-32"
      }`}
    >
      <div className="mx-auto max-w-[1440px]">
        <header className="mx-auto max-w-2xl text-center">
          <MotionReveal y={14}>
            <p className="inline-flex items-center rounded-full bg-primary/10 px-5 py-2 text-sm font-extrabold text-primary shadow-sm sm:text-base">
              {content.eyebrow}
            </p>
          </MotionReveal>
          <MotionReveal y={18} delay={0.2}>
            <Heading
              id="why-choose-us-heading"
              className={`mt-3 text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl ${
                isAbout ? "lg:text-4xl" : "lg:text-5xl"
              }`}
            >
              {content.headingStart}
              <span className="text-primary">{content.headingHighlight}</span>
            </Heading>
          </MotionReveal>
          <MotionReveal y={18} delay={0.4}>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base lg:text-[1.35rem] lg:leading-relaxed">
              {content.subtitle}
            </p>
          </MotionReveal>
        </header>

        <div className="mt-14 grid items-center gap-12 [direction:ltr] sm:mt-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-20">
          <MotionReveal className="flex justify-center lg:justify-start" x={-55}>
            {isExternalSource(imageSrc) ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={imageSrc} alt={content.imageAlt} width={ANBOBA_IMAGE_DIMENSIONS.width} height={ANBOBA_IMAGE_DIMENSIONS.height} className="h-auto w-[min(84vw,360px)] object-contain sm:w-[min(52vw,360px)] lg:w-full lg:max-w-[620px]" />
            ) : (
              <Image src={imageSrc} alt={content.imageAlt} width={ANBOBA_IMAGE_DIMENSIONS.width} height={ANBOBA_IMAGE_DIMENSIONS.height} sizes="(max-width: 639px) 260px, (max-width: 1023px) 340px, 430px" className="h-auto w-[min(84vw,360px)] object-contain sm:w-[min(52vw,360px)] lg:w-full lg:max-w-[620px]" />
            )}
          </MotionReveal>

          <div dir={locale === "ar" ? "rtl" : "ltr"} className="flex flex-col gap-6 text-start">
            <MotionReveal x={55}>
            <article className="rounded-[1.75rem] border border-white/90 bg-white/50 px-5 py-6 shadow-[0_5px_8px_rgb(111_78_58_/_10%)] sm:rounded-[2rem] sm:px-9 sm:py-9 lg:rounded-[2.25rem] lg:px-12 lg:py-9">
              <h3 className="text-xl font-extrabold text-foreground sm:text-2xl lg:text-[2rem]">
                {content.cardHeading}
              </h3>
              <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base lg:text-[1.35rem] lg:leading-[1.55]">
                {content.cardParagraph}
              </p>
            </article>
            </MotionReveal>

            <div>
              <h3 id="why-choose-us-features-heading" className="sr-only">
                {content.featuresHeading}
              </h3>
              <ul
                aria-labelledby="why-choose-us-features-heading"
                className="grid grid-cols-2 gap-2 sm:gap-4 lg:gap-8"
              >
                {content.features.map((feature, index) => (
                  <MotionListItem
                    key={feature}
                    className="flex min-h-14 min-w-0 items-center gap-2 rounded-xl border border-white/90 bg-white/50 px-2 py-3 text-xs font-bold text-foreground shadow-[0_5px_8px_rgb(111_78_58_/_8%)] sm:min-h-[74px] sm:gap-3 sm:px-6 sm:py-4 sm:text-sm lg:text-[1.2rem]"
                    x={index % 2 === 0 ? 28 : -28}
                    delay={0.2 + index * 0.15}
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-5 lg:size-6 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-transparent text-primary"
                    >
                      <Check className="size-4" strokeWidth={2.5} />
                    </span>
                    <span>{feature}</span>
                  </MotionListItem>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
