import Link from "next/link";
import { QuestionCard } from "@/components/QuestionCard";
import { Avatar } from "@/components/Avatar";
import { formatEventDate } from "@/lib/format";
import { getQuestionFeed } from "@/lib/data/questions";
import { getUpcomingEvents } from "@/lib/data/events";
import { getAdvisors } from "@/lib/data/advisors";
import { getGroups } from "@/lib/data/groups";
import { getPlatformStats } from "@/lib/data/stats";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, events, advisors, groups, stats] = await Promise.all([
    getQuestionFeed({ sort: "votes", take: 4 }),
    getUpcomingEvents({ take: 1 }),
    getAdvisors(),
    getGroups(),
    getPlatformStats(),
  ]);

  const nextEvent = events[0];
  const featuredAdvisors = advisors.slice(0, 4);
  const featuredGroup = groups.find((g) => g.priceCents > 0) ?? groups[0];

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-indigo-50 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
              🚀 For AI-curious founders
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Get unstuck.{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Build your startup.
              </span>
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Most founders get stuck — on a new tool, a hire, a fundraise — and never
              ask. Launch Community is where you ask anything and get answers from people
              who&apos;ve done it. Plus mentors, private groups, funding, and events.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/ask" className="btn-primary px-5 py-3 text-base">
                Ask your first question
              </Link>
              <Link href="/mentors" className="btn-ghost px-5 py-3 text-base">
                Find a mentor
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-8 text-sm">
              <Stat n={stats.questions} label="questions" />
              <Stat n={stats.answers} label="answers" />
              <Stat n={stats.advisors} label="mentors & experts" />
              <Stat n={stats.members} label="members" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 sm:grid-cols-3">
          <HowCard
            icon="💬"
            title="Ask anything"
            body="No question is too basic. From 'how do I use Claude Code?' to 'is it too early to raise?'"
          />
          <HowCard
            icon="🧑‍🏫"
            title="Book someone who's done it"
            body="Free intro calls with mentors, or paid sessions with experts. Same booking flow, different price."
          />
          <HowCard
            icon="🔒"
            title="Go deeper in private"
            body="Small industry groups where founders share the things they won't post publicly."
          />
        </div>
      </section>

      {/* Featured + sidebar */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Trending questions</h2>
              <Link href="/questions" className="text-sm font-medium text-indigo-600 hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {featured.map((q) => (
                <QuestionCard key={q.id} q={q} />
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            {nextEvent && (
              <div className="card p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Next event
                </h3>
                <div className="mt-3">
                  <span className="tag-chip bg-indigo-50 text-indigo-700">
                    {nextEvent.type.replace(/_/g, " ")}
                  </span>
                  <h4 className="mt-2 font-semibold text-slate-900">{nextEvent.title}</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatEventDate(nextEvent.startsAt)} · {nextEvent.location}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {nextEvent.goingCount} going · {nextEvent.spotsLeft} spots left
                  </p>
                  <Link href="/events" className="btn-ghost mt-3 w-full">
                    See all events
                  </Link>
                </div>
              </div>
            )}

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Mentors & experts
                </h3>
                <Link href="/mentors" className="text-xs font-medium text-indigo-600 hover:underline">
                  All
                </Link>
              </div>
              <ul className="mt-3 space-y-3">
                {featuredAdvisors.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/mentors/${a.slug}`} className="flex items-center gap-3 rounded-lg p-1 hover:bg-slate-50">
                      <Avatar emoji={a.user.avatar} color={a.user.color} size={36} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {a.user.name}
                        </div>
                        <div className="truncate text-xs text-slate-500">{a.headline}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {featuredGroup && (
              <div className="card p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Private groups
                </h3>
                <Link href={`/groups/${featuredGroup.slug}`} className="mt-3 block">
                  <span className="text-2xl">{featuredGroup.coverEmoji}</span>
                  <h4 className="mt-1 font-semibold text-slate-900">{featuredGroup.title}</h4>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {featuredGroup.description}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-700">
                    {featuredGroup.priceLabel}
                    {featuredGroup.priceCents > 0 && `/${featuredGroup.billingPeriod === "monthly" ? "mo" : "once"}`}
                    {" · "}
                    {featuredGroup.memberCount} members
                  </p>
                </Link>
                <Link href="/groups" className="btn-ghost mt-3 w-full">
                  Browse groups
                </Link>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-slate-900">{n}</div>
      <div className="text-slate-500">{label}</div>
    </div>
  );
}

function HowCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="card p-6">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}
