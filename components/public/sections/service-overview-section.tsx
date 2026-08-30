import Image from "next/image";
import type { Dictionary } from "@/lib/dictionaries";
import { ANBOBA_IMAGE_DIMENSIONS } from "@/lib/public-images";

type ServiceOverviewContent = Dictionary["serviceOverview"];

export function ServiceOverviewSection({
  content,
}: {
  content: ServiceOverviewContent;
}) {
  return (
    <section
      aria-labelledby="service-overview-heading"
      className="bg-background px-5 py-10 pb-20 sm:px-8 sm:py-14 sm:pb-24 lg:py-16 lg:pb-28"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] [direction:ltr] border border-border/70 bg-card/80 px-6 py-8 shadow-sm sm:gap-10 sm:px-10 sm:py-9 lg:grid-cols-[140px_minmax(0,1fr)] lg:gap-16 lg:px-16 lg:py-10">
          <div className="flex justify-center [direction:ltr] lg:justify-start">
            <Image
              src="/images/anboba-img.png"
              alt={content.imageAlt}
              width={ANBOBA_IMAGE_DIMENSIONS.width}
              height={ANBOBA_IMAGE_DIMENSIONS.height}
              sizes="(max-width: 639px) 180px, (max-width: 1023px) 160px, 140px"
              className="h-auto w-[min(52vw,180px)] object-contain sm:w-[160px] lg:w-[140px]"
            />
          </div>
          <div dir="rtl" className="text-center lg:text-right">
            <h2
              id="service-overview-heading"
              className="leading-tight tracking-tight"
            >
              <span className="block text-base font-extrabold text-primary sm:text-lg">
                {content.highlightedHeading}
              </span>
              <span className="mt-2 block text-2xl font-extrabold text-foreground sm:text-3xl">
                {content.primaryHeading}
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base lg:mx-0">
              {content.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
