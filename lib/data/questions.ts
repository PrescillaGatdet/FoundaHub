import "server-only";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireUser, Forbidden } from "./auth";
import { toAuthor, toTag, type AuthorDTO, type TagDTO } from "./dto";

export type QuestionSummaryDTO = {
  id: string;
  title: string;
  body: string;
  votes: number;
  views: number;
  status: string;
  answerCount: number;
  createdAt: Date;
  author: AuthorDTO;
  tags: TagDTO[];
};

export type AnswerDTO = {
  id: string;
  body: string;
  votes: number;
  accepted: boolean;
  createdAt: Date;
  author: AuthorDTO;
  viewerVoted: boolean;
  comments: { id: string; body: string; createdAt: Date; author: AuthorDTO }[];
};

export type QuestionDetailDTO = QuestionSummaryDTO & {
  acceptedAnswerId: string | null;
  viewerVoted: boolean;
  viewerIsAuthor: boolean;
  answers: AnswerDTO[];
  comments: { id: string; body: string; createdAt: Date; author: AuthorDTO }[];
};

const summarySelect = {
  id: true,
  title: true,
  body: true,
  votes: true,
  views: true,
  status: true,
  createdAt: true,
  author: { select: { slug: true, name: true, headline: true, avatar: true, color: true } },
  tags: { select: { tag: { select: { name: true, slug: true, kind: true, color: true } } } },
  _count: { select: { answers: true } },
} as const;

type SummaryRow = {
  id: string;
  title: string;
  body: string;
  votes: number;
  views: number;
  status: string;
  createdAt: Date;
  author: { slug: string; name: string; headline: string | null; avatar: string; color: string };
  tags: { tag: { name: string; slug: string; kind: string; color: string } }[];
  _count: { answers: number };
};

const toSummary = (q: SummaryRow): QuestionSummaryDTO => ({
  id: q.id,
  title: q.title,
  body: q.body,
  votes: q.votes,
  views: q.views,
  status: q.status,
  answerCount: q._count.answers,
  createdAt: q.createdAt,
  author: toAuthor(q.author),
  tags: q.tags.map((t) => toTag(t.tag)),
});

export async function getQuestionFeed(options?: {
  tagSlug?: string;
  sort?: "newest" | "votes";
  take?: number;
}): Promise<QuestionSummaryDTO[]> {
  const rows = await prisma.question.findMany({
    where: options?.tagSlug ? { tags: { some: { tag: { slug: options.tagSlug } } } } : undefined,
    orderBy: options?.sort === "votes" ? { votes: "desc" } : { createdAt: "desc" },
    take: options?.take,
    select: summarySelect,
  });
  return rows.map(toSummary);
}

export async function getQuestion(id: string): Promise<QuestionDetailDTO | null> {
  const viewer = await getCurrentUser();

  const q = await prisma.question.findUnique({
    where: { id },
    select: {
      ...summarySelect,
      acceptedAnswerId: true,
      authorId: true,
      comments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { slug: true, name: true, headline: true, avatar: true, color: true } },
        },
      },
      answers: {
        orderBy: [{ accepted: "desc" }, { votes: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          body: true,
          votes: true,
          accepted: true,
          createdAt: true,
          author: { select: { slug: true, name: true, headline: true, avatar: true, color: true } },
          comments: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              body: true,
              createdAt: true,
              author: { select: { slug: true, name: true, headline: true, avatar: true, color: true } },
            },
          },
        },
      },
    },
  });

  if (!q) return null;

  // One query for every vote this viewer has on the thread, rather than one per row.
  const votes = viewer
    ? await prisma.vote.findMany({
        where: {
          userId: viewer.id,
          OR: [{ questionId: q.id }, { answerId: { in: q.answers.map((a) => a.id) } }],
        },
        select: { questionId: true, answerId: true },
      })
    : [];
  const votedAnswers = new Set(votes.map((v) => v.answerId).filter(Boolean));

  return {
    ...toSummary(q),
    acceptedAnswerId: q.acceptedAnswerId,
    viewerVoted: votes.some((v) => v.questionId === q.id),
    viewerIsAuthor: viewer?.id === q.authorId,
    comments: q.comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      author: toAuthor(c.author),
    })),
    answers: q.answers.map((a) => ({
      id: a.id,
      body: a.body,
      votes: a.votes,
      accepted: a.accepted,
      createdAt: a.createdAt,
      author: toAuthor(a.author),
      viewerVoted: votedAnswers.has(a.id),
      comments: a.comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        author: toAuthor(c.author),
      })),
    })),
  };
}

