import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn("flex h-11 w-full rounded-md border border-calendly-line bg-white px-3 text-sm text-calendly-text shadow-sm outline-none transition focus:border-calendly-blue focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50", className)}
      {...props}
    />
  )
);
Input.displayName = "Input";

