"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "./Avatar";
import type { SessionUser } from "@/lib/data/auth";

// Eleven surfaces cannot sit in a nav bar. They group by what the founder is
// trying to do: Learn (free, public, how we get found), Connect (people, where
// the revenue is), Grow (capital, hiring, proof).
//
// Items marked `soon` are designed but not built. Showing them greyed is
// deliberate — it tells members what is coming without pretending it is here.
type Item = { href: string; label: string; soon?: boolean };

const groups: { label: string; items: Item[] }[] = [
  {
    label: "Learn",
    items: [
      { href: "/questions", label: "Questions" },
      { href: "/blog", label: "Blog", soon: true },
      { href: "/training", label: "Training", soon: true },
    ],
  },
  {
    label: "Connect",
    items: [
      { href: "/mentors", label: "Mentors & experts" },
      { href: "/groups", label: "Private groups" },
      { href: "/events", label: "Events" },
    ],
  },
  {
    label: "Grow",
    items: [
      { href: "/funding", label: "Funding", soon: true },
      { href: "/jobs", label: "Jobs", soon: true },
      { href: "/partners", label: "Partner perks", soon: true },
      { href: "/portfolio", label: "Portfolio", soon: true },
    ],
  },
];

export function NavBar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
            🚀
          </span>
          <span className="hidden sm:inline">
            Launch<span className="text-indigo-600">Community</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {groups.map((group) => {
            const groupActive = group.items.some((i) => !i.soon && isActive(i.href));
            return (
              // CSS-only dropdown: hover or keyboard focus anywhere inside opens it,
              // which keeps the whole nav out of the client bundle's state business.
              <div key={group.label} className="group relative">
                <button
                  type="button"
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    groupActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {group.label}
                  <span className="text-[10px] leading-none opacity-60">▼</span>
                </button>

                <div className="invisible absolute left-0 top-full w-56 pt-1 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    {group.items.map((item) =>
                      item.soon ? (
                        <span
                          key={item.href}
                          className="flex cursor-default items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400"
                        >
                          {item.label}
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            Soon
                          </span>
                        </span>
                      ) : (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                            isActive(item.href)
                              ? "bg-indigo-50 font-medium text-indigo-700"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {item.label}
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/ask" className="btn-primary">
            Ask
          </Link>
          {user && (
            <Link
              href="/bookings"
              className="hidden items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-100 sm:flex"
            >
              <Avatar emoji={user.avatar} color={user.color} size={34} />
              <span className="leading-tight">
                <span className="block text-sm font-semibold text-slate-900">{user.name}</span>
                {user.headline && (
                  <span className="block text-xs text-slate-500">{user.headline}</span>
                )}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Small screens get a flat row — dropdowns on touch are a trap. */}
      <div className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-1.5 md:hidden">
        {groups
          .flatMap((g) => g.items)
          .filter((i) => !i.soon)
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium ${
                isActive(item.href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
      </div>
    </header>
  );
}
