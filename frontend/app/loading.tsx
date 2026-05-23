import { CalendlyShimmer } from "@/components/CalendlyShimmer";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfbfc]">
      <CalendlyShimmer />
    </main>
  );
}
