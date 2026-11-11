"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    <SliderPrimitive.Root ref={ref} className={cn("relative flex w-full touch-none select-none items-center py-2", className)} {...props}>
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-zinc-200">
        <SliderPrimitive.Range className="absolute h-full bg-zinc-900" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={props["aria-label"]}
        className="block h-5 w-5 rounded-full border-2 border-zinc-900 bg-white shadow transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/15"
      />
    </SliderPrimitive.Root>
  ),
);
Slider.displayName = "Slider";
