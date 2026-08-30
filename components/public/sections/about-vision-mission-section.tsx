import { Eye, Rocket } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";

type AboutVisionMissionContent = Dictionary["aboutVisionMission"];

export function AboutVisionMissionSection({
  content,
}: {
  content: AboutVisionMissionContent;
}) {
  return (
    <section
      aria-labelledby="about-vision-mission-heading"
      className="bg-background px-5 pb-20 sm:px-8 sm:pb-24 lg:pb-28"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1440px]">
        <h2 id="about-vision-mission-heading" className="sr-only">
          {content.vision.heading} و {content.mission.heading}
        </h2>

        <div className="grid gap-5 lg:grid-cols-2 lg:gap-7">
          <article className="rounded-[2rem] bg-primary px-7 py-8 text-right text-primary-foreground shadow-sm sm:px-10 sm:py-9 lg:min-h-[228px]">
            <Eye
              aria-hidden="true"
              className="ml-auto size-11"
              strokeWidth={2}
            />
            <h3 className="mt-5 text-2xl font-extrabold sm:text-3xl">
              {content.vision.heading}
            </h3>
            <p className="mt-5 text-base leading-8 sm:text-lg sm:leading-9">
              {content.vision.description}
            </p>
          </article>

          <article className="rounded-[2rem] border border-border/70 bg-card px-7 py-8 text-right text-card-foreground shadow-sm sm:px-10 sm:py-9 lg:min-h-[228px]">
            <Rocket
              aria-hidden="true"
              className="ml-auto size-11 text-primary"
              strokeWidth={2}
            />
            <h3 className="mt-5 text-2xl font-extrabold text-foreground sm:text-3xl">
              {content.mission.heading}
            </h3>
            <p className="mt-5 text-base leading-8 sm:text-lg sm:leading-9">
              {content.mission.description}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
