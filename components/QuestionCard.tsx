import Link from "next/link";
import { Avatar } from "./Avatar";
import { TagChip } from "./TagChip";
import { timeAgo } from "@/lib/format";
import type { QuestionSummaryDTO } from "@/lib/data/questions";

export function QuestionCard({ q }: { q: QuestionSummaryDTO }) {
  return (
    <Link href={`/questions/${q.id}`} className="block">
      <article className="card p-5 transition-shadow hover:shadow-md">
        <div className="flex gap-5">
          <div className="hidden shrink-0 flex-col items-center gap-3 text-center text-sm text-slate-500 sm:flex">
            <div>
              <div className="text-lg font-bold text-slate-900">{q.votes}</div>
              <div className="text-xs">votes</div>
            </div>
            <div>
              <div
                className={`text-lg font-bold ${
                  q.answerCount > 0 ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {q.answerCount}
              </div>
              <div className="text-xs">answers</div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <h3 className="text-base font-semibold text-slate-900">{q.title}</h3>
              {q.status === "answered" && (
                <span className="mt-0.5 shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  ✓ Answered
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{q.body}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {q.tags.map((t) => (
                <TagChip key={t.slug} name={t.name} color={t.color} />
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Avatar emoji={q.author.avatar} color={q.author.color} size={22} />
              <span className="font-medium text-slate-700">{q.author.name}</span>
              <span>·</span>
              <span>{timeAgo(q.createdAt)}</span>
              <span className="sm:hidden">
                · {q.answerCount} answers · {q.votes} votes
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
