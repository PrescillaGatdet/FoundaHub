import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Identity
//
// PLACEHOLDER SESSION. A `uid` cookie names the current member and we fall back
// to the seeded demo account. This is the one piece of the foundation that is
// still demo-grade, and it is deliberately the only place that knows it: every
// other module in the DAL asks `getCurrentUser()` / `requireUser()` and gets a
// `SessionUser` back. Swapping in real email + OAuth auth means rewriting the
// body of these two functions and nothing else.
// ---------------------------------------------------------------------------

export const DEMO_USER_ID = "demo-user";

/** The only user shape that may cross into a client component. */
export type SessionUser = {
  id: string;
  slug: string;
  name: string;
  headline: string | null;
  avatar: string;
  color: string;
  isStaff: boolean;
  plan: string;
};

const toSessionUser = (u: {
  id: string;
  slug: string;
  name: string;
  headline: string | null;
  avatar: string;
  color: string;
  isStaff: boolean;
  plan: string;
}): SessionUser => ({
  id: u.id,
  slug: u.slug,
  name: u.name,
  headline: u.headline,
  avatar: u.avatar,
  color: u.color,
  isStaff: u.isStaff,
  plan: u.plan,
});

/**
 * Resolves the caller once per request. `cache()` means a page, its layout, and
 * any DAL function it calls all share a single lookup — and none of them have
 * to pass the user around, which is how it leaks into client components.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const uid = store.get("uid")?.value;

  const user = uid
    ? await prisma.user.findUnique({ where: { id: uid } })
    : await prisma.user.findUnique({ where: { id: DEMO_USER_ID } });

  return user ? toSessionUser(user) : null;
});

/** For anything that cannot render without a caller. Throws, never returns null. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  // With real auth this becomes `redirect('/login')`.
  if (!user) throw new Unauthorized();
  return user;
}

export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isStaff) throw new Forbidden("Staff only.");
  return user;
}

// ---------------------------------------------------------------------------
// Authorization failures
//
// Thrown by the DAL, never by a page. Distinct classes so a route can tell
// "log in" apart from "you are logged in and still cannot see this".
// ---------------------------------------------------------------------------

export class Unauthorized extends Error {
  constructor(message = "You must be signed in.") {
    super(message);
    this.name = "Unauthorized";
  }
}

export class Forbidden extends Error {
  constructor(message = "You do not have access to this.") {
    super(message);
    this.name = "Forbidden";
  }
}
