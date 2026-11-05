import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { getAdvisor } from "@/lib/data/advisors";
import { bookOfferingAction } from "@/app/actions";
import { formatEventDate, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdvisorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ offering?: string }>;
}) {
  const [{ slug }, { offering }] = await Promise.all([params, searchParams]);
  const advisor = await getAdvisor(slug);

  if (!advisor) notFound();

  const selected =
    advisor.offerings.find((o) => o.id === offering) ?? advisor.offerings[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/mentors" className="text-sm text-indigo-600 hover:underline">
        ← All mentors & experts
      </Link>

      <div className="mt-3 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="card p-6">
            <div className="flex flex-wrap items-start gap-4">
              <Avatar emoji={advisor.user.avatar} color={advisor.user.color} size={72} />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-slate-900">{advisor.user.name}</h1>
                <p className="text-slate-600">{advisor.headline}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  {advisor.company && <span>{advisor.company}</span>}
                  <span>{advisor.yearsExperience}+ years</span>
                  <span>{advisor.timezone.replace(/_/g, " ")}</span>
                  {advisor.reviewCount > 0 && (
                    <span className="font-medium text-slate-700">
                      ★ {advisor.ratingAvg.toFixed(1)} ({advisor.reviewCount})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="mt-5 whitespace-pre-wrap text-slate-700">{advisor.bio}</p>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {advisor.expertise.map((t) => (
                <span
                  key={t.slug}
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ background: `${t.color}14`, color: t.color }}
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>

          <h2 className="mb-3 mt-8 text-lg font-bold text-slate-900">What you can book</h2>
          <div className="space-y-3">
            {advisor.offerings.map((o) => (
              <Link
                key={o.id}
                href={`/mentors/${advisor.slug}?offering=${o.id}`}
                scroll={false}
                className={`card block p-5 transition-colors ${
                  selected?.id === o.id ? "border-indigo-300 bg-indigo-50/40" : "hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{o.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{o.description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {o.kind === "async_review"
                        ? "Written, async"
                        : `${o.durationMin} minutes, live`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
                      o.isFree ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {o.priceLabel}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {advisor.reviews.length > 0 && (
            <>
              <h2 className="mb-3 mt-8 text-lg font-bold text-slate-900">Reviews</h2>
              <div className="space-y-3">
                {advisor.reviews.map((r) => (
                  <div key={r.id} className="card p-5">
                    <div className="flex items-center gap-2">
                      <Avatar emoji={r.author.avatar} color={r.author.color} size={28} />
                      <span className="text-sm font-medium text-slate-800">{r.author.name}</span>
                      <span className="text-sm text-amber-500">{"★".repeat(r.rating)}</span>
                      <span className="text-xs text-slate-400">· {timeAgo(r.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{r.body}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Reviews can only be left by someone who completed a booking — one review per
                session.
              </p>
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            {advisor.viewerBooking ? (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Your booking
                </h2>
                <p className="mt-2 font-semibold text-slate-900">
                  {advisor.viewerBooking.offeringTitle}
                </p>
                <p className="text-sm text-slate-600">
                  {formatEventDate(advisor.viewerBooking.startsAt)}
                </p>
                <p className="mt-1 text-xs capitalize text-slate-500">
                  Status: {advisor.viewerBooking.status}
                </p>
                <Link href="/bookings" className="btn-ghost mt-4 w-full">
                  Manage bookings
                </Link>
              </div>
            ) : advisor.viewerIsAdvisor ? (
              <p className="text-sm text-slate-500">This is your own profile.</p>
            ) : !advisor.isAcceptingBookings ? (
              <p className="text-sm text-slate-500">
                {advisor.user.name} isn&apos;t taking bookings right now.
              </p>
            ) : !selected ? (
              <p className="text-sm text-slate-500">Nothing bookable right now.</p>
            ) : advisor.slots.length === 0 ? (
              <p className="text-sm text-slate-500">No open times in the next two weeks.</p>
            ) : (
              <form action={bookOfferingAction} className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Book {selected.title}
                </h2>
                <input type="hidden" name="offeringId" value={selected.id} />

                <div>
                  <span className="label">Pick a time</span>
                  <div className="mt-1 grid max-h-64 gap-1.5 overflow-y-auto">
                    {advisor.slots.map((s, i) => (
                      <label key={s.id} className="cursor-pointer">
                        <input
                          type="radio"
                          name="slotId"
                          value={s.id}
                          defaultChecked={i === 0}
                          required
                          className="peer sr-only"
                        />
                        <span className="block rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 peer-checked:border-indigo-400 peer-checked:bg-indigo-50 peer-checked:font-medium peer-checked:text-indigo-700">
                          {formatEventDate(s.startsAt)}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Times shown in your browser&apos;s timezone.
                  </p>
                </div>

                <div>
                  <label className="label" htmlFor="note">
                    What do you want to cover?
                  </label>
                  <textarea
                    id="note"
                    name="note"
                    rows={3}
                    placeholder="One or two sentences is plenty."
                    className="input resize-y text-sm"
                  />
                </div>

                <button type="submit" className="btn-primary w-full">
                  {selected.isFree ? "Book — free" : `Request — ${selected.priceLabel}`}
                </button>

                {!selected.isFree && (
                  // Honest about the state of the world: there is no charge yet,
                  // so a paid booking stops at "requested" rather than pretending
                  // it is confirmed.
                  <p className="text-xs text-slate-400">
                    Paid sessions are requests until payment goes live — the advisor will see
                    it, but nothing is charged.
                  </p>
                )}
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
