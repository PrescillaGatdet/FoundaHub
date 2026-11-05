import Link from "next/link";
import { QuestionCard } from "@/components/QuestionCard";
import { TagChip } from "@/components/TagChip";
import { getQuestionFeed, getTags, getTag } from "@/lib/data/questions";

export const dynamic = "force-dynamic";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; sort?: string }>;
}) {
  const { tag, sort } = await searchParams;
  const sortMode = sort === "votes" ? "votes" : "newest";

  const [tags, activeTag, questions] = await Promise.all([
    getTags(),
    tag ? getTag(tag) : Promise.resolve(null),
    getQuestionFeed({ tagSlug: tag, sort: sortMode }),
  ]);

  const byKind = (kind: string) => tags.filter((t) => t.kind === kind);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {activeTag ? `${activeTag.name} questions` : "All questions"}
              </h1>
              <p className="text-sm text-slate-500">
                {questions.length} question{questions.length === 1 ? "" : "s"} · no
                question is too basic here
              </p>
            </div>
            <div className="flex items-center gap-2">
              <SortLink label="Newest" value={undefined} tag={tag} current={sort} />
              <SortLink label="Top voted" value="votes" tag={tag} current={sort} />
              <Link href="/ask" className="btn-primary">
                Ask
              </Link>
            </div>
          </div>

          {activeTag && (
            <div className="mb-4">
              <Link href="/questions" className="text-sm text-indigo-600 hover:underline">
                ← Clear filter
              </Link>
            </div>
          )}

          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="card p-10 text-center text-slate-500">
                No questions yet.{" "}
                <Link href="/ask" className="text-indigo-600">
                  Be the first to ask →
                </Link>
              </div>
            ) : (
              questions.map((q) => <QuestionCard key={q.id} q={q} />)
            )}
          </div>
        </div>

        <aside className="space-y-6">
          {[
            { heading: "Tools", kind: "tool" },
            { heading: "Topics", kind: "topic" },
            { heading: "Industries", kind: "industry" },
          ].map(({ heading, kind }) => {
            const group = byKind(kind);
            if (group.length === 0) return null;
            return (
              <div key={kind} className="card p-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  {heading}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {group.map((t) => (
                    <TagChip
                      key={t.slug}
                      name={t.name}
                      slug={t.slug}
                      color={t.color}
                      active={t.slug === tag}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </aside>
      </div>
    </div>
  );
}

function SortLink({
  label,
  value,
  tag,
  current,
}: {
  label: string;
  value?: string;
  tag?: string;
  current?: string;
}) {
  const params = new URLSearchParams();
  if (tag) params.set("tag", tag);
  if (value) params.set("sort", value);
  const href = `/questions${params.toString() ? `?${params}` : ""}`;
  const active = current === value || (!current && !value);
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium ${
        active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );
}
