import { ShieldCheck } from "lucide-react";

type GuaranteeCardProps = {
  label: string;
  title: string;
  side: "left" | "right";
};

export function GuaranteeCard({ label, title, side }: GuaranteeCardProps) {
  return (
    <article
      className={`guarantee-card guarantee-card-${side} flex min-h-[80px] items-center gap-4 border border-border bg-card px-5 py-3 text-right shadow-md [direction:rtl]`}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <ShieldCheck aria-hidden="true" className="size-[21px]" strokeWidth={2.25} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium leading-5 text-muted-foreground">{label}</p>
        <h3 className="text-base font-bold leading-5 text-foreground">{title}</h3>
      </div>
    </article>
  );
}
