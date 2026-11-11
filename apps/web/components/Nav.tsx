"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Check my risk" },
  { href: "/live", label: "Place a hedge" },
  { href: "/report", label: "Monthly statement" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="-mx-3 flex max-w-full gap-1 overflow-x-auto text-sm sm:mx-0">
      {LINKS.map((l) => {
        const on = path === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={on ? "page" : undefined}
            className="whitespace-nowrap rounded-lg px-3 py-1.5"
            style={on ? { background: "var(--surface)", fontWeight: 600, boxShadow: "0 0 0 1px var(--line)" } : { color: "var(--muted)" }}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
