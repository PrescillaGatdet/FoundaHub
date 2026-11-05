import { voteQuestionAction, voteAnswerAction } from "@/app/actions";

export function VoteButton({
  kind,
  id,
  questionId,
  count,
  active,
}: {
  kind: "question" | "answer";
  id: string;
  questionId?: string;
  count: number;
  active: boolean;
}) {
  const action = kind === "question" ? voteQuestionAction : voteAnswerAction;
  return (
    <form action={action}>
      {kind === "question" ? (
        <input type="hidden" name="questionId" value={id} />
      ) : (
        <>
          <input type="hidden" name="answerId" value={id} />
          {questionId && <input type="hidden" name="questionId" value={questionId} />}
        </>
      )}
      <button
        type="submit"
        title={active ? "Remove your upvote" : "Upvote"}
        className={`flex w-12 flex-col items-center rounded-xl border px-2 py-1.5 text-sm font-semibold transition-colors ${
          active
            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
            : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
        }`}
      >
        <span className="text-base leading-none">▲</span>
        <span>{count}</span>
      </button>
    </form>
  );
}
