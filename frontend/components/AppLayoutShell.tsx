"use client";

import { usePathname } from "next/navigation";
import { CalendlyAppLayout } from "@/components/CalendlyAppLayout";

const publicPrefixes = ["/book", "/confirmation"];

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = publicPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isPublicPage) {
    return <>{children}</>;
  }

  return <CalendlyAppLayout>{children}</CalendlyAppLayout>;
}
