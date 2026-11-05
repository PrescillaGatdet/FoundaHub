import "server-only";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireUser, Forbidden } from "./auth";
import { toAuthor, toTag, formatPrice, type AuthorDTO, type TagDTO } from "./dto";

// Mentors and expert consultants are the same model. An offering with
// `priceCents === 0` is mentorship; anything above is consulting. Nothing in
// this file branches on which — only the price differs.

export type OfferingDTO = {
  id: string;
  title: string;
  description: string;
  kind: string;
  durationMin: number;
  priceCents: number;
  priceLabel: string;
  isFree: boolean;
};

export type AdvisorSummaryDTO = {
  slug: string;
  user: AuthorDTO;
  headline: string;
  bio: string;
  company: string | null;
  yearsExperience: number;
  timezone: string;
  isAcceptingBookings: boolean;
  ratingAvg: number;
  reviewCount: number;
  expertise: TagDTO[];
  lowestPriceCents: number;
  hasFreeOffering: boolean;
  offerings: OfferingDTO[];
};

export type SlotDTO = { id: string; startsAt: Date; endsAt: Date };

export type AdvisorDetailDTO = AdvisorSummaryDTO & {
  slots: SlotDTO[];
  reviews: { id: string; rating: number; body: string; createdAt: Date; author: AuthorDTO }[];
  viewerBooking: { id: string; startsAt: Date; status: string; offeringTitle: string } | null;
  viewerIsAdvisor: boolean;
};

const toOffering = (o: {
  id: string;
  title: string;
  description: string;
  kind: string;
  durationMin: number;
  priceCents: number;
}): OfferingDTO => ({
  id: o.id,
  title: o.title,
  description: o.description,
  kind: o.kind,
  durationMin: o.durationMin,
  priceCents: o.priceCents,
  priceLabel: formatPrice(o.priceCents),
  isFree: o.priceCents === 0,
});

const summarySelect = {
  headline: true,
  bio: true,
  company: true,
  yearsExperience: true,
  timezone: true,
  isAcceptingBookings: true,
  ratingAvg: true,
  reviewCount: true,
  user: { select: { slug: true, name: true, headline: true, avatar: true, color: true } },
  expertise: { select: { tag: { select: { name: true, slug: true, kind: true, color: true } } } },
  offerings: {
    where: { isActive: true },
    orderBy: { priceCents: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      kind: true,
      durationMin: true,
      priceCents: true,
    },
  },
} as const;

type SummaryRow = {
  headline: string;
  bio: string;
  company: string | null;
  yearsExperience: number;
  timezone: string;
  isAcceptingBookings: boolean;
  ratingAvg: number;
  reviewCount: number;
  user: { slug: string; name: string; headline: string | null; avatar: string; color: string };
  expertise: { tag: { name: string; slug: string; kind: string; color: string } }[];
  offerings: {
    id: string;
    title: string;
    description: string;
    kind: string;
    durationMin: number;
    priceCents: number;
  }[];
};

function toSummary(a: SummaryRow): AdvisorSummaryDTO {
  const offerings = a.offerings.map(toOffering);
  return {
    // An advisor is addressed by their user slug — one identity, one URL.
    slug: a.user.slug,
    user: toAuthor(a.user),
    headline: a.headline,
    bio: a.bio,
    company: a.company,
    yearsExperience: a.yearsExperience,
    timezone: a.timezone,
    isAcceptingBookings: a.isAcceptingBookings,
    ratingAvg: a.ratingAvg,
    reviewCount: a.reviewCount,
    expertise: a.expertise.map((e) => toTag(e.tag)),
    lowestPriceCents: offerings.length ? Math.min(...offerings.map((o) => o.priceCents)) : 0,
    hasFreeOffering: offerings.some((o) => o.isFree),
    offerings,
  };
}

