"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Info } from "lucide-react";

export const TooltipProvider = TooltipPrimitive.Provider;

/** small (i) icon that explains a term on hover, focus or tap */
export function InfoTip({ children, label = "What does this mean?" }: { children: React.ReactNode; label?: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <TooltipPrimitive.Root open={open} onOpenChange={setOpen} delayDuration={150}>
      <TooltipPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={6}
          className="z-50 max-w-[260px] rounded-lg bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg"
        >
          {children}
          <TooltipPrimitive.Arrow className="fill-zinc-900" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
