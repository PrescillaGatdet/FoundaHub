import "server-only";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireUser, Forbidden } from "./auth";
import { formatPrice } from "./dto";

export type EventDTO = {
  slug: string;
  title: string;
  description: string;
  type: string;
  source: string;
  organizerName: string;
  partner: { slug: string; name: string; logoEmoji: string; color: string } | null;
  isOnline: boolean;
  location: string;
  startsAt: Date;
  endsAt: Date | null;
  capacity: number;
  priceLabel: string;
  externalUrl: string | null;
  goingCount: number;
  spotsLeft: number;
  isFull: boolean;
  /** null when nobody is signed in, or when the viewer has not responded. */
  viewerStatus: "going" | "waitlist" | null;
};

const eventSelect = {
  slug: true,
  title: true,
  description: true,
  type: true,
  source: true,
  organizerName: true,
  isOnline: true,
  location: true,
  startsAt: true,
  endsAt: true,
  capacity: true,
  priceCents: true,
  externalUrl: true,
  partner: { select: { slug: true, name: true, logoEmoji: true, color: true } },
  _count: { select: { rsvps: { where: { status: "going" } } } },
} as const;

type EventRow = {
  slug: string;
  title: string;
  description: string;
  type: string;
  source: string;
  organizerName: string;
  isOnline: boolean;
  location: string;
  startsAt: Date;
  endsAt: Date | null;
  capacity: number;
  priceCents: number;
  externalUrl: string | null;
  partner: { slug: string; name: string; logoEmoji: string; color: string } | null;
  _count: { rsvps: number };
};

function toEvent(e: EventRow, viewerStatus: "going" | "waitlist" | null): EventDTO {
  const goingCount = e._count.rsvps;
  return {
    slug: e.slug,
    title: e.title,
    description: e.description,
    type: e.type,
    source: e.source,
    organizerName: e.organizerName,
    partner: e.partner,
    isOnline: e.isOnline,
    location: e.location,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    capacity: e.capacity,
    priceLabel: formatPrice(e.priceCents),
    externalUrl: e.externalUrl,
    goingCount,
    spotsLeft: Math.max(0, e.capacity - goingCount),
    isFull: goingCount >= e.capacity,
    viewerStatus,
  };
}

/** Reads the viewer's RSVP for a set of events in one query. */
async function viewerRsvps(eventSlugs: string[]): Promise<Map<string, "going" | "waitlist">> {
  const viewer = await getCurrentUser();
  if (!viewer || eventSlugs.length === 0) return new Map();

  const rows = await prisma.eventRsvp.findMany({
    where: {
      userId: viewer.id,
      status: { in: ["going", "waitlist"] },
      event: { slug: { in: eventSlugs } },
    },
    select: { status: true, event: { select: { slug: true } } },
  });

  return new Map(rows.map((r) => [r.event.slug, r.status as "going" | "waitlist"]));
}

export async function getUpcomingEvents(options?: { take?: number }): Promise<EventDTO[]> {
  const rows = await prisma.event.findMany({
    where: { status: "published", startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: options?.take,
    select: eventSelect,
  });

  const mine = await viewerRsvps(rows.map((e) => e.slug));
  return rows.map((e) => toEvent(e, mine.get(e.slug) ?? null));
}

export async function getPastEvents(options?: { take?: number }): Promise<EventDTO[]> {
  const rows = await prisma.event.findMany({
    where: { status: "published", startsAt: { lt: new Date() } },
    orderBy: { startsAt: "desc" },
    take: options?.take ?? 6,
    select: eventSelect,
  });

  const mine = await viewerRsvps(rows.map((e) => e.slug));
  return rows.map((e) => toEvent(e, mine.get(e.slug) ?? null));
}

export async function getEvent(slug: string): Promise<EventDTO | null> {
  // Drafts and cancelled events are not addressable by URL.
  const row = await prisma.event.findFirst({
    where: { slug, status: "published" },
    select: eventSelect,
  });
  if (!row) return null;

  const mine = await viewerRsvps([row.slug]);
  return toEvent(row, mine.get(row.slug) ?? null);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Toggles the caller's RSVP. Going over capacity puts them on the waitlist
 * rather than refusing — the count is derived from rows, so this stays correct
 * under concurrent writes in a way the old `rsvps Int` counter never was.
 */
export async function toggleRsvp(eventSlug: string): Promise<"going" | "waitlist" | null> {
  const user = await requireUser();

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: { id: true, capacity: true, status: true, startsAt: true, externalUrl: true },
  });
  if (!event) throw new Error("That event no longer exists.");
  if (event.status !== "published") throw new Forbidden("That event is not open for RSVPs.");
  if (event.externalUrl) throw new Forbidden("This event is hosted elsewhere — RSVP on their site.");
  if (event.startsAt < new Date()) throw new Forbidden("That event has already happened.");

  const existing = await prisma.eventRsvp.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: user.id } },
    select: { id: true, status: true },
  });

  if (existing && existing.status !== "cancelled") {
    await prisma.eventRsvp.update({
      where: { id: existing.id },
      data: { status: "cancelled" },
    });
    return null;
  }

  const going = await prisma.eventRsvp.count({
    where: { eventId: event.id, status: "going" },
  });
  const status = going >= event.capacity ? "waitlist" : "going";

  await prisma.eventRsvp.upsert({
    where: { eventId_userId: { eventId: event.id, userId: user.id } },
    create: { eventId: event.id, userId: user.id, status },
    update: { status },
  });

  return status;
}