export async function getAdvisors(options?: {
  expertiseSlug?: string;
  /** "mentors" = has a free offering, "experts" = has a paid one. */
  filter?: "all" | "mentors" | "experts";
}): Promise<AdvisorSummaryDTO[]> {
  const rows = await prisma.advisorProfile.findMany({
    where: {
      ...(options?.expertiseSlug
        ? { expertise: { some: { tag: { slug: options.expertiseSlug } } } }
        : {}),
      ...(options?.filter === "mentors"
        ? { offerings: { some: { isActive: true, priceCents: 0 } } }
        : {}),
      ...(options?.filter === "experts"
        ? { offerings: { some: { isActive: true, priceCents: { gt: 0 } } } }
        : {}),
    },
    orderBy: [{ isAcceptingBookings: "desc" }, { ratingAvg: "desc" }],
    select: summarySelect,
  });
  return rows.map(toSummary);
}

export async function getAdvisor(slug: string): Promise<AdvisorDetailDTO | null> {
  const viewer = await getCurrentUser();

  const advisor = await prisma.advisorProfile.findFirst({
    where: { user: { slug } },
    select: {
      ...summarySelect,
      id: true,
      userId: true,
      slots: {
        // Only slots that are still in the future and not already taken.
        where: { startsAt: { gt: new Date() }, booking: null },
        orderBy: { startsAt: "asc" },
        take: 12,
        select: { id: true, startsAt: true, endsAt: true },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          rating: true,
          body: true,
          createdAt: true,
          author: { select: { slug: true, name: true, headline: true, avatar: true, color: true } },
        },
      },
    },
  });

  if (!advisor) return null;

  const viewerBooking = viewer
    ? await prisma.booking.findFirst({
        where: {
          advisorId: advisor.id,
          menteeId: viewer.id,
          status: { in: ["requested", "confirmed"] },
        },
        orderBy: { startsAt: "asc" },
        select: {
          id: true,
          startsAt: true,
          status: true,
          offering: { select: { title: true } },
        },
      })
    : null;

  return {
    ...toSummary(advisor),
    slots: advisor.slots,
    reviews: advisor.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt,
      author: toAuthor(r.author),
    })),
    viewerBooking: viewerBooking
      ? {
          id: viewerBooking.id,
          startsAt: viewerBooking.startsAt,
          status: viewerBooking.status,
          offeringTitle: viewerBooking.offering.title,
        }
      : null,
    viewerIsAdvisor: viewer?.id === advisor.userId,
  };
}

export type BookingDTO = {
  id: string;
  startsAt: Date;
  status: string;
  meetingUrl: string | null;
  offeringTitle: string;
  durationMin: number;
  priceLabel: string;
  advisor: AuthorDTO;
  hasReview: boolean;
};

/** The caller's own bookings. Scoped by `menteeId` — there is no id parameter to tamper with. */
export async function getMyBookings(): Promise<BookingDTO[]> {
  const user = await requireUser();

  const bookings = await prisma.booking.findMany({
    where: { menteeId: user.id },
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      startsAt: true,
      status: true,
      meetingUrl: true,
      offering: { select: { title: true, durationMin: true, priceCents: true } },
      advisor: {
        select: {
          user: { select: { slug: true, name: true, headline: true, avatar: true, color: true } },
        },
      },
      review: { select: { id: true } },
    },
  });

  return bookings.map((b) => ({
    id: b.id,
    startsAt: b.startsAt,
    status: b.status,
    meetingUrl: b.meetingUrl,
    offeringTitle: b.offering.title,
    durationMin: b.offering.durationMin,
    priceLabel: formatPrice(b.offering.priceCents),
    advisor: toAuthor(b.advisor.user),
    hasReview: b.review !== null,
  }));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Books a slot.
 *
 * Free offerings confirm immediately. Paid offerings stop at "requested" —
 * there is no charge yet, and pretending otherwise would put a confirmed
 * booking in front of an advisor who has not been paid. `orderRef` is the seam
 * where the payment link goes once Stripe lands.
 */
