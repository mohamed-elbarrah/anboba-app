import Image from "next/image";

const phoneVariants = {
  left: {
    src: "/images/hero/left-phone.png",
    width: 168,
    height: 397,
    alt: "تطبيق أنبوبة لطلب أسطوانة الغاز",
  },
  right: {
    src: "/images/hero/right-phone.png",
    width: 168,
    height: 397,
    alt: "تطبيق أنبوبة لتتبع طلب التوصيل",
  },
} as const;

type PhoneVariant = keyof typeof phoneVariants;

export function PhoneMockup({ variant }: { variant: PhoneVariant }) {
  const phone = phoneVariants[variant];

  return (
    <span className="phone-mockup-frame block shrink-0">
      <Image
        src={phone.src}
        alt={phone.alt}
        width={phone.width}
        height={phone.height}
        sizes="(max-width: 420px) 42vw, (max-width: 1100px) 180px, 15vw"
        data-variant={variant}
        className="phone-mockup block size-full max-w-full object-fill"
      />
    </span>
  );
}
