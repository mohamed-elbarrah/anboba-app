import Link from "next/link";
import { cn } from "@/lib/utils";

const ctaClassName =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

type PublicCtaLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function PublicCtaLink({ href, children, className }: PublicCtaLinkProps) {
  return (
    <Link href={href} className={cn(ctaClassName, className)}>
      {children}
    </Link>
  );
}
