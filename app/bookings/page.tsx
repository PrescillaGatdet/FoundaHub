import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { getMyBookings } from "@/lib/data/advisors";
import { getMyGroups } from "@/lib/data/groups";
import { cancelBookingAction, createReviewAction } from "@/app/actions";
import { formatEventDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  // Both of these scope to the caller inside the DAL — there is no id in the
  // URL to swap for someone else's.
  const [bookings, groups] = await Promise.all([getMyBookings(), getMyGroups()]);

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.startsAt >= now && b.status !== "cancelled",
  );
  const past = bookings.filter((b) => b.startsAt < now || b.status === "cancelled");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Your sessions</h1>
      <p className="text-sm text-slate-600">
        Everything you&apos;ve booked, plus the groups you&apos;re in.
      </p>

      <h2 className="mb-3 mt-8 text-lg font-bold text-slate-900">Upcoming</h2>
      {upcoming.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          Nothing booked.{" "}
          <Link href="/mentors" className="text-indigo-600">
            Find a mentor →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((b) => (
            <div key={b.id} className="card flex flex-wrap items-center gap-4 p-5">
              <Avatar emoji={b.advisor.avatar} color={b.advisor.color} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{b.offeringTitle}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                      b.status === "confirmed"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  with{" "}
                  <Link href={`/mentors/${b.advisor.slug}`} className="text-indigo-600 hover:underline">
                    {b.advisor.name}
                  </Link>{" "}
                  · {formatEventDate(b.startsAt)} · {b.priceLabel}
                </p>
                {b.status === "requested" && (
                  <p className="mt-1 text-xs text-slate-400">
                    Waiting on the advisor. Nothing has been charged.
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {b.meetingUrl && b.status === "confirmed" && (
                  <a
                    href={b.meetingUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn-primary text-sm"
                  >
                    Join call
                  </a>
                )}
                <form action={cancelBookingAction}>
                  <input type="hidden" name="bookingId" value={b.id} />
                  <button type="submit" className="btn-ghost text-sm">
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-lg font-bold text-slate-900">Past</h2>
          <div className="space-y-3">
            {past.map((b) => (
              <div key={b.id} className="card p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar emoji={b.advisor.avatar} color={b.advisor.color} size={40} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900">{b.offeringTitle}</h3>
                    <p className="text-sm text-slate-600">
                      with {b.advisor.name} · {formatEventDate(b.startsAt)}
                    </p>
                  </div>
                  <span className="text-xs capitalize text-slate-400">{b.status}</span>
                </div>

                {/* One review per booking, and only after it happened — the DAL
                    enforces both, this just decides whether to show the form. */}
                {b.status === "completed" && !b.hasReview && (
                  <form action={createReviewAction} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                    <input type="hidden" name="bookingId" value={b.id} />
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-slate-600" htmlFor={`rating-${b.id}`}>
                        Rating
                      </label>
                      <select
                        id={`rating-${b.id}`}
                        name="rating"
                        defaultValue="5"
                        className="input w-auto py-1.5 text-sm"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {"★".repeat(n)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      name="body"
                      required
                      rows={2}
                      placeholder="How was it? This shows on their profile."
                      className="input resize-y text-sm"
                    />
                    <div className="flex justify-end">
                      <button type="submit" className="btn-primary text-sm">
                        Leave review
                      </button>
                    </div>
                  </form>
                )}
                {b.hasReview && (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
                    You reviewed this session.
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mb-3 mt-8 text-lg font-bold text-slate-900">Your groups</h2>
      {groups.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          You&apos;re not in any groups.{" "}
          <Link href="/groups" className="text-indigo-600">
            Browse groups →
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <Link key={g.slug} href={`/groups/${g.slug}`} className="card flex items-center gap-3 p-4 hover:shadow-md">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
                style={{ background: `${g.color}14` }}
              >
                {g.coverEmoji}
              </span>
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-900">{g.title}</div>
                <div className="text-xs capitalize text-slate-500">
                  {g.viewerRole} · {g.memberCount} members
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
