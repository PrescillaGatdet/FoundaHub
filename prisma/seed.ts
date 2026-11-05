// Demo data for the whole platform.
//
// Every one of the eight systems gets enough rows that its surface renders
// something real: Q&A, advisors, groups, events, blog, training, companies
// (portfolio + jobs), partners, and funding.
//
// The seed is destructive and idempotent — it clears everything first, in
// foreign-key order, then rebuilds.

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// Fixed reference point so seeded content keeps a stable shape relative to
// "now" without every run producing different dates.
const NOW = new Date();
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

async function reset() {
  // Children before parents. Cascades cover most of this, but being explicit
  // means the seed does not depend on cascade rules staying put.
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();

  await prisma.offerClaim.deleteMany();
  await prisma.partnerOffer.deleteMany();

  await prisma.investment.deleteMany();
  await prisma.fundingApplication.deleteMany();
  await prisma.fundingSource.deleteMany();

  await prisma.jobApplication.deleteMany();
  await prisma.job.deleteMany();
  await prisma.company.deleteMany();

  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.cohort.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();

  await prisma.postTag.deleteMany();
  await prisma.post.deleteMany();

  await prisma.groupComment.deleteMany();
  await prisma.groupPost.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.groupTag.deleteMany();
  await prisma.group.deleteMany();

  await prisma.eventRsvp.deleteMany();
  await prisma.event.deleteMany();
  await prisma.partner.deleteMany();

  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.offering.deleteMany();
  await prisma.advisorTag.deleteMany();
  await prisma.advisorProfile.deleteMany();

  await prisma.bookmark.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.questionTag.deleteMany();
  await prisma.question.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await reset();

  // -------------------------------------------------------------------------
  // Users
  //
  // Advisors are Users, not a separate model — the same identity answers
  // questions, owns a group, and receives payouts.
  // -------------------------------------------------------------------------

  const you = await prisma.user.create({
    data: {
      id: "demo-user",
      slug: "you",
      email: "you@example.com",
      name: "You",
      role: "Founder",
      headline: "Building an AI-first startup",
      bio: "This is your account. Ask anything — no question is too basic.",
      location: "Remote",
      avatar: "🚀",
      color: "#6366f1",
    },
  });

  const maya = await prisma.user.create({
    data: { slug: "maya-okonkwo", email: "maya@example.com", name: "Maya Okonkwo", role: "Founder", headline: "AI logistics, pre-seed", bio: "Building routing software for mid-size freight carriers.", location: "Lagos", avatar: "🧭", color: "#0ea5e9" },
  });
  const devon = await prisma.user.create({
    data: { slug: "devon-park", email: "devon@example.com", name: "Devon Park", role: "Operator", headline: "Ex-agency, now ops at a seed startup", bio: "I run the unglamorous half of startups: hiring, billing, support.", location: "Seoul", avatar: "⚙️", color: "#f59e0b" },
  });
  const priya = await prisma.user.create({
    data: { slug: "priya-nair", email: "priya@example.com", name: "Priya Nair", role: "Investor", headline: "Angel · 20+ AI checks", bio: "I write $25–100k pre-seed checks and answer email fast.", location: "Bangalore", avatar: "💸", color: "#10b981" },
  });
  const sam = await prisma.user.create({
    data: { slug: "sam-whitfield", email: "sam@example.com", name: "Sam Whitfield", role: "Founder", headline: "Solo dev shipping with AI", bio: "One person, three products, no employees yet.", location: "Austin", avatar: "🛠️", color: "#ef4444" },
  });
  const lena = await prisma.user.create({
    data: { slug: "lena-vogt", email: "lena@example.com", name: "Lena Vogt", role: "Founder", headline: "No-code → first 100 users", bio: "Designer who learned to ship. Now teaching other non-engineers.", location: "Berlin", avatar: "🎨", color: "#a855f7" },
  });

  // Advisors — mentors (free offerings) and expert consultants (paid).
  const sarah = await prisma.user.create({
    data: { slug: "sarah-chen", email: "sarah@example.com", name: "Sarah Chen", role: "Mentor", headline: "ex-Stripe Product Lead", bio: "Helped scale a payments product from zero to millions of users.", location: "San Francisco", avatar: "👩‍💼", color: "#6366f1" },
  });
  const marcus = await prisma.user.create({
    data: { slug: "marcus-lee", email: "marcus@example.com", name: "Marcus Lee", role: "Investor", headline: "Founder & angel investor", bio: "Raised three rounds, now writes pre-seed checks into AI startups.", location: "New York", avatar: "🧑‍💼", color: "#10b981" },
  });
  const aisha = await prisma.user.create({
    data: { slug: "aisha-khan", email: "aisha@example.com", name: "Aisha Khan", role: "Mentor", headline: "Staff Engineer, ex-Google", bio: "Builds production LLM systems that survive contact with real users.", location: "London", avatar: "👩‍🔬", color: "#2563eb" },
  });
  const tom = await prisma.user.create({
    data: { slug: "tom-rivera", email: "tom@example.com", name: "Tom Rivera", role: "Operator", headline: "Growth lead, 2 startups to 10k users", bio: "Channels, funnels, and cold email that actually gets replies.", location: "Mexico City", avatar: "🧑‍🚀", color: "#ec4899" },
  });
  const nadia = await prisma.user.create({
    data: { slug: "nadia-petrov", email: "nadia@example.com", name: "Nadia Petrov", role: "Mentor", headline: "Design partner for early startups", bio: "Designs MVPs that don't look like MVPs.", location: "Lisbon", avatar: "🖌️", color: "#a855f7" },
  });
  const david = await prisma.user.create({
    data: { slug: "david-okafor", email: "david@example.com", name: "David Okafor", role: "Founder", headline: "2x founder, built teams from 2 to 60", bio: "Honest advice on when — and who — to hire.", location: "Toronto", avatar: "🧑‍🏫", color: "#f59e0b" },
  });

  const staff = await prisma.user.create({
    data: { slug: "platform-team", email: "team@example.com", name: "Platform Team", role: "Operator", headline: "We run this place", bio: "Programs, partnerships, and the fund.", avatar: "🛰️", color: "#334155", isStaff: true },
  });

  // -------------------------------------------------------------------------
  // Tags — shared across questions, posts, groups, and advisor expertise
  // -------------------------------------------------------------------------

  const tag = (name: string, slug: string, kind: string, color: string) =>
    prisma.tag.create({ data: { name, slug, kind, color } });

  const claudeCode = await tag("Claude Code", "claude-code", "tool", "#d97706");
  const gemini = await tag("Gemini", "gemini", "tool", "#2563eb");
  const cursor = await tag("Cursor", "cursor", "tool", "#0891b2");
  const noCode = await tag("No-Code", "no-code", "tool", "#7c3aed");
  const aiStrategy = await tag("AI Strategy", "ai-strategy", "topic", "#6366f1");
  const funding = await tag("Funding", "funding", "topic", "#10b981");
  const hiring = await tag("Hiring", "hiring", "topic", "#f59e0b");
  const growth = await tag("Growth", "growth", "topic", "#ec4899");
  const product = await tag("Product", "product", "topic", "#0ea5e9");
  const logistics = await tag("Logistics", "logistics", "industry", "#64748b");
  const fintech = await tag("Fintech", "fintech", "industry", "#059669");

  // -------------------------------------------------------------------------
  // Q&A
  // -------------------------------------------------------------------------

  type QuestionSeed = {
    title: string;
    body: string;
    author: { id: string };
    tags: { id: string }[];
    votes: number;
    views: number;
    answers: { body: string; author: { id: string }; votes: number; accepted?: boolean }[];
  };

  const questions: QuestionSeed[] = [
    {
      title: "How do I stop Claude Code from rewriting files I didn't ask it to touch?",
      body: "I ask for a small change and it refactors three other files. How do experienced people scope it so it only edits what I want?",
      author: maya,
      tags: [claudeCode, aiStrategy],
      votes: 14,
      views: 212,
      answers: [
        {
          body: "Be explicit about scope in the prompt: name the exact file and function, and say 'do not modify any other files.' A CLAUDE.md with conventions helps a lot too — it stops it from guessing.",
          author: sam,
          votes: 9,
          accepted: true,
        },
        {
          body: "Work in small commits. Ask it to make one change, review the diff, commit, then continue. Easy to revert when it overreaches.",
          author: devon,
          votes: 5,
        },
      ],
    },
    {
      title: "Gemini vs Claude for analyzing a 100-page investor data room — which, and how?",
      body: "I have a pile of PDFs from due diligence and want summaries + risk flags. Which model handles long docs best and what's the workflow?",
      author: lena,
      tags: [gemini, aiStrategy],
      votes: 11,
      views: 178,
      answers: [
        {
          body: "Both handle long context now. I split by document, ask for a structured summary (thesis / risks / numbers), then a final pass that compares across docs. Consistent prompt template is what makes it usable.",
          author: priya,
          votes: 7,
          accepted: true,
        },
      ],
    },
    {
      title: "First non-technical hire for an AI startup — who, and when?",
      body: "Two technical co-founders, early traction. Do we hire a generalist operator, a salesperson, or a designer first?",
      author: sam,
      tags: [hiring],
      votes: 9,
      views: 140,
      answers: [
        {
          body: "Hire the bottleneck. If you can build but can't get meetings, that's sales/GTM. If users churn on confusion, that's product/design. Don't hire a title, hire the thing that's blocking growth.",
          author: devon,
          votes: 8,
          accepted: true,
        },
        {
          body: "A great generalist operator buys you the most time at this stage. They'll cover ops, hiring, and customer support until you know what to specialize.",
          author: maya,
          votes: 3,
        },
      ],
    },
    {
      title: "We have an AI demo but no revenue. Too early for pre-seed?",
      body: "Slick demo, ~200 waitlist signups, zero paying users. Is it worth talking to investors now or should we wait for revenue?",
      author: maya,
      tags: [funding],
      votes: 17,
      views: 301,
      answers: [
        {
          body: "Pre-seed is bought on team + insight + early pull, not revenue. 200 signups is a signal — but go talk to 20 of them and turn 3 into paid pilots. Walking in with 'here's what they pay for' beats a waitlist every time.",
          author: priya,
          votes: 12,
          accepted: true,
        },
      ],
    },
    {
      title: "Cheapest reliable no-code stack to ship an AI MVP this weekend?",
      body: "Want to test an idea fast. Needs auth, a database, and one LLM feature. What do you reach for?",
      author: lena,
      tags: [noCode, cursor, product],
      votes: 8,
      views: 122,
      answers: [
        {
          body: "Honestly, a Next.js starter + Claude Code gets you further than pure no-code now, and you own the code. But if you want zero code: a form tool + Airtable + a workflow runner calling the LLM API.",
          author: sam,
          votes: 6,
        },
      ],
    },
    {
      title: "How do you keep AI/API costs from blowing up as usage grows?",
      body: "Costs are creeping. What actually moves the needle — caching, smaller models, prompt trimming?",
      author: devon,
      tags: [aiStrategy],
      votes: 10,
      views: 154,
      answers: [
        {
          body: "Biggest wins in order: cache repeated calls, route easy requests to a smaller/cheaper model, and trim context you're sending out of habit. Measure cost per request before optimizing — you'll be surprised what's expensive.",
          author: priya,
          votes: 5,
          accepted: true,
        },
      ],
    },
    {
      title: "Cold email to a potential mentor without it sounding like a pitch?",
      body: "Want to reach out to people way more experienced than me. How do I make it short and not annoying?",
      author: maya,
      tags: [growth],
      votes: 6,
      views: 98,
      answers: [
        {
          body: "Three sentences: who you are, the one specific thing you admire or learned from them, and one small, easy ask. No attachments, no calendar link in the first email. Make it trivially easy to reply 'yes'.",
          author: devon,
          votes: 4,
        },
      ],
    },
    {
      title: "Best way to validate an AI feature before spending weeks building it?",
      body: "I keep building things nobody uses. How do I test demand for an AI feature cheaply first?",
      author: sam,
      tags: [product, aiStrategy],
      votes: 13,
      views: 187,
      answers: [
        {
          body: "Fake the backend. Build the UI and run the 'AI' manually (or with a quick script) for your first 10 users. If they come back and use it, then automate. Demand first, engineering second.",
          author: lena,
          votes: 9,
          accepted: true,
        },
      ],
    },
    {
      // Authored by the demo account so the accept-answer path — author-only —
      // is reachable while clicking around.
      title: "How do you decide what to build next when everything feels urgent?",
      body: "Three customers want three different things, and I keep switching. How do more experienced founders pick?",
      author: you,
      tags: [product],
      votes: 5,
      views: 71,
      answers: [
        {
          body: "Pick the thing that, if it worked, would make the other two irrelevant. Usually that is not the loudest request — it is the one underneath all three.",
          author: sarah,
          votes: 4,
        },
        {
          body: "Write down what each customer would pay more for, in dollars. The list reorders itself.",
          author: devon,
          votes: 2,
        },
      ],
    },
    {
      title: "Do I need a SOC 2 report before enterprise pilots?",
      body: "A mid-size customer asked for our security documentation. We're three people. What's the minimum that unblocks the deal?",
      author: devon,
      tags: [growth, fintech],
      votes: 7,
      views: 133,
      answers: [
        {
          body: "For a pilot, usually not — a security questionnaire, a one-page policy doc, and a commitment to SOC 2 by a date will clear most procurement teams. Start the audit when a deal actually depends on it, not before.",
          author: sarah,
          votes: 6,
          accepted: true,
        },
      ],
    },
    {
      title: "How much equity for a first engineering hire at pre-seed?",
      body: "Not a co-founder, joining after the pre-seed. What's a normal range and how should vesting work?",
      author: lena,
      tags: [hiring, funding],
      votes: 12,
      views: 205,
      answers: [
        {
          body: "Typically 0.5–2% for the first non-founding engineer, four-year vest with a one-year cliff. The range moves on salary: below-market cash pushes it up. Put it in writing before they start, not after.",
          author: david,
          votes: 10,
          accepted: true,
        },
        {
          body: "Also decide your option pool at the same time. If you grant ad hoc you'll dilute yourself unevenly and it gets awkward at the seed round.",
          author: marcus,
          votes: 4,
        },
      ],
    },
  ];

  const createdQuestions = [];
  for (const q of questions) {
    createdQuestions.push(
      await prisma.question.create({
        data: {
          title: q.title,
          body: q.body,
          votes: q.votes,
          views: q.views,
          status: q.answers.some((a) => a.accepted) ? "answered" : "open",
          authorId: q.author.id,
          tags: { create: q.tags.map((t) => ({ tagId: t.id })) },
          answers: {
            create: q.answers.map((a) => ({
              body: a.body,
              votes: a.votes,
              accepted: a.accepted ?? false,
              authorId: a.author.id,
            })),
          },
        },
        include: { answers: true },
      }),
    );
  }

  // Point each answered question at its accepted answer.
  for (const q of createdQuestions) {
    const accepted = q.answers.find((a) => a.accepted);
    if (accepted) {
      await prisma.question.update({
        where: { id: q.id },
        data: { acceptedAnswerId: accepted.id },
      });
    }
  }

  // A couple of comments so the thread view has something below the fold.
  await prisma.comment.create({
    data: {
      body: "This matched my experience exactly — the CLAUDE.md part especially.",
      authorId: lena.id,
      questionId: createdQuestions[0].id,
    },
  });
  await prisma.comment.create({
    data: {
      body: "Worth adding: ask for the diff before it writes anything.",
      authorId: devon.id,
      answerId: createdQuestions[0].answers[0].id,
    },
  });

  // -------------------------------------------------------------------------
  // Advisors — one system, two price points
  // -------------------------------------------------------------------------

  type AdvisorSeed = {
    user: { id: string };
    headline: string;
    bio: string;
    company: string | null;
    yearsExperience: number;
    timezone: string;
    ratingAvg: number;
    reviewCount: number;
    expertise: { id: string }[];
    offerings: {
      title: string;
      description: string;
      kind: string;
      durationMin: number;
      priceCents: number;
    }[];
  };

  const advisorSeeds: AdvisorSeed[] = [
    {
      user: sarah,
      headline: "ex-Stripe Product Lead · pricing and positioning",
      bio: "I spent six years on payments products used by millions of businesses. I'm most useful to founders who have something working but can't explain why anyone should pay for it.",
      company: "Stripe (formerly)",
      yearsExperience: 12,
      timezone: "America/Los_Angeles",
      ratingAvg: 4.9,
      reviewCount: 2,
      expertise: [product, growth],
      offerings: [
        { title: "Intro call", description: "Tell me what you're building and where you're stuck. No prep needed.", kind: "intro_call", durationMin: 30, priceCents: 0 },
        { title: "Pricing teardown", description: "Send your pricing page ahead of time. We rebuild it together, with the reasoning written down so you can defend it later.", kind: "session", durationMin: 60, priceCents: 30000 },
      ],
    },
    {
      user: marcus,
      headline: "Angel investor · pre-seed fundraising",
      bio: "Raised three rounds as a founder, now on the other side of the table. I will tear your deck apart, kindly, and tell you what an investor actually hears.",
      company: null,
      yearsExperience: 15,
      timezone: "America/New_York",
      ratingAvg: 4.8,
      reviewCount: 1,
      expertise: [funding],
      offerings: [
        { title: "First call — free", description: "Fifteen minutes on whether you're ready to raise. Honest answer, including 'not yet'.", kind: "intro_call", durationMin: 15, priceCents: 0 },
        { title: "Deck review", description: "Async written teardown of your deck, slide by slide, within three business days.", kind: "async_review", durationMin: 0, priceCents: 25000 },
      ],
    },
    {
      user: aisha,
      headline: "Staff Engineer, ex-Google · production LLM systems",
      bio: "I help teams get from 'works in the demo' to 'works on Tuesday at 3pm under load'. Evals, retries, cost control, and knowing when the model is the wrong tool.",
      company: "Google (formerly)",
      yearsExperience: 10,
      timezone: "Europe/London",
      ratingAvg: 5,
      reviewCount: 1,
      expertise: [aiStrategy, claudeCode],
      offerings: [
        { title: "Architecture review", description: "Bring your LLM pipeline. We find the parts that will break first.", kind: "session", durationMin: 60, priceCents: 40000 },
        { title: "Office hours", description: "Free half hour, first-come. Good for a specific technical question.", kind: "intro_call", durationMin: 30, priceCents: 0 },
      ],
    },
    {
      user: tom,
      headline: "Growth lead · channels and cold outreach",
      bio: "Took two startups from no users to their first ten thousand. I care about the two channels that will work for you, not the twenty that won't.",
      company: null,
      yearsExperience: 8,
      timezone: "America/Mexico_City",
      ratingAvg: 4.6,
      reviewCount: 0,
      expertise: [growth],
      offerings: [
        { title: "Intro call", description: "Where your users actually are, and what it will cost to reach them.", kind: "intro_call", durationMin: 30, priceCents: 0 },
        { title: "Channel sprint", description: "Two sessions a week apart: pick a channel, run the test, review the numbers.", kind: "session", durationMin: 60, priceCents: 45000 },
      ],
    },
    {
      user: nadia,
      headline: "Design partner · brand and UX for non-designers",
      bio: "Your product does not need to be beautiful. It needs to look like it was made on purpose. I help founders clear that bar fast.",
      company: null,
      yearsExperience: 9,
      timezone: "Europe/Lisbon",
      ratingAvg: 4.9,
      reviewCount: 0,
      expertise: [product, noCode],
      offerings: [
        { title: "Intro call", description: "Show me your product. I'll tell you the three things costing you credibility.", kind: "intro_call", durationMin: 30, priceCents: 0 },
      ],
    },
    {
      user: david,
      headline: "2x founder · hiring and team building",
      bio: "Built and ran teams from two people to sixty. I'm best on the hires you're avoiding and the ones you're about to make too early.",
      company: null,
      yearsExperience: 14,
      timezone: "America/Toronto",
      ratingAvg: 4.7,
      reviewCount: 0,
      expertise: [hiring],
      offerings: [
        { title: "Intro call", description: "Talk through your next hire before you write the job post.", kind: "intro_call", durationMin: 30, priceCents: 0 },
        { title: "Hiring plan review", description: "Your next four hires, sequenced, with comp ranges and a scorecard for each.", kind: "session", durationMin: 60, priceCents: 35000 },
      ],
    },
  ];

  const advisorsByUser = new Map<string, { id: string; offeringIds: string[] }>();

  for (const a of advisorSeeds) {
    const profile = await prisma.advisorProfile.create({
      data: {
        userId: a.user.id,
        headline: a.headline,
        bio: a.bio,
        company: a.company,
        yearsExperience: a.yearsExperience,
        timezone: a.timezone,
        ratingAvg: a.ratingAvg,
        reviewCount: a.reviewCount,
        expertise: { create: a.expertise.map((t) => ({ tagId: t.id })) },
        offerings: { create: a.offerings },
      },
      include: { offerings: true },
    });

    // A week of bookable slots, weekdays only.
    for (let d = 2; d <= 12; d++) {
      const start = days(d);
      if (start.getDay() === 0 || start.getDay() === 6) continue;
      start.setHours(15, 0, 0, 0);
      await prisma.availabilitySlot.create({
        data: {
          advisorId: profile.id,
          startsAt: start,
          endsAt: new Date(start.getTime() + 30 * 60_000),
        },
      });
    }

    advisorsByUser.set(a.user.id, {
      id: profile.id,
      offeringIds: profile.offerings.map((o) => o.id),
    });
  }

  // One completed booking with a review, one upcoming — so the profile and the
  // "my bookings" surfaces both have a state to render.
  const sarahAdvisor = advisorsByUser.get(sarah.id)!;
  const completed = await prisma.booking.create({
    data: {
      offeringId: sarahAdvisor.offeringIds[0],
      advisorId: sarahAdvisor.id,
      menteeId: maya.id,
      startsAt: days(-9),
      status: "completed",
      menteeNote: "Wanted a sanity check on our pricing page before launch.",
    },
  });
  await prisma.review.create({
    data: {
      bookingId: completed.id,
      advisorId: sarahAdvisor.id,
      authorId: maya.id,
      rating: 5,
      body: "Thirty minutes and I rewrote our whole pricing page the same night. She asked the one question I'd been avoiding.",
    },
  });

  const marcusAdvisor = advisorsByUser.get(marcus.id)!;
  const marcusReviewed = await prisma.booking.create({
    data: {
      offeringId: marcusAdvisor.offeringIds[0],
      advisorId: marcusAdvisor.id,
      menteeId: sam.id,
      startsAt: days(-4),
      status: "completed",
    },
  });
  await prisma.review.create({
    data: {
      bookingId: marcusReviewed.id,
      advisorId: marcusAdvisor.id,
      authorId: sam.id,
      rating: 5,
      body: "Told me I wasn't ready to raise and exactly what would change that. Saved me two months of bad meetings.",
    },
  });

  const aishaAdvisor = advisorsByUser.get(aisha.id)!;
  const aishaReviewed = await prisma.booking.create({
    data: {
      offeringId: aishaAdvisor.offeringIds[1],
      advisorId: aishaAdvisor.id,
      menteeId: lena.id,
      startsAt: days(-2),
      status: "completed",
    },
  });
  await prisma.review.create({
    data: {
      bookingId: aishaReviewed.id,
      advisorId: aishaAdvisor.id,
      authorId: lena.id,
      rating: 5,
      body: "Found the retry bug that had been costing us money for a month.",
    },
  });

  // Completed and unreviewed, on the demo account, so the review form on
  // /bookings is reachable without having to fake a session first.
  const tomAdvisor = advisorsByUser.get(tom.id)!;
  await prisma.booking.create({
    data: {
      offeringId: tomAdvisor.offeringIds[0],
      advisorId: tomAdvisor.id,
      menteeId: you.id,
      startsAt: days(-6),
      status: "completed",
      menteeNote: "Trying to work out which channel to test first.",
    },
  });

  // Upcoming, on the demo account, so /mentors shows a booked state.
  const upcomingSlot = await prisma.availabilitySlot.findFirst({
    where: { advisorId: aishaAdvisor.id, booking: null },
    orderBy: { startsAt: "asc" },
  });
  await prisma.booking.create({
    data: {
      offeringId: aishaAdvisor.offeringIds[1],
      advisorId: aishaAdvisor.id,
      menteeId: you.id,
      slotId: upcomingSlot?.id,
      startsAt: upcomingSlot?.startsAt ?? days(3),
      status: "confirmed",
      meetingUrl: "https://meet.example.com/demo-session",
      menteeNote: "Want to review how we're handling model failures.",
    },
  });

  // -------------------------------------------------------------------------
  // Partners — needed before events, since events can be partner-hosted
  // -------------------------------------------------------------------------

  const googlePartner = await prisma.partner.create({
    data: { slug: "google-devrel", name: "Google for Startups", blurb: "Cloud credits, technical workshops, and the Gemini team answering questions directly.", websiteUrl: "https://startup.google.com", logoEmoji: "🔷", color: "#2563eb", tier: "platinum" },
  });
  const anthropicPartner = await prisma.partner.create({
    data: { slug: "anthropic", name: "Anthropic", blurb: "API credits and hands-on sessions on building with Claude in production.", websiteUrl: "https://anthropic.com", logoEmoji: "🅰️", color: "#d97706", tier: "platinum" },
  });
  const awsPartner = await prisma.partner.create({
    data: { slug: "aws-activate", name: "AWS Activate", blurb: "Infrastructure credits and architecture reviews for early-stage companies.", websiteUrl: "https://aws.amazon.com/activate", logoEmoji: "☁️", color: "#f59e0b", tier: "gold" },
  });
  const stripePartner = await prisma.partner.create({
    data: { slug: "stripe-atlas", name: "Stripe Atlas", blurb: "Incorporation, banking, and fee waivers for founders getting started.", websiteUrl: "https://stripe.com/atlas", logoEmoji: "💳", color: "#6366f1", tier: "gold" },
  });

  await prisma.partnerOffer.createMany({
    data: [
      { partnerId: googlePartner.id, title: "$5,000 in Google Cloud credits", description: "Two years of credits for eligible pre-seed and seed companies, plus access to the Startups technical team.", kind: "credits", valueBlurb: "$5,000 in cloud credits", eligibility: "Incorporated, less than $5M raised, no prior Google Cloud credits.", isInternalFlow: true, endsAt: days(90) },
      { partnerId: anthropicPartner.id, title: "$1,000 in Claude API credits", description: "Credits for companies building on the Claude API, with a technical onboarding session.", kind: "credits", valueBlurb: "$1,000 in API credits", eligibility: "Building an AI product, pre-Series A, must have a working prototype.", isInternalFlow: true, endsAt: days(60) },
      { partnerId: awsPartner.id, title: "AWS Activate — Portfolio tier", description: "Up to $25,000 in AWS credits for companies in our portfolio or backed by a partner fund.", kind: "credits", valueBlurb: "Up to $25,000 in credits", eligibility: "Portfolio companies and referred startups only.", applyUrl: "https://aws.amazon.com/activate/portfolio-signup", isInternalFlow: false, endsAt: days(120) },
      { partnerId: stripePartner.id, title: "Waived incorporation fee", description: "Stripe Atlas incorporation with the setup fee waived for community members.", kind: "discount", valueBlurb: "$500 fee waived", eligibility: "Not yet incorporated, US entity.", applyUrl: "https://stripe.com/atlas", isInternalFlow: false },
      { partnerId: googlePartner.id, title: "Gemini office hours", description: "Monthly 1:1 slots with a Google DevRel engineer for technical questions.", kind: "program", valueBlurb: "Monthly 1:1 access", eligibility: "Open to all members.", isInternalFlow: true },
    ],
  });

  const creditOffer = await prisma.partnerOffer.findFirstOrThrow({
    where: { title: { contains: "Claude API credits" } },
  });
  await prisma.offerClaim.create({
    data: { offerId: creditOffer.id, userId: maya.id, status: "approved", note: "Routing engine, ~40k requests/month." },
  });
  await prisma.offerClaim.create({
    data: { offerId: creditOffer.id, userId: sam.id, status: "requested", note: "Three small products, all calling the API." },
  });

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  const eventSeeds = [
    { slug: "claude-code-for-founders", title: "Claude Code for Founders: Live Build", description: "Watch a non-technical founder ship a real feature with Claude Code, start to finish. Bring your questions.", type: "workshop", source: "first_party", organizerName: "Platform Team", partnerId: null, isOnline: true, location: "Online", startsAt: days(5), capacity: 200, going: 142 },
    { slug: "ama-raising-first-500k", title: "AMA: Raising Your First $500k", description: "Open Q&A with angel investor Marcus Lee on pre-seed fundraising for AI startups.", type: "ama", source: "first_party", organizerName: "Marcus Lee", partnerId: null, isOnline: true, location: "Online", startsAt: days(9), capacity: 300, going: 211 },
    { slug: "gemini-for-product-teams", title: "Gemini for Product Teams", description: "Google DevRel walks through Gemini features founders can use today — design, docs, and data.", type: "workshop", source: "partner", organizerName: "Google for Startups", partnerId: googlePartner.id, isOnline: true, location: "Online", startsAt: days(14), capacity: 500, going: 318 },
    { slug: "pitch-night-ai-startups", title: "Pitch Night: AI Startups", description: "Five founders pitch live to a panel of investors. Apply to pitch or come to learn.", type: "pitch_night", source: "first_party", organizerName: "Platform Team", partnerId: null, isOnline: false, location: "Toronto + Online", startsAt: days(20), capacity: 150, going: 96 },
    { slug: "building-on-claude-in-production", title: "Building on Claude in Production", description: "Anthropic engineers on evals, cost control, and what breaks at scale.", type: "workshop", source: "partner", organizerName: "Anthropic", partnerId: anthropicPartner.id, isOnline: true, location: "Online", startsAt: days(26), capacity: 400, going: 187 },
    { slug: "demo-day-fall-cohort", title: "Demo Day: Fall Cohort", description: "The fall founder cohort shows what they built. Networking after.", type: "demo_day", source: "first_party", organizerName: "Platform Team", partnerId: null, isOnline: true, location: "Online", startsAt: days(38), capacity: 1000, going: 540 },
    { slug: "startup-week-berlin", title: "Startup Week Berlin", description: "A week of founder events across the city. We're hosting the AI track on day three.", type: "startup_week", source: "external", organizerName: "Startup Week", partnerId: null, isOnline: false, location: "Berlin", startsAt: days(52), capacity: 2000, going: 0 },
  ];

  const attendees = [maya, devon, priya, sam, lena, tom, nadia, david];
  for (const e of eventSeeds) {
    const { going, ...data } = e;
    const event = await prisma.event.create({
      data: {
        ...data,
        externalUrl: e.source === "external" ? "https://startupweek.example.com" : null,
      },
    });

    // Real RSVP rows for a handful of members. `going` is only used to pick how
    // many demo attendees to write — there is no counter column any more.
    const count = Math.min(attendees.length, Math.ceil(going / 60));
    for (let i = 0; i < count; i++) {
      await prisma.eventRsvp.create({
        data: { eventId: event.id, userId: attendees[i].id, status: "going" },
      });
    }
  }

  // The demo account is going to the first event.
  const firstEvent = await prisma.event.findFirstOrThrow({ where: { slug: "claude-code-for-founders" } });
  await prisma.eventRsvp.create({
    data: { eventId: firstEvent.id, userId: you.id, status: "going" },
  });

  // -------------------------------------------------------------------------
  // Private groups
  // -------------------------------------------------------------------------

  const fintechGroup = await prisma.group.create({
    data: {
      slug: "fintech-founders",
      title: "Fintech Founders Room",
      description: "Compliance, banking partners, and the parts of fintech nobody blogs about. Run by founders who have shipped regulated products.",
      industry: "Fintech",
      coverEmoji: "🏦",
      color: "#059669",
      ownerId: sarah.id,
      priceCents: 4900,
      billingPeriod: "monthly",
      memberLimit: 60,
      memberCount: 3,
      tags: { create: [{ tagId: fintech.id }, { tagId: logistics.id }] },
    },
  });

  const aiOpsGroup = await prisma.group.create({
    data: {
      slug: "llm-in-production",
      title: "LLMs in Production",
      description: "A working group for teams running language models under real load. Evals, incidents, cost, and postmortems shared privately.",
      industry: "AI Infrastructure",
      coverEmoji: "⚡",
      color: "#2563eb",
      ownerId: aisha.id,
      priceCents: 7900,
      billingPeriod: "monthly",
      memberLimit: 40,
      memberCount: 3,
      tags: { create: [{ tagId: aiStrategy.id }, { tagId: claudeCode.id }] },
    },
  });

  const firstTimeGroup = await prisma.group.create({
    data: {
      slug: "first-time-founders",
      title: "First-Time Founders",
      description: "Free peer group for people running a company for the first time. Weekly thread, no pitching, no gurus.",
      industry: "General",
      coverEmoji: "🌱",
      color: "#a855f7",
      ownerId: david.id,
      priceCents: 0,
      billingPeriod: "monthly",
      memberLimit: 200,
      memberCount: 4,
    },
  });

  const memberships: { groupId: string; userId: string; role: string }[] = [
    { groupId: fintechGroup.id, userId: sarah.id, role: "owner" },
    { groupId: fintechGroup.id, userId: devon.id, role: "member" },
    { groupId: fintechGroup.id, userId: priya.id, role: "member" },
    { groupId: aiOpsGroup.id, userId: aisha.id, role: "owner" },
    { groupId: aiOpsGroup.id, userId: sam.id, role: "member" },
    { groupId: aiOpsGroup.id, userId: maya.id, role: "member" },
    { groupId: firstTimeGroup.id, userId: david.id, role: "owner" },
    { groupId: firstTimeGroup.id, userId: lena.id, role: "member" },
    { groupId: firstTimeGroup.id, userId: maya.id, role: "member" },
    // The demo account is a member of exactly one group, so the gated and
    // non-gated states are both reachable while clicking around.
    { groupId: firstTimeGroup.id, userId: you.id, role: "member" },
  ];
  for (const m of memberships) await prisma.groupMembership.create({ data: m });

  const groupPosts = [
    { groupId: aiOpsGroup.id, authorId: aisha.id, title: "Postmortem: our eval suite was lying to us", body: "We passed 94% on our internal evals for six weeks while support tickets climbed. The eval set was built from the same happy-path examples we designed the prompts against.\n\nWhat fixed it: sampling real failed conversations weekly and adding them to the set. Pass rate dropped to 61% overnight, which was the true number all along.", isPinned: true },
    { groupId: aiOpsGroup.id, authorId: sam.id, title: "Cheapest way to cut token spend 40%", body: "Caching the system prompt did most of it. Second biggest win was not sending the full conversation history on every turn — we summarize anything older than ten messages." },
    { groupId: fintechGroup.id, authorId: sarah.id, title: "Which banking partners will actually talk to a pre-seed company", body: "Short list, updated this month. Two of these will onboard you with a prototype and a cap table; the rest want revenue.", isPinned: true },
    { groupId: firstTimeGroup.id, authorId: david.id, title: "Weekly thread: what are you stuck on?", body: "Post the thing you've been avoiding. No advice unless it's asked for.", isPinned: true },
    { groupId: firstTimeGroup.id, authorId: lena.id, title: "I finally fired a customer", body: "They were 4% of revenue and about 40% of my week. Should have done it in March." },
  ];
  for (const p of groupPosts) {
    const post = await prisma.groupPost.create({ data: p });
    if (post.title?.startsWith("Postmortem")) {
      await prisma.groupComment.create({
        data: { postId: post.id, authorId: sam.id, body: "The 'built from the same examples' trap is so easy to fall into. We're rebuilding ours from support tickets now." },
      });
      await prisma.groupComment.create({
        data: { postId: post.id, authorId: maya.id, body: "How often do you re-sample? Weekly feels like a lot of manual review." },
      });
    }
  }

  // -------------------------------------------------------------------------
  // Blog
  // -------------------------------------------------------------------------

  const posts = [
    {
      slug: "what-pre-seed-investors-actually-read",
      title: "What pre-seed investors actually read on your deck",
      excerpt: "Ten slides, and most of them get four seconds. Here is where the attention goes, from someone who reads a hundred decks a month.",
      body: "Most founders build a deck for a careful reader who does not exist.\n\n## The first four seconds\n\nAn investor opens your deck and looks at exactly two things: the one-line description and the traction slide. Everything else is read only if those two survive.\n\n## What the market slide is for\n\nIt is not for proving the market is big. Every deck says the market is big. It is for proving *you know something specific* about this market that the reader does not.\n\n## The slide people skip\n\nCompetition. Not because it does not matter, but because the standard 2x2 with your logo in the top right tells the reader nothing. Replace it with a sentence: who customers use today, and why they switch.\n\n## What to do with this\n\nCut the deck to ten slides. Write the one-liner last, after you have written the rest, because that is when you will finally know what you are building.",
      coverEmoji: "📊",
      color: "#10b981",
      authorId: marcus.id,
      readingMinutes: 6,
      viewCount: 1840,
      publishedAt: days(-3),
      tags: [funding],
    },
    {
      slug: "ai-features-nobody-uses",
      title: "Why your AI feature has no users",
      excerpt: "The feature works. The demo is good. Nobody opens it twice. Usually it is one of four things.",
      body: "You shipped it, the demo went well, and the usage graph is a flat line just above zero.\n\n## It solves a problem people do not have yet\n\nThe most common one. The feature is impressive rather than useful. Impressive gets you a first try; useful gets you a second.\n\n## It is slower than doing it manually\n\nIf your AI summarizer takes twelve seconds and reading the email takes eight, you have built a slower email.\n\n## It is right 80% of the time\n\nEighty percent sounds high. In practice it means the user has to check every output, which costs more attention than doing the task themselves. For most workflows, the useful threshold is somewhere around 95% or a design that makes errors cheap to catch.\n\n## Nobody knows it exists\n\nThe boring one, and the easiest to fix. Check your own analytics before rewriting the feature.",
      coverEmoji: "🧪",
      color: "#6366f1",
      authorId: aisha.id,
      readingMinutes: 5,
      viewCount: 2260,
      publishedAt: days(-9),
      tags: [aiStrategy, product],
    },
    {
      slug: "hiring-your-first-operator",
      title: "Hiring your first operator",
      excerpt: "The hire that buys back the most time, and the three ways founders get it wrong.",
      body: "Founders overhire engineers and underhire operators.\n\n## What an operator actually does\n\nThe list is unglamorous: billing, support, vendor contracts, scheduling, the half of hiring that is not interviewing. None of it is your competitive advantage, and all of it is currently on your calendar.\n\n## Three ways this goes wrong\n\n**Hiring a title instead of a bottleneck.** Write down what took your time last week before you write the job post.\n\n**Hiring too senior.** A former COO will want a team. You are giving them a to-do list.\n\n**Not giving them authority.** An operator who has to ask you before every decision is a more expensive version of your calendar.\n\n## When\n\nWhen you can name eight hours a week you would hand over on day one.",
      coverEmoji: "🧩",
      color: "#f59e0b",
      authorId: david.id,
      readingMinutes: 4,
      viewCount: 980,
      publishedAt: days(-16),
      tags: [hiring],
    },
    {
      slug: "shipping-without-engineers",
      title: "Shipping a real product without engineers",
      excerpt: "A designer's account of getting to a hundred paying users before hiring anyone technical.",
      body: "I am a designer. I shipped a product that makes money and I did not write most of the code.\n\n## The stack that worked\n\nA Next.js starter, an AI coding assistant, and a hosted database. I understand roughly 60% of my own codebase, which is enough to change things and not enough to be reckless.\n\n## What I could not do alone\n\nAnything involving money moving, and anything involving other people's data. I paid a contractor for two weeks to do payments and auth properly. Best money I spent.\n\n## The honest limitation\n\nThis works until it does not. At about eighty users I hit problems that needed someone who actually knows what a database index is. Plan for that moment instead of pretending it will not come.",
      coverEmoji: "🎨",
      color: "#a855f7",
      authorId: lena.id,
      readingMinutes: 5,
      viewCount: 1520,
      publishedAt: days(-24),
      tags: [noCode, product],
    },
    {
      slug: "draft-fund-thesis",
      title: "Our investment thesis, in plain language",
      excerpt: "What we fund, what we do not, and what happens after you apply.",
      body: "Draft — not yet published.",
      coverEmoji: "💡",
      color: "#334155",
      authorId: staff.id,
      readingMinutes: 3,
      viewCount: 0,
      publishedAt: null,
      tags: [funding],
      status: "draft",
    },
  ];

  for (const p of posts) {
    const { tags, status, ...data } = p;
    await prisma.post.create({
      data: {
        ...data,
        status: status ?? "published",
        tags: { create: tags.map((t) => ({ tagId: t.id })) },
      },
    });
  }

  // -------------------------------------------------------------------------
  // Training — self-serve tool courses and cohort programs
  // -------------------------------------------------------------------------

  const claudeCourse = await prisma.course.create({
    data: {
      slug: "claude-code-for-non-engineers",
      title: "Claude Code for Non-Engineers",
      summary: "Ship a working feature to a real codebase without a computer science degree.",
      description: "Six lessons that take you from an empty terminal to a merged change. You will learn how to scope a request, read a diff well enough to catch mistakes, and recover when the model does something you did not ask for.",
      kind: "tool_training",
      level: "beginner",
      coverEmoji: "🤖",
      color: "#d97706",
      priceCents: 0,
      instructorId: sam.id,
      lastReviewedAt: days(-20),
      lessons: {
        create: [
          { order: 1, title: "What the tool is actually doing", body: "Before you type anything, it helps to know what happens when you press enter.", durationMin: 8, isPreview: true },
          { order: 2, title: "Scoping a request so it stays scoped", body: "Naming the file, the function, and the boundary.", durationMin: 12 },
          { order: 3, title: "Reading a diff", body: "You do not need to understand every line. You need to spot the three that matter.", durationMin: 14 },
          { order: 4, title: "Committing in small pieces", body: "Why one change per commit makes the model easier to work with.", durationMin: 10 },
          { order: 5, title: "When it goes wrong", body: "Reverting, re-prompting, and knowing when to stop and ask a person.", durationMin: 11 },
          { order: 6, title: "Your first real change", body: "A guided exercise on a sample repository.", durationMin: 25 },
        ],
      },
    },
  });

  const evalsCourse = await prisma.course.create({
    data: {
      slug: "evals-for-llm-products",
      title: "Evals for LLM Products",
      summary: "Build an evaluation suite that tells you the truth about your model's behaviour.",
      description: "Most eval suites are built from the examples the prompts were written against, which is why they report numbers nobody believes. This course covers building a set from real failures, scoring without a human in the loop, and wiring it into CI.",
      kind: "tool_training",
      level: "intermediate",
      coverEmoji: "📐",
      color: "#2563eb",
      priceCents: 9900,
      instructorId: aisha.id,
      lastReviewedAt: days(-5),
      lessons: {
        create: [
          { order: 1, title: "Why your current evals pass", body: "The selection bias at the heart of most eval suites.", durationMin: 9, isPreview: true },
          { order: 2, title: "Sourcing cases from real failures", body: "Mining support tickets and abandoned sessions.", durationMin: 16 },
          { order: 3, title: "Scoring without humans", body: "Rubrics, model graders, and where each one lies to you.", durationMin: 18 },
          { order: 4, title: "Running evals in CI", body: "Making a regression block a deploy.", durationMin: 14 },
        ],
      },
    },
  });

  const programCourse = await prisma.course.create({
    data: {
      slug: "founder-program",
      title: "The Founder Program",
      summary: "An eight-week cohort for founders going from prototype to first paying customers.",
      description: "Small cohorts, weekly live sessions, and a working group of six founders at the same stage. Ends with Demo Day. Applications are reviewed by the platform team.",
      kind: "program",
      level: "intermediate",
      coverEmoji: "🎓",
      color: "#6366f1",
      priceCents: 149900,
      instructorId: staff.id,
      cohorts: {
        create: [
          { name: "Fall 2026", startsAt: days(30), endsAt: days(86), capacity: 30, priceCents: 149900 },
          { name: "Winter 2027", startsAt: days(140), endsAt: days(196), capacity: 30, priceCents: 149900 },
        ],
      },
      lessons: {
        create: [
          { order: 1, title: "Week 1 — Who is this for, exactly?", body: "Narrowing until it hurts.", durationMin: 90, isPreview: true },
          { order: 2, title: "Week 2 — Talking to twenty of them", body: "Interviews that produce decisions, not compliments.", durationMin: 90 },
          { order: 3, title: "Week 3 — Charging money", body: "Your first price, and why it is too low.", durationMin: 90 },
          { order: 4, title: "Week 4 — The first ten customers", body: "Doing things that do not scale, deliberately.", durationMin: 90 },
        ],
      },
    },
  });

  // Enrollments, including one for the demo account with partial progress.
  const claudeLessons = await prisma.lesson.findMany({
    where: { courseId: claudeCourse.id },
    orderBy: { order: "asc" },
  });
  const yourEnrollment = await prisma.enrollment.create({
    data: { courseId: claudeCourse.id, userId: you.id, status: "active" },
  });
  for (const lesson of claudeLessons.slice(0, 3)) {
    await prisma.lessonProgress.create({
      data: { enrollmentId: yourEnrollment.id, lessonId: lesson.id },
    });
  }
  await prisma.enrollment.create({ data: { courseId: claudeCourse.id, userId: lena.id, status: "completed" } });
  await prisma.enrollment.create({ data: { courseId: evalsCourse.id, userId: sam.id, status: "active" } });

  const fallCohort = await prisma.cohort.findFirstOrThrow({ where: { courseId: programCourse.id, name: "Fall 2026" } });
  await prisma.enrollment.create({
    data: { courseId: programCourse.id, cohortId: fallCohort.id, userId: maya.id, status: "active" },
  });

  // -------------------------------------------------------------------------
  // Companies — one model behind the portfolio and the job board
  // -------------------------------------------------------------------------

  const routeworks = await prisma.company.create({
    data: { slug: "routeworks", name: "Routeworks", tagline: "Routing software for mid-size freight carriers", description: "Routeworks plans daily routes for carriers running 20–200 trucks, the segment too small for enterprise TMS and too big for spreadsheets.", websiteUrl: "https://routeworks.example.com", logoEmoji: "🚚", color: "#0ea5e9", stage: "seed", teamSize: "6-15", sectors: "Logistics,AI", ownerUserId: maya.id, isPortfolio: true, portfolioBatch: "Spring 2026", announcedAt: days(-40) },
  });
  const ledgerlyCompany = await prisma.company.create({
    data: { slug: "ledgerly", name: "Ledgerly", tagline: "Bookkeeping that reconciles itself", description: "Automated reconciliation for small accounting firms, built around the messy edge cases that break the incumbents.", websiteUrl: "https://ledgerly.example.com", logoEmoji: "📒", color: "#059669", stage: "pre_seed", teamSize: "1-5", sectors: "Fintech,AI", ownerUserId: devon.id, isPortfolio: true, portfolioBatch: "Spring 2026", announcedAt: days(-40) },
  });
  const brightloop = await prisma.company.create({
    data: { slug: "brightloop", name: "Brightloop", tagline: "Onboarding flows that write themselves", description: "Generates and A/B tests product onboarding from your existing docs and session recordings.", logoEmoji: "🔆", color: "#a855f7", stage: "seed", teamSize: "6-15", sectors: "Product,AI", ownerUserId: lena.id, isPortfolio: true, portfolioBatch: "Fall 2025", announcedAt: days(-190) },
  });
  const harborCompany = await prisma.company.create({
    data: { slug: "harbor-systems", name: "Harbor Systems", tagline: "Compliance monitoring for regulated fintech", description: "Continuous compliance checks for companies that hold a license and cannot afford a surprise.", logoEmoji: "⚓", color: "#334155", stage: "series_a", teamSize: "16-50", sectors: "Fintech", isPortfolio: false },
  });

  const jobs = [
    { companyId: routeworks.id, postedById: maya.id, title: "Founding Backend Engineer", description: "Own the routing engine end to end. You will be the third engineer and the first hire who touches the optimization core.\n\nWe care that you have shipped something hard and can explain the trade-offs you made.", roleType: "eng", employment: "full_time", locationMode: "remote", location: "Remote (UTC+0 to UTC+3)", salaryMinCents: 12000000, salaryMaxCents: 16000000, equityMin: 0.5, equityMax: 1.5, expiresAt: days(45) },
    { companyId: routeworks.id, postedById: maya.id, title: "Customer Operations Lead", description: "Our customers run trucks, not software. You will onboard them, learn their workflows, and turn what you hear into the roadmap.", roleType: "ops", employment: "full_time", locationMode: "hybrid", location: "Lagos", salaryMinCents: 6000000, salaryMaxCents: 8500000, equityMin: 0.1, equityMax: 0.4, expiresAt: days(30) },
    { companyId: ledgerlyCompany.id, postedById: devon.id, title: "Full-Stack Engineer (Contract)", description: "Three months, possibly longer. Reconciliation UI and the rules engine behind it.", roleType: "eng", employment: "contract", locationMode: "remote", location: "Remote", salaryMinCents: 8000000, salaryMaxCents: 11000000, expiresAt: days(21) },
    { companyId: brightloop.id, postedById: lena.id, title: "Product Designer", description: "Second designer. You will own the onboarding builder, which is the part of the product customers actually touch every day.", roleType: "design", employment: "full_time", locationMode: "remote", location: "Remote (Europe)", salaryMinCents: 9000000, salaryMaxCents: 12000000, equityMin: 0.2, equityMax: 0.6, expiresAt: days(60) },
    { companyId: harborCompany.id, postedById: staff.id, title: "Compliance Engineer", description: "Translate regulation into checks that run continuously. Prior fintech or regtech experience expected.", roleType: "eng", employment: "full_time", locationMode: "onsite", location: "New York", salaryMinCents: 16000000, salaryMaxCents: 21000000, expiresAt: days(50) },
    { companyId: brightloop.id, postedById: lena.id, title: "Growth Marketer", description: "Closed — filled internally.", roleType: "gtm", employment: "full_time", locationMode: "remote", location: "Remote", status: "closed", expiresAt: days(-5) },
  ];
  for (const j of jobs) await prisma.job.create({ data: j });

  const backendJob = await prisma.job.findFirstOrThrow({ where: { title: "Founding Backend Engineer" } });
  await prisma.jobApplication.create({
    data: { jobId: backendJob.id, userId: sam.id, note: "I have built route optimization before, at a much worse company. Happy to walk through what I would change.", status: "reviewing" },
  });

  // -------------------------------------------------------------------------
  // Funding — one directory, four labels
  // -------------------------------------------------------------------------

  const internalFund = await prisma.fundingSource.create({
    data: { slug: "launch-fund", name: "Launch Fund", description: "Our own pre-seed fund. We write first cheques into companies building with AI, usually before revenue, often before incorporation.", logoEmoji: "🚀", color: "#6366f1", kind: "internal_fund", isInternal: true, checkSizeMinCents: 2500000, checkSizeMaxCents: 25000000, stages: "idea,pre_seed", sectors: "AI,Fintech,Logistics,Developer Tools", geos: "Global", applicationMode: "internal_application" },
  });
  await prisma.fundingSource.createMany({
    data: [
      { slug: "northwind-capital", name: "Northwind Capital", description: "Seed-stage fund focused on vertical AI applications in unglamorous industries.", websiteUrl: "https://northwind.example.com", logoEmoji: "🌬️", color: "#0ea5e9", kind: "vc", checkSizeMinCents: 50000000, checkSizeMaxCents: 300000000, stages: "seed,series_a", sectors: "AI,Logistics,Healthcare", geos: "North America,Europe", applicationMode: "intro_request" },
      { slug: "priya-nair-angel", name: "Priya Nair (Angel)", description: "Individual angel writing pre-seed cheques into AI companies. Answers email within a week.", logoEmoji: "💸", color: "#10b981", kind: "angel", checkSizeMinCents: 2500000, checkSizeMaxCents: 10000000, stages: "idea,pre_seed", sectors: "AI,Developer Tools", geos: "Global", applicationMode: "intro_request" },
      { slug: "ai-research-grant", name: "Applied AI Research Grant", description: "Non-dilutive grant for teams publishing or open-sourcing part of their work. Quarterly deadlines.", websiteUrl: "https://grants.example.org", logoEmoji: "🎓", color: "#a855f7", kind: "grant", checkSizeMinCents: 1000000, checkSizeMaxCents: 7500000, stages: "idea,pre_seed,seed", sectors: "AI", geos: "Global", applicationMode: "external_link", applyUrl: "https://grants.example.org/apply" },
      { slug: "mainstreet-revenue-loan", name: "Mainstreet Revenue Loan", description: "Revenue-based financing for companies past $20k MRR. No equity, fixed repayment percentage.", websiteUrl: "https://mainstreet.example.com", logoEmoji: "🏛️", color: "#f59e0b", kind: "loan", checkSizeMinCents: 5000000, checkSizeMaxCents: 100000000, stages: "seed,growth", sectors: "SaaS,Fintech", geos: "North America", applicationMode: "external_link", applyUrl: "https://mainstreet.example.com/apply" },
      { slug: "atlas-accelerator", name: "Atlas Accelerator", description: "Twelve-week programme, $150k for 7%, ending in a demo day with 200+ investors.", websiteUrl: "https://atlas.example.com", logoEmoji: "🗺️", color: "#ec4899", kind: "accelerator", checkSizeMinCents: 15000000, checkSizeMaxCents: 15000000, stages: "pre_seed,seed", sectors: "AI,SaaS,Consumer", geos: "Global", applicationMode: "external_link", applyUrl: "https://atlas.example.com/apply" },
    ],
  });

  await prisma.fundingApplication.create({
    data: { sourceId: internalFund.id, userId: maya.id, companyId: routeworks.id, stage: "seed", askCents: 75000000, blurb: "Raising a seed to expand from route planning into dispatch. 40 carriers paying, $31k MRR, growing 18% month over month.", status: "in_review", staffNote: "Strong retention. Confirm the churn figure from Q1 before the partner meeting." },
  });
  await prisma.fundingApplication.create({
    data: { sourceId: internalFund.id, userId: sam.id, stage: "pre_seed", askCents: 15000000, blurb: "Solo founder, three products, one of them at $4k MRR. Want to focus on the one that works.", status: "submitted" },
  });

  await prisma.investment.create({
    data: { companyId: routeworks.id, sourceId: internalFund.id, roundName: "Pre-Seed", amountCents: 25000000, investedAt: days(-220), isPublic: true },
  });
  await prisma.investment.create({
    data: { companyId: ledgerlyCompany.id, sourceId: internalFund.id, roundName: "Pre-Seed", amountCents: 15000000, investedAt: days(-120), isPublic: true },
  });
  await prisma.investment.create({
    data: { companyId: brightloop.id, sourceId: internalFund.id, roundName: "Pre-Seed", amountCents: 20000000, investedAt: days(-380), isPublic: false },
  });

  // -------------------------------------------------------------------------
  // Notifications for the demo account
  // -------------------------------------------------------------------------

  await prisma.notification.createMany({
    data: [
      { userId: you.id, actorId: aisha.id, kind: "booking", title: "Aisha Khan confirmed your architecture review", href: "/mentors/aisha-khan" },
      { userId: you.id, actorId: david.id, kind: "group_post", title: "New post in First-Time Founders", href: "/groups/first-time-founders" },
      { userId: you.id, kind: "event_reminder", title: "Claude Code for Founders starts in 5 days", href: "/events", readAt: days(-1) },
    ],
  });

  const counts = {
    users: await prisma.user.count(),
    questions: await prisma.question.count(),
    advisors: await prisma.advisorProfile.count(),
    offerings: await prisma.offering.count(),
    events: await prisma.event.count(),
    groups: await prisma.group.count(),
    posts: await prisma.post.count(),
    courses: await prisma.course.count(),
    companies: await prisma.company.count(),
    jobs: await prisma.job.count(),
    partners: await prisma.partner.count(),
    fundingSources: await prisma.fundingSource.count(),
  };
  console.log("Seeded:", counts);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
