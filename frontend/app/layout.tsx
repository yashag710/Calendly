import type { Metadata } from "next";
import { AppLayoutShell } from "@/components/AppLayoutShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calendly",
  description: "A polished Calendly-inspired scheduling platform"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppLayoutShell>{children}</AppLayoutShell>
      </body>
    </html>
  );
}
