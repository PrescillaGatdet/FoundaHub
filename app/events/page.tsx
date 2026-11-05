import { getUpcomingEvents, getPastEvents, type EventDTO } from "@/lib/data/events";
import { toggleRsvpAction } from "@/app/actions";
import { formatEventDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const typeColors: Record<string, string> = {
  workshop: "#6366f1",
  ama: "#10b981",
  pitch_night: "#ec4899",
  demo_day: "#f59e0b",
  conference: "#0ea5e9",
  startup_week: "#a855f7",
};

const label = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([getUpcomingEvents(), getPastEvents({ take: 4 })]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Events</h1>
        <p className="text-sm text-slate-600">
          Workshops, AMAs, and pitch nights — ours, our partners&apos;, and the ones worth
          travelling for.
        </p>
      </div>

      <div className="space-y-4">
        {upcoming.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">
            Nothing on the calendar right now. Check back soon.
          </div>
        ) : (
          upcoming.map((e) => <EventRow key={e.slug} event={e} />)
        )}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="mb-4 mt-10 text-lg font-bold text-slate-900">Past events</h2>
          <div className="space-y-4 opacity-70">
            {past.map((e) => (
              <EventRow key={e.slug} event={e} past />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EventRow({ event, past }: { event: EventDTO; past?: boolean }) {
  const color = typeColors[event.type] ?? "#6366f1";

  return (
    <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
      <div
        className="flex w-full shrink-0 flex-col items-center justify-center rounded-xl py-3 sm:w-24"
        style={{ background: `${color}14`, color }}
      >
        <span className="text-xs font-semibold uppercase">
          {new Date(event.startsAt).toLocaleString("en-US", { month: "short" })}
        </span>
        <span className="text-2xl font-bold leading-none">
          {new Date(event.startsAt).getDate()}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="tag-chip" style={{ background: `${color}14`, color }}>
            {label(event.type)}
          </span>
          {event.partner && (
            <span
              className="tag-chip"
              style={{ background: `${event.partner.color}14`, color: event.partner.color }}
            >
              {event.partner.logoEmoji} {event.partner.name}
            </span>
          )}
          {event.source === "external" && (
            <span className="tag-chip bg-slate-100 text-slate-600">External</span>
          )}
          <span className="text-xs text-slate-500">{formatEventDate(event.startsAt)}</span>
        </div>

        <h3 className="mt-1.5 font-semibold text-slate-900">{event.title}</h3>
        <p className="mt-1 text-sm text-slate-600">{event.description}</p>
        <div className="mt-2 text-xs text-slate-500">
          Hosted by <span className="font-medium text-slate-700">{event.organizerName}</span> ·{" "}
          {event.isOnline ? "Online" : event.location} · {event.goingCount} going ·{" "}
          {event.priceLabel}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-1 sm:w-32 sm:items-end">
        {past ? (
          <span className="text-center text-xs text-slate-400">Ended</span>
        ) : event.externalUrl ? (
          // We do not own this event's RSVP, so we link out rather than
          // pretending a signup here means anything.
          <a
            href={event.externalUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-ghost text-center"
          >
            Visit site ↗
          </a>
        ) : (
          <>
            <form action={toggleRsvpAction}>
              <input type="hidden" name="eventSlug" value={event.slug} />
              <button
                type="submit"
                className={`w-full ${event.viewerStatus ? "btn-ghost" : "btn-primary"}`}
              >
                {event.viewerStatus === "going"
                  ? "Going ✓"
                  : event.viewerStatus === "waitlist"
                    ? "On waitlist"
                    : event.isFull
                      ? "Join waitlist"
                      : "RSVP"}
              </button>
            </form>
            <span className="text-center text-xs text-slate-400">
              {event.isFull ? "Full" : `${event.spotsLeft} spots left`}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
