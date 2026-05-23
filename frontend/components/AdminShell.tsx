import Link from "next/link";
import { CalendarCheck2, CalendarDays, Clock3, Plus } from "lucide-react";
import { CalendlyLogo } from "@/components/CalendlyLogo";

export function AdminShell({ children, title, action }: { children: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-calendly-wash">
      <header className="sticky top-0 z-30 border-b border-calendly-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <CalendlyLogo />
          <nav className="hidden items-center gap-8 text-[15px] font-semibold text-calendly-text md:flex">
            <Link className="hover:text-calendly-blue" href="/">Event types</Link>
            <Link className="hover:text-calendly-blue" href="/availability">Availability</Link>
            <Link className="hover:text-calendly-blue" href="/meetings">Meetings</Link>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link className="text-sm font-semibold text-calendly-text hover:text-calendly-blue" href="/book">Public page</Link>
            {action}
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="hidden min-h-[calc(100vh-76px)] border-r border-calendly-line bg-white px-5 py-8 lg:block">
          <nav className="grid gap-2 text-sm font-semibold text-calendly-text">
            <Link className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-blue-50 hover:text-calendly-blue" href="/">
              <CalendarDays className="size-5" />
              Event types
            </Link>
            <Link className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-blue-50 hover:text-calendly-blue" href="/availability">
              <Clock3 className="size-5" />
              Availability
            </Link>
            <Link className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-blue-50 hover:text-calendly-blue" href="/meetings">
              <CalendarCheck2 className="size-5" />
              Meetings
            </Link>
            <Link className="mt-4 flex items-center gap-3 rounded-lg border border-calendly-line px-3 py-3 text-calendly-blue hover:bg-blue-50" href="/">
              <Plus className="size-5" />
              Create
            </Link>
          </nav>
        </aside>
        <main className="px-5 py-8 md:px-8 lg:px-10">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-calendly-blue">Workspace</p>
              <h1 className="mt-2 text-4xl font-bold tracking-normal text-calendly-navy md:text-5xl">{title}</h1>
            </div>
            <div className="md:hidden">{action}</div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
