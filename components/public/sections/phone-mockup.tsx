"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

// External HTTPS sources are rendered natively because their hosts are not
// known at build time and are intentionally not added to next.config.ts.
const isExternalSource = (src: string) => src.startsWith("https:");

const phoneVariants = {
  left: { src: "/images/hero/left-phone.png", width: 168, height: 397 },
  right: { src: "/images/hero/right-phone.png", width: 168, height: 397 },
} as const;

type PhoneVariant = keyof typeof phoneVariants;

export function PhoneMockup({ variant, alt, src }: { variant: PhoneVariant; alt: string; src?: string | null }) {
  const phone = phoneVariants[variant];
  const prefersReducedMotion = useReducedMotion();
  const startY = variant === "left" ? 180 : -180;

  return (
    <motion.span
      className="phone-mockup-frame block shrink-0"
      initial={prefersReducedMotion ? false : { y: startY, opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
      transition={{
        duration: 1.45,
        delay: variant === "left" ? 0.12 : 0.28,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {isExternalSource(src || phone.src) ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src || phone.src} alt={alt} width={phone.width} height={phone.height} data-variant={variant} className="phone-mockup block size-full max-w-full object-fill" />
      ) : (
        <Image
          src={src || phone.src}
          alt={alt}
          width={phone.width}
          height={phone.height}
          sizes="(max-width: 420px) 42vw, (max-width: 1100px) 180px, 15vw"
          data-variant={variant}
          className="phone-mockup block size-full max-w-full object-fill"
        />
      )}
    </motion.span>
  );
}
