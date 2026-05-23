"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  Link2,
  Menu,
  Plus,
  X
} from "lucide-react";
import { CalendlyLogo } from "@/components/CalendlyLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Section =
  | "Scheduling"
  | "Meetings"
  | "Availability";

const primaryItems = [
  { label: "Scheduling", href: "/", icon: Link2 },
  { label: "Meetings", href: "/meetings", icon: CalendarDays },
  { label: "Availability", href: "/availability", icon: Clock3 }
] as const;

function CalendlyMark() {
  return <img src="/brand/calendly-mark.svg" alt="Calendly" className="size-[38px] shrink-0" />;
}

function SidebarContent({
  activeSection,
  collapsed,
  onToggle,
  onNavigate
}: {
  activeSection?: Section;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = activeSection ?? primaryItems.find((item) => item.href === pathname)?.label ?? "Scheduling";

  return (
    <div className={cn("flex h-full flex-col bg-white text-[#0b3558]", collapsed ? "items-center" : "")}>
      <div className={cn("flex h-[82px] items-center", collapsed ? "justify-center px-0" : "justify-between px-7")}>
        {collapsed ? <CalendlyMark /> : <CalendlyLogo className="text-[26px]" />}
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggle}
          className={cn(
            "grid place-items-center rounded-full text-[#0b3558] transition hover:bg-[#eaf3ff] hover:text-[#006bff]",
            collapsed
              ? "absolute -right-[17px] top-[28px] z-30 size-9 border border-[#d7e2ee] bg-white shadow-sm"
              : "size-9 rounded-full"
          )}
        >
          {collapsed ? <ChevronsRight className="size-5" /> : <ChevronsLeft className="size-5" />}
        </button>
      </div>

      <div className={cn("pt-4", collapsed ? "px-0" : "px-5")}>
        <Button
          asChild
          variant="outline"
          className={cn(
            "border-[#91a7bf] bg-white font-bold text-[#0b3558] hover:bg-[#eaf3ff]",
            collapsed ? "size-[50px] rounded-full p-0" : "h-[44px] w-full rounded-full text-[14px]"
          )}
        >
          <Link
            href="/?create=sidebar"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              window.dispatchEvent(new CustomEvent("open-create-event", {
                detail: {
                  top: rect.top,
                  left: rect.right + 12
                }
              }));
              onNavigate?.();
            }}
            aria-label="Create event type"
          >
            <Plus className={collapsed ? "size-6" : "size-5"} />
            {!collapsed && "Create"}
          </Link>
        </Button>
      </div>

      <nav className={cn("mt-7 grid text-[#0b3558]", collapsed ? "w-full gap-2 px-2" : "gap-2 px-4 text-[14px] font-bold")}>
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.label;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "relative flex transition-colors",
                collapsed
                  ? "min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg px-1 text-center text-[12px] font-bold leading-[15px]"
                  : "h-10 items-center gap-3 rounded-lg px-3 text-[14px] font-bold",
                isActive ? "bg-[#f1f6ff] text-[#006bff]" : "hover:bg-[#f6f8fb] hover:text-[#006bff]",
                isActive && !collapsed && "before:absolute before:left-[-16px] before:h-9 before:w-1 before:rounded-r before:bg-[#006bff]",
                isActive && collapsed && "before:absolute before:left-[-8px] before:h-10 before:w-1 before:rounded-r before:bg-[#006bff]"
              )}
            >
              <Icon className={cn("shrink-0 stroke-[2.25]", collapsed ? "size-5" : "size-[18px]")} />
              <span className={cn("min-w-0", collapsed ? "max-w-[78px]" : "truncate")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pb-6" />
    </div>
  );
}

export function CalendlyAppLayout({
  children,
  activeSection
}: {
  children: React.ReactNode;
  activeSection?: Section;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarWidth = collapsed ? "lg:pl-[108px]" : "lg:pl-[280px]";

  return (
    <div className="min-h-screen bg-[#fbfcff] text-[#0b3558]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-[#d7e2ee] bg-white transition-[width] duration-200 ease-out lg:flex lg:flex-col",
          collapsed ? "w-[108px]" : "w-[280px]"
        )}
      >
        <SidebarContent activeSection={activeSection} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      </aside>

      <div className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#d7e2ee] bg-white px-4 lg:hidden">
        <button className="grid size-10 place-items-center rounded-full border border-[#d7e2ee]" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <CalendlyLogo className="text-[24px]" />
        <button className="grid size-9 place-items-center rounded-full bg-[#eef3fb] text-sm font-bold">Y</button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-[#0b3558]/35" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-[280px] border-r border-[#d7e2ee] bg-white shadow-2xl">
            <button className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-[#f6f8fb]" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="size-5" />
            </button>
            <SidebarContent activeSection={activeSection} collapsed={false} onToggle={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className={cn("transition-[padding] duration-200 ease-out", sidebarWidth)}>
        {children}
      </div>
    </div>
  );
}
