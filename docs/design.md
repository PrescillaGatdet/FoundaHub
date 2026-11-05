# Platform Design

Full feature design for the eleven-surface founder platform, grounded in the existing
Next.js 16 / React 19 / Prisma 7 codebase.

> **Naming:** deferred. This document says "the platform" throughout. Nothing in the
> design depends on the name.

---

## 1. What this is now

The MVP is a Q&A community. The target is a **founder platform with an in-house fund** —
closer to AngelList or Techstars than to a forum. Three things follow from that, and they
shape every decision below:

1. **Money moves through the product.** Paid private groups, expert consulting, course
   enrollments, and (eventually) payouts to group owners and consultants. That makes
   authorization a correctness requirement, not a nice-to-have.
2. **Content is both public and gated.** Blog posts and the portfolio should be crawlable
   and cached. Private group posts must never leak. These need different rendering
   strategies.
3. **Several features are the same feature.** Mentorship and expert consulting are one
   model with a price field. Portfolio companies and job-posting companies are one model
   with a flag. Collapsing these early avoids two parallel half-built systems.

---

## 2. Feature consolidation

Eleven requested surfaces map to **eight** systems:

| You asked for | Design |
|---|---|
| Mentorships | `AdvisorProfile` + `Offering` (price = 0) |
| Expert consultants | Same models, price > 0 |
| Company portfolio | `Company` with `isPortfolio = true` |
| Hire people (startup jobs) | `Job` hanging off the same `Company` |
| Funding: investors, grants, loans, our VC | One `FundingSource` with a `kind` enum |
| Training: AI tools + our programs | One `Course` with a `kind` enum; programs add `Cohort` |
| Q&A, Events, Partners, Blog, AI Advisor, Private groups | Distinct systems |

This is not scope reduction — every surface you listed still ships. It just means one
booking flow instead of two, one company profile instead of two, one funding directory
instead of four.

---

## 3. Information architecture

Eleven items cannot sit in the nav bar. Group by what the founder is trying to do:

```
Logo    Learn ▾        Connect ▾      Grow ▾         [Ask]  [Advisor]  [avatar]
        Questions      Mentors        Funding
        Blog           Experts        Jobs
        Training       Groups         Partners
                       Events         Portfolio
```

- **Learn** — free, public, SEO-facing. This is the acquisition surface.
- **Connect** — people. Mixed free/paid. This is the retention and revenue surface.
- **Grow** — capital, hiring, perks, proof. This is the "why I stay" surface.
- **Advisor** — persistent, not in a dropdown. It is the wayfinding layer over everything else.

Route groups mirror this:

```
app/
  (marketing)/          # landing, pricing, about — cached, public
  (app)/                # everything behind the nav
    questions/  blog/  training/
    mentors/  experts/  groups/  events/
    funding/  jobs/  partners/  portfolio/
    advisor/
    settings/
  (admin)/              # staff only: moderation, applications, partner offers
  api/
    stripe/webhook/     # route handler
    advisor/            # streaming route handler
```

---

## 4. Foundations (must land before any feature)

### 4.1 Real authentication

`lib/session.ts` currently reads a `uid` cookie and falls back to a seeded demo user. That
is fine for a demo and unacceptable the moment someone pays. Replace with email + OAuth
(Google, GitHub). Everything else in the codebase already keys off a `User`, so this is a
contained change.

Wrap the lookup in React's `cache()` so a single request resolves the user once:

```ts
// lib/data/auth.ts
import "server-only";
import { cache } from "react";

export const getCurrentUser = cache(async () => { /* verify session cookie */ });
export const requireUser = cache(async () => { /* redirect('/login') if absent */ });
```

### 4.2 Data Access Layer

