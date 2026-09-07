import Image from "next/image";

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

  return (
    <span className="phone-mockup-frame block shrink-0">
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
    </span>
  );
}
