import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { getAdvisors } from "@/lib/data/advisors";
import { getTags } from "@/lib/data/questions";

export const dynamic = "force-dynamic";

const filters = [
  { value: "all", label: "Everyone" },
  { value: "mentors", label: "Free mentorship" },
  { value: "experts", label: "Paid experts" },
] as const;

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; expertise?: string }>;
}) {
  const { filter, expertise } = await searchParams;
  const active = filters.find((f) => f.value === filter)?.value ?? "all";

  const [advisors, tags] = await Promise.all([
    getAdvisors({ filter: active, expertiseSlug: expertise }),
    getTags(),
  ]);

  // Only offer expertise filters that some advisor actually has.
  const expertiseTags = tags.filter((t) => t.kind !== "industry");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mentors & experts</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          One list, two prices. Mentors offer free intro calls; experts charge for deeper
          work. Same people, same booking flow — pick whichever fits what you need.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const params = new URLSearchParams();
          if (f.value !== "all") params.set("filter", f.value);
          if (expertise) params.set("expertise", expertise);
          return (
            <Link
              key={f.value}
              href={`/mentors${params.toString() ? `?${params}` : ""}`}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                active === f.value
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </Link>
          );
        })}

        <span className="mx-1 h-5 w-px bg-slate-200" />

        {expertiseTags.map((t) => {
          const params = new URLSearchParams();
          if (active !== "all") params.set("filter", active);
          if (t.slug !== expertise) params.set("expertise", t.slug);
          const isActive = t.slug === expertise;
          return (
            <Link
              key={t.slug}
              href={`/mentors${params.toString() ? `?${params}` : ""}`}
              className="tag-chip transition-opacity hover:opacity-80"
              style={
                isActive
                  ? { background: t.color, color: "#fff" }
                  : { background: `${t.color}14`, color: t.color }
              }
            >
              {t.name}
            </Link>
          );
        })}
      </div>

      {advisors.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          Nobody matches that filter yet.{" "}
          <Link href="/mentors" className="text-indigo-600">
            See everyone →
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {advisors.map((a) => (
            <div key={a.slug} className="card flex flex-col p-6">
              <div className="flex items-start gap-3">
                <Avatar emoji={a.user.avatar} color={a.user.color} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">{a.user.name}</div>
                  <div className="text-sm text-slate-500">{a.headline}</div>
                </div>
                {a.isAcceptingBookings && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Open
                  </span>
                )}
              </div>

              <p className="mt-4 flex-1 text-sm text-slate-600 line-clamp-4">{a.bio}</p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {a.expertise.map((t) => (
                  <span
                    key={t.slug}
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ background: `${t.color}14`, color: t.color }}
                  >
                    {t.name}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                {a.reviewCount > 0 && (
                  <span className="font-medium text-slate-700">
                    ★ {a.ratingAvg.toFixed(1)}{" "}
                    <span className="font-normal text-slate-400">({a.reviewCount})</span>
                  </span>
                )}
                <span>{a.yearsExperience}+ yrs</span>
                <span>{a.timezone.split("/")[1]?.replace(/_/g, " ") ?? a.timezone}</span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-medium text-slate-600">
                  {a.hasFreeOffering ? (
                    <span className="text-emerald-600">Free intro call</span>
                  ) : (
                    `From ${a.offerings[0]?.priceLabel ?? "—"}`
                  )}
                </span>
                <Link href={`/mentors/${a.slug}`} className="btn-primary px-3 py-2 text-xs">
                  View & book
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
