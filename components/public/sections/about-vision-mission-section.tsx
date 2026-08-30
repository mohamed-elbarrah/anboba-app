import { Eye, Rocket } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";

type AboutVisionMissionContent = Dictionary["aboutVisionMission"];

export function AboutVisionMissionSection({
  content,
  locale = "ar",
}: {
  content: AboutVisionMissionContent;
  locale?: "ar" | "en";
}) {
  const conjunction = locale === "ar" ? "و" : "and";

  return (
    <section
      aria-labelledby="about-vision-mission-heading"
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="bg-background px-5 pb-20 sm:px-8 sm:pb-24 lg:pb-28"
    >
      <div className="mx-auto max-w-[1440px]">
        <h2 id="about-vision-mission-heading" className="sr-only">
          {content.vision.heading} {conjunction} {content.mission.heading}
        </h2>

        <div className="grid gap-5 lg:grid-cols-2 lg:gap-7">
          <article className="rounded-[2rem] bg-primary px-7 py-8 text-start text-primary-foreground shadow-sm sm:px-10 sm:py-9 lg:min-h-[260px]">
            <Eye
              aria-hidden="true"
              className="size-14 self-start"
              strokeWidth={2}
            />
            <h3 className="mt-5 text-2xl font-extrabold sm:text-3xl lg:text-[2rem]">
              {content.vision.heading}
            </h3>
            <p className="mt-5 text-base leading-8 sm:text-lg sm:leading-9 lg:text-[1.15rem] lg:leading-relaxed">
              {content.vision.description}
            </p>
          </article>

          <article className="rounded-[2rem] border border-border/70 bg-card px-7 py-8 text-start text-card-foreground shadow-sm sm:px-10 sm:py-9 lg:min-h-[260px]">
            <Rocket
              aria-hidden="true"
              className="size-14 self-start text-primary"
              strokeWidth={2}
            />
            <h3 className="mt-5 text-2xl font-extrabold text-foreground sm:text-3xl lg:text-[2rem]">
              {content.mission.heading}
            </h3>
            <p className="mt-5 text-base leading-8 sm:text-lg sm:leading-9 lg:text-[1.15rem] lg:leading-relaxed">
              {content.mission.description}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
