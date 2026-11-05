import "server-only";

import { prisma } from "@/lib/prisma";

export type PlatformStats = {
  questions: number;
  answers: number;
  advisors: number;
  members: number;
};

/** Public counts for the landing page. Nothing here is user-specific. */
export async function getPlatformStats(): Promise<PlatformStats> {
  const [questions, answers, advisors, members] = await Promise.all([
    prisma.question.count(),
    prisma.answer.count(),
    prisma.advisorProfile.count(),
    prisma.user.count(),
  ]);

  return { questions, answers, advisors, members };
}