export async function createBooking(input: {
  offeringId: string;
  slotId: string;
  note?: string;
}): Promise<{ id: string; advisorSlug: string; requiresPayment: boolean }> {
  const user = await requireUser();

  const offering = await prisma.offering.findUnique({
    where: { id: input.offeringId },
    select: {
      id: true,
      priceCents: true,
      isActive: true,
      advisorId: true,
      advisor: {
        select: {
          isAcceptingBookings: true,
          userId: true,
          user: { select: { slug: true } },
        },
      },
    },
  });
  if (!offering || !offering.isActive) throw new Error("That offering is no longer available.");
  if (!offering.advisor.isAcceptingBookings) {
    throw new Forbidden("This advisor is not taking bookings right now.");
  }
  if (offering.advisor.userId === user.id) {
    throw new Forbidden("You cannot book yourself.");
  }

  const slot = await prisma.availabilitySlot.findUnique({
    where: { id: input.slotId },
    select: { id: true, advisorId: true, startsAt: true, booking: { select: { id: true } } },
  });
  // The slot must belong to this advisor, be unclaimed, and be in the future.
  if (!slot || slot.advisorId !== offering.advisorId) throw new Error("That time is not available.");
  if (slot.booking) throw new Error("Someone just took that time. Pick another.");
  if (slot.startsAt <= new Date()) throw new Error("That time has already passed.");

  const requiresPayment = offering.priceCents > 0;

  const booking = await prisma.booking.create({
    data: {
      offeringId: offering.id,
      advisorId: offering.advisorId,
      menteeId: user.id,
      slotId: slot.id,
      startsAt: slot.startsAt,
      status: requiresPayment ? "requested" : "confirmed",
      menteeNote: input.note?.trim() || null,
    },
    select: { id: true },
  });

  await prisma.notification.create({
    data: {
      userId: offering.advisor.userId,
      actorId: user.id,
      kind: "booking",
      title: `${user.name} booked a session with you`,
      href: `/mentors/${offering.advisor.user.slug}`,
    },
  });

  return { id: booking.id, advisorSlug: offering.advisor.user.slug, requiresPayment };
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const user = await requireUser();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, menteeId: true, status: true, advisor: { select: { userId: true } } },
  });
  if (!booking) throw new Error("That booking no longer exists.");

  // Either side of the booking may cancel it. Nobody else may.
  const isParticipant = booking.menteeId === user.id || booking.advisor.userId === user.id;
  if (!isParticipant) throw new Forbidden("That is not your booking.");
  if (booking.status === "completed") throw new Forbidden("That session already happened.");

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "cancelled", slotId: null },
    });
  });
}

/** One review per booking, by the mentee, only after the session has happened. */
export async function createReview(input: {
  bookingId: string;
  rating: number;
  body: string;
}): Promise<void> {
  const user = await requireUser();

  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5.");
  const body = input.body.trim();
  if (!body) throw new Error("Say something about the session.");

  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    select: {
      id: true,
      menteeId: true,
      advisorId: true,
      startsAt: true,
      status: true,
      review: { select: { id: true } },
    },
  });
  if (!booking) throw new Error("That booking no longer exists.");
  if (booking.menteeId !== user.id) throw new Forbidden("That is not your booking.");
  if (booking.review) throw new Forbidden("You already reviewed this session.");
  if (booking.startsAt > new Date()) throw new Forbidden("You can review after the session.");

  await prisma.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        bookingId: booking.id,
        advisorId: booking.advisorId,
        authorId: user.id,
        rating,
        body,
      },
    });

    // Recompute from the rows rather than incrementing a running average.
    const agg = await tx.review.aggregate({
      where: { advisorId: booking.advisorId },
      _avg: { rating: true },
      _count: true,
    });
    await tx.advisorProfile.update({
      where: { id: booking.advisorId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        reviewCount: agg._count,
      },
    });
  });
}
