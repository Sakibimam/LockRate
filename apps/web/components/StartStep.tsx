"use client";

import { ArrowRight, Server, ShoppingCart } from "lucide-react";
import type { Profile } from "@lockrate/engine";
import { EXAMPLE_LABELS } from "@/lib/words";

interface Props {
  profiles: Profile[];
  onRole: (role: Profile["role"]) => void;
  onExample: (p: Profile) => void;
}

const CHOICES = [
  { role: "operator" as const, icon: Server, title: "I rent out GPUs", sub: "Host, cloud or marketplace seller" },
  { role: "buyer" as const, icon: ShoppingCart, title: "I pay for GPUs", sub: "AI team, startup or lab" },
];

export function StartStep({ profiles, onRole, onExample }: Props) {
  return (
    <div className="mx-auto max-w-2xl py-6 text-center sm:py-12">
      <h1 className="text-balance text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
        Will GPU price swings hurt your business?
      </h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-zinc-500">Answer two questions. Get a clear yes or no in 30 seconds.</p>

      <div className="mt-10 grid gap-3 text-left sm:grid-cols-2">
        {CHOICES.map((c) => (
          <button
            key={c.role}
            type="button"
            onClick={() => onRole(c.role)}
            className="group flex items-center gap-4 rounded-2xl text-left border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-zinc-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 sm:flex-col sm:items-start sm:p-6"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 transition group-hover:bg-zinc-900 group-hover:text-white">
              <c.icon className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-base font-semibold text-zinc-900">{c.title}</span>
              <span className="mt-0.5 block text-sm text-zinc-500">{c.sub}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-900 sm:hidden" />
          </button>
        ))}
      </div>

      <div className="mt-10">
        <p className="text-sm text-zinc-500">Or see a real example</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onExample(p)}
              className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
            >
              {EXAMPLE_LABELS[p.id] ?? p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
