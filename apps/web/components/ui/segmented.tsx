"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/** iOS-style two or three way switch */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  className?: string;
}) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={(v) => onChange(v as T)}>
      <TabsPrimitive.List className={cn("inline-flex w-full rounded-lg bg-zinc-100 p-1", className)}>
        {options.map((o) => (
          <TabsPrimitive.Trigger
            key={o.value}
            value={o.value}
            className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
          >
            {o.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
