import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 tabular-nums placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-10 w-full min-w-0 appearance-none rounded-lg border border-zinc-200 bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%2371717a%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat pl-3 pr-8 text-sm text-zinc-900 focus-visible:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10",
      className,
    )}
    {...props}
  />
));
NativeSelect.displayName = "NativeSelect";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10",
        className,
      )}
      {...props}
    />
  );
}
