import Link from "next/link";
import { cn } from "@/lib/utils";

export function CalendlyLogo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex h-10 items-center gap-2.5", className)} aria-label="Calendly home">
      <img src="/brand/calendly-mark.svg" alt="" className="block size-9 shrink-0" />
      <img src="/brand/calendly-wordmark.svg" alt="Calendly" className="block h-[30px] w-auto shrink-0" />
    </Link>
  );
}
