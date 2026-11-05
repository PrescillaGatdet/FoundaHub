import Link from "next/link";
import { getTags } from "@/lib/data/questions";
import { createQuestionAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function AskPage() {
  const tags = await getTags();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/questions" className="text-sm text-indigo-600 hover:underline">
        ← Back to questions
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-slate-900">Ask the community</h1>
      <p className="mt-1 text-sm text-slate-600">
        Stuck on a tool, a decision, or a next step? Ask it plainly — founders here
        have been where you are.
      </p>

      <form action={createQuestionAction} className="card mt-6 space-y-5 p-6">
        <div>
          <label className="label" htmlFor="title">
            Question
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={160}
            placeholder="e.g. How do I get Claude Code to only edit one file?"
            className="input"
          />
          <p className="mt-1 text-xs text-slate-400">
            Be specific. Imagine you&apos;re asking a knowledgeable friend.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="body">
            Details
          </label>
          <textarea
            id="body"
            name="body"
            required
            rows={6}
            placeholder="What have you tried? What's the context? What would a good answer look like?"
            className="input resize-y"
          />
        </div>

        <div>
          <span className="label">Tags</span>
          <p className="mb-2 text-xs text-slate-400">
            Pick the tools and topics this relates to.
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <label
                key={t.slug}
                className="group cursor-pointer"
              >
                <input
                  type="checkbox"
                  name="tags"
                  value={t.slug}
                  className="peer sr-only"
                />
                <span
                  className="tag-chip border transition-shadow peer-checked:ring-2 peer-checked:ring-indigo-500 peer-checked:ring-offset-1"
                  style={{
                    background: `${t.color}14`,
                    color: t.color,
                    borderColor: `${t.color}33`,
                  }}
                >
                  {t.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Link href="/questions" className="btn-ghost">
            Cancel
          </Link>
          <button type="submit" className="btn-primary">
            Post question
          </button>
        </div>
      </form>
    </div>
  );
}
