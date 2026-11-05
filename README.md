# 🚀 Launch Community

A community platform for **AI-curious founders** — ask anything, get answers from people
who've done it, and find mentors, funding, and events.

Built around one insight: *most new founders get stuck (on a tool, a hire, a fundraise)
and never ask.* Launch Community makes asking the default.

## What's in this MVP

- **Q&A core** — ask questions, browse the feed (filter by tool/topic, sort by new or top),
  view a question, post answers, and upvote questions & answers (one vote per user, toggleable).
- **Mentors** — directory of experienced operators/founders/investors offering intro calls.
- **Events** — workshops, AMAs, and pitch nights, including partner sessions (e.g. Google DevRel).
- **Lightweight identity** — a mock current user (the seeded "You" account) so everything is
  usable without real auth yet. Swappable later via the `uid` cookie.

## Stack

- **Next.js 16** (App Router, Server Actions) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Prisma 7** + **SQLite** (via the `better-sqlite3` driver adapter)

## Run it

```bash
npm install          # also runs `prisma generate`
npm run db:reset     # apply migrations + (re)seed demo data
npm run dev          # http://localhost:3000
```

Useful scripts:

- `npm run db:seed` — reseed demo content (idempotent)
- `npm run db:reset` — drop, re-migrate, and reseed
- `npx prisma studio` — browse the database

## Project layout

```
app/
  page.tsx                # landing / home
  questions/              # feed + [id] detail
  ask/                    # ask a question
  mentors/  events/       # directories
  actions.ts              # server actions (create question/answer, vote)
  generated/prisma/       # generated Prisma client
components/                # NavBar, QuestionCard, VoteButton, TagChip, Avatar
lib/                       # prisma client, session (mock auth), formatters
prisma/                    # schema + seed
```

## Suggested next steps

1. **Real auth** (email/OAuth) — replace `lib/session.ts`; everything else already keys off a user.
2. **Search** across questions, and accepting answers from the UI (author-only).
3. **Funding** section — investor profiles + warm-intro requests.
4. **Notifications** when your question gets an answer.
5. **Partner showcase** — a space for firms to post new features/tools.
6. Move SQLite → Postgres for deploy (swap the Prisma adapter).
