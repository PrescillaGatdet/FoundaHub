import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { getGroups } from "@/lib/data/groups";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const groups = await getGroups();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Private groups</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Small rooms run by founders who have been through it, organised by industry. What
          gets posted inside stays inside — you can see who runs a group and what it costs
          before you join, and nothing else.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <Link key={g.slug} href={`/groups/${g.slug}`} className="card flex flex-col p-6 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <span
                className="grid h-12 w-12 place-items-center rounded-xl text-2xl"
                style={{ background: `${g.color}14` }}
              >
                {g.coverEmoji}
              </span>
              {g.viewerIsMember && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {g.viewerRole === "owner" ? "You own this" : "Joined"}
                </span>
              )}
            </div>

            <h2 className="mt-4 font-semibold text-slate-900">{g.title}</h2>
            <p className="mt-1 flex-1 text-sm text-slate-600 line-clamp-3">{g.description}</p>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Avatar emoji={g.owner.avatar} color={g.owner.color} size={22} />
              <span>
                Run by <span className="font-medium text-slate-700">{g.owner.name}</span>
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
              <span className="font-semibold text-slate-900">
                {g.priceLabel}
                {g.priceCents > 0 && (
                  <span className="font-normal text-slate-500">
                    /{g.billingPeriod === "monthly" ? "mo" : "once"}
                  </span>
                )}
              </span>
              <span className="text-xs text-slate-500">
                {g.memberCount}/{g.memberLimit} members
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
