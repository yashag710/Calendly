"use client";

import { cn } from "@/lib/utils";

export function CalendlyShimmer({
  className,
  label = "Loading"
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("calendly-shimmer-loader", className)} role="status" aria-label={label}>
      <span className="calendly-shimmer-block" />
      <span className="calendly-shimmer-block" />
      <span className="calendly-shimmer-block" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
