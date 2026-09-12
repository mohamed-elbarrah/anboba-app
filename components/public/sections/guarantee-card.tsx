import { ShieldCheck } from "lucide-react";

type GuaranteeCardProps = {
  title: string;
  content: string;
  side: "left" | "right";
  locale: "ar" | "en";
};

export function GuaranteeCard({ title, content, side, locale }: GuaranteeCardProps) {
  return (
    <article
      className={`flex min-h-[clamp(96px,6.25vw,111px)] w-full items-center gap-[clamp(16px,1.3vw,24px)] rounded-[40px_40px_4px_40px] border max-[640px]:rounded-[28px_28px_4px_28px] border-white/[.88] bg-[#fffdf8]/60 px-[clamp(8px,1.5vw,14px)] py-[clamp(8px,1vw,14px)] text-start shadow-[0_12px_20px_rgb(111_78_58_/_10%)] max-[1100px]:min-h-[78px] max-[1100px]:gap-2.5 max-[1100px]:p-3 max-[640px]:min-h-[78px] max-[640px]:gap-2 max-[640px]:px-2 max-[640px]:py-2 ${side === "right" ? "rounded-[40px_40px_40px_4px] max-[640px]:rounded-[28px_28px_28px_4px]" : ""}`}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <span className="flex size-[clamp(48px,3.75vw,66px)] shrink-0 items-center justify-center rounded-2xl bg-primary text-white max-[1100px]:size-10 max-[1100px]:rounded-[11px] max-[640px]:size-9 max-[640px]:rounded-[10px]">
        <ShieldCheck
          className="size-[clamp(25px,1.35vw,29px)] max-[1100px]:size-[21px] max-[640px]:size-5"
          aria-hidden="true"
          strokeWidth={2.25}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[clamp(17px,1.15vw,22px)] font-medium leading-[1.35] text-[#8d8986] max-[1100px]:text-[13px] max-[640px]:text-[clamp(11px,3.3vw,14px)]">
          {title}
        </p>
        <h3 className="m-0 text-[clamp(21px,1.45vw,28px)] font-extrabold leading-[1.35] text-foreground max-[1100px]:text-[16px] max-[640px]:text-[14px] max-[640px]:leading-[1.15] max-[640px]:text-center max-[640px]:font-bold">
          {content}
        </h3>
      </div>
    </article>
  );
}
