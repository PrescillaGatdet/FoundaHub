import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuestion } from "@/lib/data/questions";
import { acceptAnswerAction, createAnswerAction, createCommentAction } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { TagChip } from "@/components/TagChip";
import { VoteButton } from "@/components/VoteButton";
import { timeAgo } from "@/lib/format";
import type { AuthorDTO } from "@/lib/data/dto";

export const dynamic = "force-dynamic";

export default async function QuestionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const question = await getQuestion(id);

  if (!question) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/questions" className="text-sm text-indigo-600 hover:underline">
        ← All questions
      </Link>

      <div className="card mt-3 p-6">
        <div className="flex gap-5">
          <div className="shrink-0">
            <VoteButton
              kind="question"
              id={question.id}
              count={question.votes}
              active={question.viewerVoted}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{question.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {question.tags.map((t) => (
                <TagChip key={t.slug} name={t.name} slug={t.slug} color={t.color} />
              ))}
            </div>
            <p className="mt-4 whitespace-pre-wrap text-slate-700">{question.body}</p>
            <Byline author={question.author} suffix={`asked ${timeAgo(question.createdAt)} · ${question.views} views`} />

            <CommentThread
              comments={question.comments}
              threadId={question.id}
              hidden={{ questionId: question.id }}
            />
          </div>
        </div>
      </div>

      <h2 className="mt-8 mb-4 text-lg font-bold text-slate-900">
        {question.answers.length} answer{question.answers.length === 1 ? "" : "s"}
      </h2>

      <div className="space-y-4">
        {question.answers.map((a) => (
          <div
            key={a.id}
            className={`card p-6 ${a.accepted ? "border-emerald-300 bg-emerald-50/40" : ""}`}
          >
            <div className="flex gap-5">
              <div className="flex shrink-0 flex-col items-center gap-2">
                <VoteButton
                  kind="answer"
                  id={a.id}
                  questionId={question.id}
                  count={a.votes}
                  active={a.viewerVoted}
                />
                {/* Only the person who asked sees this, and the action re-checks
                    ownership anyway — the button is a convenience, not the gate. */}
                {question.viewerIsAuthor && !a.accepted && (
                  <form action={acceptAnswerAction}>
                    <input type="hidden" name="answerId" value={a.id} />
                    <button
                      type="submit"
                      title="Mark this as the accepted answer"
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:border-emerald-300 hover:text-emerald-600"
                    >
                      ✓
                    </button>
                  </form>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {a.accepted && (
                  <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    ✓ Accepted answer
                  </div>
                )}
                <p className="whitespace-pre-wrap text-slate-700">{a.body}</p>
                <Byline author={a.author} suffix={timeAgo(a.createdAt)} />

                <CommentThread
                  comments={a.comments}
                  threadId={question.id}
                  hidden={{ answerId: a.id }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-8 p-6">
        <h3 className="text-base font-bold text-slate-900">Your answer</h3>
        <p className="mt-1 text-sm text-slate-500">
          Share what worked for you. Specific beats perfect.
        </p>
        <form action={createAnswerAction} className="mt-4 space-y-4">
          <input type="hidden" name="questionId" value={question.id} />
          <textarea
            name="body"
            required
            rows={5}
            placeholder="Write your answer…"
            className="input resize-y"
          />
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              Post answer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Byline({ author, suffix }: { author: AuthorDTO; suffix: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <Avatar emoji={author.avatar} color={author.color} size={24} />
      <span className="font-medium text-slate-700">{author.name}</span>
      {author.headline && <span>· {author.headline}</span>}
      <span>· {suffix}</span>
    </div>
  );
}

function CommentThread({
  comments,
  threadId,
  hidden,
}: {
  comments: { id: string; body: string; createdAt: Date; author: AuthorDTO }[];
  threadId: string;
  hidden: { questionId?: string; answerId?: string };
}) {
  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      {comments.length > 0 && (
        <ul className="mb-2 space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="text-sm text-slate-600">
              {c.body}{" "}
              <span className="text-xs text-slate-400">
                — {c.author.name}, {timeAgo(c.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <form action={createCommentAction} className="flex gap-2">
        <input type="hidden" name="threadId" value={threadId} />
        {hidden.questionId && <input type="hidden" name="questionId" value={hidden.questionId} />}
        {hidden.answerId && <input type="hidden" name="answerId" value={hidden.answerId} />}
        <input
          name="body"
          required
          placeholder="Add a comment…"
          className="input flex-1 py-1.5 text-sm"
        />
        <button type="submit" className="btn-ghost px-3 py-1.5 text-sm">
          Comment
        </button>
      </form>
    </div>
  );
}