Today pages query Prisma directly ([app/page.tsx:11](app/page.tsx#L11)). The Next.js 16
guide classifies that as the "component-level data access" pattern and scopes it to
"quick prototypes and iteration" — precisely because it makes it easy to pass a whole
database row into a client component.

With paid gated content that risk becomes a leak. Introduce `lib/data/*`:

```ts
// lib/data/groups.ts
import "server-only";
import { requireUser } from "./auth";

export async function getGroupFeed(groupSlug: string) {
  const user = await requireUser();
  const membership = await prisma.groupMembership.findFirst({
    where: { group: { slug: groupSlug }, userId: user.id, status: "active" },
  });
  if (!membership) throw new Forbidden();
  // ...return a DTO, not raw rows
}
```

Rules: only `lib/data/**` imports `@/lib/prisma`; every function performs its own
authorization; every return value is a minimal DTO.

### 4.3 Server action authorization

The docs are explicit: *"A page-level authentication check does not extend to the Server
Actions defined within it."* Server actions are independently reachable POST endpoints.

Current actions in [app/actions.ts](app/actions.ts) call `getCurrentUser()` but never check
whether the caller owns the resource. `voteQuestion` is harmless. `deleteGroupPost` or
`refundBooking` will not be. Every action delegates to the DAL, which checks both
authentication and ownership:

```ts
"use server";
export async function deleteGroupPostAction(postId: string) {
  await deleteGroupPost(postId);   // auth + authz inside the DAL
  revalidatePath("/groups");
}
```

### 4.4 Payments

```prisma
model Customer      { id, userId @unique, stripeCustomerId }
model Subscription  { id, userId, kind, groupId?, stripeSubscriptionId, status, currentPeriodEnd }
model Order         { id, userId, kind, amountCents, currency, status, stripePaymentIntentId }
model PayoutAccount { id, userId @unique, stripeAccountId, chargesEnabled, payoutsEnabled }
```

Stripe webhooks land in a route handler (`app/api/stripe/webhook/route.ts`) — signature
verification requires the raw body, so this cannot be a server action.

**`PayoutAccount` is the expensive one.** Paying group owners and consultants means Stripe
Connect: KYC, onboarding flows, 1099s, and platform liability for disputes. See
§14 — this is the single biggest hidden cost in the roadmap.

### 4.5 Database and caching

- **Move to Postgres before launch.** SQLite plus serverless plus concurrent writes to
  `votes`, `rsvps`, and `memberCount` will not hold. Swap the Prisma adapter; the schema
  is portable.
- **Turn on Cache Components** (`cacheComponents: true` in `next.config.ts`). Every page
  currently carries `export const dynamic = "force-dynamic"`, which means blog posts and
  the portfolio would re-query on every hit. Use `use cache` + `cacheLife` on the public
  surfaces (blog, events, portfolio, partners, course catalog, tag pages) and keep
  personalized surfaces dynamic.

---

## 5. Q&A (extend existing)

Already built: questions, answers, tags, one-vote-per-user, feed sorting.

Add:

```prisma
model Question {
  // + slug, status ("open"|"answered"|"closed"), acceptedAnswerId
}
model Comment  { id, body, authorId, questionId?, answerId?, createdAt }
model Bookmark { id, userId, entityType, entityId, @@unique([userId, entityType, entityId]) }
```

- **Accept an answer** — author-only server action, sets `Answer.accepted` and
  `Question.acceptedAnswerId`, re-verifying `question.authorId === user.id` inside the action.
- **Search** — `/search` over questions, posts, and companies. SQLite FTS5 now, Postgres
  `tsvector` after the migration. Do not reach for a search service yet.
- **Tag pages** — `/tags/[slug]`, cached, good for SEO.

---

## 6. Mentorship & expert consulting

One system. A mentor is an advisor whose offering costs nothing; a consultant is an
advisor whose offering costs money.

```prisma
model AdvisorProfile {
  id, userId @unique
  headline, bio, company, yearsExperience, timezone
  isAcceptingBookings, ratingAvg, reviewCount
  expertise ExpertiseTag[]
}

model Offering {
  id, advisorId
  title, description
  kind          // "intro_call" | "session" | "async_review"
  durationMin
  priceCents    // 0 = free mentorship
  isActive
}

model AvailabilitySlot { id, advisorId, startsAt, endsAt, bookingId? }

model Booking {
  id, offeringId, advisorId, menteeId, slotId?
  startsAt, status   // requested | confirmed | completed | cancelled | no_show
  meetingUrl, menteeNote, orderId?
}

model Review { id, bookingId @unique, authorId, advisorId, rating, body, createdAt }
```

The current standalone `Mentor` model is replaced — mentors must be `User`s so they can
answer questions, own groups, and receive payouts under one identity.

**Flow.** Browse `/mentors` (filter by expertise, availability) → advisor page → pick an
offering → pick a slot → free offerings confirm immediately, paid ones create an `Order`
and confirm on payment success → both parties get a calendar invite → after `startsAt`,
the mentee can leave one `Review` tied to the `Booking`.

Reviews anchored to a completed booking, one per booking, is what keeps ratings honest.

---

## 7. Events

The existing `Event` model needs two changes: a `source` field (your events vs. partner
events vs. conferences vs. community submissions) and a real RSVP table — the current
`rsvps Int` counter cannot express "who is going" or survive concurrent writes.

```prisma
model Event {
  id, slug, title, description
  type      // workshop | ama | pitch_night | demo_day | conference | startup_week
  source    // first_party | partner | community | external
  partnerId?, hostUserId?, organizerName
  isOnline, location, timezone
  startsAt, endsAt
  capacity, priceCents
  externalUrl?          // external events link out; we do not own their RSVP
  status                // draft | published | cancelled
}

model EventRsvp {
  id, eventId, userId
  status  // going | waitlist | cancelled
  @@unique([eventId, userId])
}
```

Community-submitted events enter as `status: "draft"` and require staff approval — see
§14 on moderation load.

---

## 8. Partners (FAANG programs)

```prisma
model Partner {
  id, slug, name, logoUrl, blurb, websiteUrl
  tier   // platinum | gold | community
}

model PartnerOffer {
  id, partnerId, title, description
  kind          // credits | program | discount | tool_access | event
  valueBlurb    // "$5,000 in cloud credits"
  eligibility   // plain-text criteria
  applyUrl?     // external
  isInternalFlow Boolean   // true = we collect and forward the application
  startsAt, endsAt, status
}

model OfferClaim {
  id, offerId, userId
  status  // requested | approved | rejected | fulfilled
  note
  @@unique([offerId, userId])
}
```

Two claim paths matter: most partners will want you to send founders to their own form
(`applyUrl`), but the valuable ones let you vouch — you collect the claim, staff approves
in `(admin)`, and you forward a vetted list. `isInternalFlow` distinguishes them.

`/partners` is cached and public; it doubles as a credibility page for recruiting more
partners.

---

## 9. Funding

Investors, grants, loans, and your own fund are four labels on one directory.

```prisma
model FundingSource {
  id, slug, name, logoUrl, description, websiteUrl
  kind          // vc | angel | grant | loan | accelerator | internal_fund
  isInternal Boolean          // your fund
  checkSizeMinCents, checkSizeMaxCents
  stages, sectors, geos       // arrays (Postgres) / join tables
  applicationMode             // intro_request | external_link | internal_application
  applyUrl?
}

model FundingApplication {
  id, sourceId, userId, companyId?
  stage, askCents, deckUrl, blurb
  status        // draft | submitted | in_review | intro_made | passed | funded
  staffNote     // never returned to the applicant's DTO
}
```

**Disclosure is a design requirement, not a policy afterthought.** You run a fund and
also sell advice to the founders that fund might invest in. Surface `isInternal` as a
visible badge on every listing, and state the relationship on the application form. Doing
it in the UI from day one costs nothing; retrofitting it after someone notices is
expensive.

Consider incorporating the fund as a separate legal entity with its own brand — worth
raising with counsel before you write a check.

---

## 10. Jobs (and Companies)

`Company` is shared with the portfolio (§12).

```prisma
model Company {
  id, slug, name, logoUrl, tagline, description, websiteUrl
  stage, teamSize, sectors
  ownerUserId?              // claimed by a founder
  isPortfolio Boolean       // powers /portfolio
  portfolioBatch?, announcedAt?
}

model Job {
  id, companyId, postedById
  title, description
  roleType      // eng | design | gtm | ops | finance | other
  employment    // full_time | part_time | contract | intern
  locationMode  // remote | hybrid | onsite
  location, salaryMinCents, salaryMaxCents, currency, equityMin, equityMax
  status        // draft | open | closed
  expiresAt
}

model JobApplication {
  id, jobId, userId, note, resumeUrl
  status  // applied | reviewing | rejected | hired
  @@unique([jobId, userId])
}
```

Jobs auto-close at `expiresAt` (30 or 60 days) — a jobs board full of dead listings is
worse than no jobs board. Portfolio companies get free posting; that is a real perk to
name in your fund's pitch.

---

## 11. Blog

```prisma
model Post {
  id, slug @unique, title, excerpt, body   // markdown
  coverUrl, authorId
  status        // draft | in_review | published
  publishedAt, readingMinutes, viewCount
  tags PostTag[]                            // reuses the existing Tag model
}
```

**Store markdown in the database rather than MDX files.** MDX means a deploy for every
typo. Non-engineers will be writing here. Render markdown server-side and sanitize the
HTML — do not trust author input even from staff accounts.

Blog is your strongest SEO surface. Cache aggressively (`use cache` + `cacheLife('hours')`),
generate OG images, emit JSON-LD.

---

## 12. Training

Two shapes: self-serve AI tool courses, and cohort-based programs you run.

```prisma
model Course {
  id, slug, title, summary, description, coverUrl
  kind          // tool_training | program
  level, priceCents, instructorId, isPublished
}

model Lesson { id, courseId, order, title, body, videoUrl, durationMin, isPreview }

model Cohort { id, courseId, name, startsAt, endsAt, capacity, priceCents }   // programs only

model Enrollment {
  id, courseId, cohortId?, userId, orderId?
  status  // active | completed | refunded
  @@unique([courseId, userId])
}

model LessonProgress { id, enrollmentId, lessonId, completedAt, @@unique([enrollmentId, lessonId]) }
```

`isPreview` lets one lesson per course render publicly — that is your conversion lever and
your SEO surface. Everything else is gated in the DAL by an active `Enrollment`.

Tool-training content dates fast. Add a `lastReviewedAt` and surface a staleness warning
in `(admin)` — an AI course from eighteen months ago is a liability.

---

## 13. Portfolio

Reuses `Company`. Adds only:

```prisma
model Investment {
  id, companyId, sourceId      // the internal FundingSource
  roundName, amountCents, investedAt
  isPublic Boolean             // some founders will not want the number published
}
```

`/portfolio` is a cached public grid; `/companies/[slug]` is the profile, pulling in that
company's open jobs and any published announcement. "New companies released" is a filter
on `announcedAt`, not a separate model.

---

## 14. Private paid groups

The highest-value and highest-risk feature. An expert founder creates a group about their
industry, charges for it, and helps younger founders inside it.

```prisma
model Group {
  id, slug, title, description, coverUrl, industry
  ownerId
  priceCents, billingPeriod    // monthly | one_time
  memberLimit, memberCount
  visibility                   // listed | unlisted
  status                       // pending_review | active | suspended
}

model GroupMembership {
  id, groupId, userId
  role      // owner | moderator | member
  status    // active | past_due | cancelled
  subscriptionId?, joinedAt
  @@unique([groupId, userId])
}

model GroupPost    { id, groupId, authorId, title?, body, isPinned, createdAt }
model GroupComment { id, postId, authorId, body, createdAt }
model GroupInvite  { id, groupId, code, expiresAt, maxUses, useCount }
```

**Security model.** Public: the group's title, description, owner, price, and member
count. Gated: every `GroupPost` and `GroupComment`. Enforcement lives in
`lib/data/groups.ts` — a `layout.tsx` check controls which UI renders but does nothing to
protect a server action or a route handler, so membership is re-verified inside every
read and every mutation. Test the negative case explicitly: a non-member calling the post
action directly must get a 403, not a post.

**Owner economics.** Owners expect to be paid. That is Stripe Connect, and it is the
gating dependency for this feature. Two options:

- **Platform-managed (Connect Express)** — you collect, take a percentage, pay out. Better
  product, better take rate, real compliance work (onboarding, KYC, tax reporting,
  dispute liability).
- **Owner-billed** — owners connect their own Stripe and you charge a listing fee. Ships
  far faster, much weaker business.

Decide this before building group billing; it changes the data model.

---

## 15. AI Advisor

A chat surface that answers founder questions and — critically — grounds every answer in
the platform's own content, so it drives people into the Q&A, mentors, events, and funding
surfaces rather than replacing them.

```prisma
model Conversation { id, userId, title, createdAt, updatedAt }
model Message      { id, conversationId, role, content, createdAt, inputTokens, outputTokens }
model AdvisorFeedback { id, messageId, userId, rating, note }
```

### Implementation

**Do not build a vector database.** The right pattern here is **tool use against your own
Prisma queries**. Your content is small, structured, and already searchable; embeddings
would add infrastructure and return fuzzy matches you cannot deep-link. Tools return real
records with real IDs, which means the advisor can say "three founders answered this —
here's the thread" and link it.

Model: **`claude-opus-5`** via `@anthropic-ai/sdk`, with adaptive thinking. Stream from a
route handler (`app/api/advisor/route.ts`) — long responses would otherwise hit request
timeouts.

```ts
// app/api/advisor/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

const client = new Anthropic();

const searchQuestions = betaZodTool({
  name: "search_questions",
  description:
    "Search community Q&A. Call this whenever the founder asks something another " +
    "founder is likely to have already asked — tooling, hiring, fundraising timing.",
  inputSchema: z.object({ query: z.string(), limit: z.number().default(5) }),
  run: async ({ query, limit }) => searchQuestionsForAdvisor(query, limit), // DAL
});

// ...find_mentors, list_events, search_funding_sources, search_posts, list_partner_offers
```

Six tools, each a thin wrapper over a DAL function:

| Tool | Returns |
|---|---|
| `search_questions` | Q&A threads with accepted answers |
| `search_posts` | Blog articles |
| `find_mentors` | Advisors matching an expertise area, with booking links |
| `list_events` | Upcoming events in a date window |
| `search_funding_sources` | Funding sources matching stage/sector |
| `list_partner_offers` | Active partner perks the user is eligible for |

Write each tool's `description` prescriptively — say *when* to call it, not just what it
does. That materially improves how often the model reaches for it.

### Guardrails

- **Tools run through the DAL under the caller's identity.** The advisor must never
  surface private group content, draft posts, other users' applications, or staff notes.
  This is the same authorization boundary as everything else — do not build a second one.
- **The API key is server-only.** It lives in the route handler, never in a client
  component, never in a `NEXT_PUBLIC_` variable.
- **Rate limit per user** — this is your only per-request-cost feature.
- **Label the output.** "General guidance, not legal, financial, or tax advice." You run a
  fund; an AI telling a founder their SAFE terms are fine is a problem you do not want.

Build this **after** the content features. An advisor with nothing to ground on is a
generic chatbot, and the whole point is that it is not.

---

## 16. Cross-cutting

```prisma
model Notification {
  id, userId, kind, actorId?, entityType, entityId, readAt, createdAt
}
model Report {
  id, reporterId, entityType, entityId, reason, status, resolvedById?
}
model Follow { id, userId, entityType, entityId, @@unique([userId, entityType, entityId]) }
```

- **Notifications** — answers to your question, booking confirmations, group posts, event
  reminders, application status changes. In-app first, then a weekly email digest.
- **Moderation** — `Report` covers questions, answers, group posts, jobs, and events. The
  `(admin)` queue is one screen serving all of them.
- **Email** — transactional (Resend or Postmark) plus the digest. Booking confirmations
  and payment receipts are not optional.

---

## 17. Build order

Sequenced by dependency and by what actually makes money.

**Phase 0 — Foundations.** Real auth, DAL refactor, Postgres migration, Cache Components,
Stripe + webhook plumbing, notifications, `(admin)` shell. *Nothing user-visible ships
here, and everything after it depends on it.*

**Phase 1 — Revenue.** Advisor profiles, offerings, availability, bookings, reviews (free
mentorship and paid consulting arrive together). Then private groups, once the Connect
decision is made.

**Phase 2 — Content.** Blog, then Training. This is what feeds the advisor and your SEO.

**Phase 3 — Ecosystem.** Companies → Jobs → Portfolio → Partners → Funding. Ordered by
dependency: `Company` unlocks the other three. These need business development you have to
do offline anyway, so building them early just means empty pages.

**Phase 4 — AI Advisor.** Now there is something to ground it on.

**Phase 5 — Polish.** Search, moderation tooling, email digests, analytics.

**Why revenue before ecosystem:** groups and consulting need nothing from anyone else. A
funding directory needs investor relationships, a partner page needs signed partners, and
a job board needs companies with open roles. Ship the surfaces you fully control first.

---

## 18. Open decisions

These change the data model, so decide before the phase that touches them:

1. **Marketplace payouts.** Stripe Connect vs. owner-billed (§14). Blocks group billing
   and paid consulting. **Biggest hidden cost in the plan.**
2. **Fund entity separation.** Does the VC arm need its own legal entity and brand? Affects
   how §9 is presented and possibly the naming decision.
3. **Moderation capacity.** Community events, jobs, group creation, and reports all need
   human review. Who does it, and what is the SLA? Auto-approving is a real option — decide
   deliberately rather than by default.
4. **Jobs: free or paid?** Free grows the board; paid funds it. Portfolio companies free
   either way.
5. **Group revenue split.** Platform percentage. Affects whether owners bother.
6. **Advisor cost ceiling.** Free-tier limits vs. a Pro-plan benefit.
