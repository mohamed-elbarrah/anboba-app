import { ShieldCheck } from "lucide-react";

type GuaranteeCardProps = {
  label: string;
  title: string;
  side: "left" | "right";
};

export function GuaranteeCard({ label, title, side }: GuaranteeCardProps) {
  return (
    <article className={`guarantee-card guarantee-card-${side}`} dir="rtl">
      <span className="guarantee-card-icon">
        <ShieldCheck aria-hidden="true" strokeWidth={2.25} />
      </span>
      <div className="guarantee-card-copy">
        <p>{label}</p>
        <h3 className="font-bold ">{title}</h3>
      </div>
    </article>
  );
}