export async function getTags(): Promise<TagDTO[]> {
  const tags = await prisma.tag.findMany({
    orderBy: [{ kind: "asc" }, { name: "asc" }],
    select: { name: true, slug: true, kind: true, color: true },
  });
  return tags.map(toTag);
}

export async function getTag(slug: string): Promise<TagDTO | null> {
  const tag = await prisma.tag.findUnique({
    where: { slug },
    select: { name: true, slug: true, kind: true, color: true },
  });
  return tag ? toTag(tag) : null;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createQuestion(input: {
  title: string;
  body: string;
  tagSlugs: string[];
}): Promise<{ id: string }> {
  const user = await requireUser();

  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) throw new Error("Title and details are required.");
  if (title.length > 160) throw new Error("Keep the title under 160 characters.");

  // Resolve slugs to ids ourselves rather than trusting ids off the form.
  const tags = input.tagSlugs.length
    ? await prisma.tag.findMany({ where: { slug: { in: input.tagSlugs } }, select: { id: true } })
    : [];

  const question = await prisma.question.create({
    data: {
      title,
      body,
      authorId: user.id,
      tags: { create: tags.map((t) => ({ tagId: t.id })) },
    },
    select: { id: true },
  });

  return question;
}

export async function createAnswer(input: { questionId: string; body: string }): Promise<void> {
  const user = await requireUser();

  const body = input.body.trim();
  if (!body) throw new Error("An answer cannot be empty.");

  // Confirm the question exists before writing a row that points at nothing.
  const question = await prisma.question.findUnique({
    where: { id: input.questionId },
    select: { id: true, status: true },
  });
  if (!question) throw new Error("That question no longer exists.");
  if (question.status === "closed") throw new Forbidden("This question is closed.");

  await prisma.answer.create({
    data: { body, questionId: question.id, authorId: user.id },
  });
}

/** Toggles the viewer's vote. One row per (user, target) makes this idempotent. */
export async function toggleQuestionVote(questionId: string): Promise<void> {
  const user = await requireUser();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.vote.findUnique({
      where: { userId_questionId: { userId: user.id, questionId } },
    });
    if (existing) {
      await tx.vote.delete({ where: { id: existing.id } });
      await tx.question.update({ where: { id: questionId }, data: { votes: { decrement: 1 } } });
    } else {
      await tx.vote.create({ data: { userId: user.id, questionId } });
      await tx.question.update({ where: { id: questionId }, data: { votes: { increment: 1 } } });
    }
  });
}

export async function toggleAnswerVote(answerId: string): Promise<void> {
  const user = await requireUser();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.vote.findUnique({
      where: { userId_answerId: { userId: user.id, answerId } },
    });
    if (existing) {
      await tx.vote.delete({ where: { id: existing.id } });
      await tx.answer.update({ where: { id: answerId }, data: { votes: { decrement: 1 } } });
    } else {
      await tx.vote.create({ data: { userId: user.id, answerId } });
      await tx.answer.update({ where: { id: answerId }, data: { votes: { increment: 1 } } });
    }
  });
}

/**
 * Accepting an answer is author-only. The ownership check lives here, not in
 * the page that renders the button — the action is reachable on its own.
 */
export async function acceptAnswer(answerId: string): Promise<{ questionId: string }> {
  const user = await requireUser();

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: { id: true, questionId: true, question: { select: { authorId: true } } },
  });
  if (!answer) throw new Error("That answer no longer exists.");
  if (answer.question.authorId !== user.id) {
    throw new Forbidden("Only the person who asked can accept an answer.");
  }

  await prisma.$transaction(async (tx) => {
    // Exactly one accepted answer per question.
    await tx.answer.updateMany({
      where: { questionId: answer.questionId, accepted: true },
      data: { accepted: false },
    });
    await tx.answer.update({ where: { id: answer.id }, data: { accepted: true } });
    await tx.question.update({
      where: { id: answer.questionId },
      data: { acceptedAnswerId: answer.id, status: "answered" },
    });
  });

  return { questionId: answer.questionId };
}

export async function createComment(input: {
  body: string;
  questionId?: string;
  answerId?: string;
}): Promise<void> {
  const user = await requireUser();

  const body = input.body.trim();
  if (!body) throw new Error("A comment cannot be empty.");
  if (!input.questionId && !input.answerId) throw new Error("Nothing to comment on.");

  await prisma.comment.create({
    data: {
      body,
      authorId: user.id,
      questionId: input.questionId ?? null,
      answerId: input.answerId ?? null,
    },
  });
}
