import "server-only";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireUser, Forbidden } from "./auth";
import { toAuthor, toTag, formatPrice, type AuthorDTO, type TagDTO } from "./dto";

// ---------------------------------------------------------------------------
// Private groups — the one place in this codebase where a missing check is a
// paid-content leak rather than a cosmetic bug.
//
// Public: title, description, owner, price, member count.
// Gated:  every GroupPost and GroupComment.
//
// Membership is re-verified inside every read and every mutation below. A
// layout-level check would only decide which UI renders; it does nothing for a
// server action or a route handler, both of which are independently reachable.
// ---------------------------------------------------------------------------

export type GroupSummaryDTO = {
  slug: string;
  title: string;
  description: string;
  industry: string;
  coverEmoji: string;
  color: string;
  owner: AuthorDTO;
  priceCents: number;
  priceLabel: string;
  billingPeriod: string;
  memberCount: number;
  memberLimit: number;
  isFull: boolean;
  tags: TagDTO[];
  viewerRole: "owner" | "moderator" | "member" | null;
  viewerIsMember: boolean;
};

export type GroupPostDTO = {
  id: string;
  title: string | null;
  body: string;
  isPinned: boolean;
  createdAt: Date;
  author: AuthorDTO;
  viewerCanDelete: boolean;
  comments: { id: string; body: string; createdAt: Date; author: AuthorDTO }[];
};

const summarySelect = {
  slug: true,
  title: true,
  description: true,
  industry: true,
  coverEmoji: true,
  color: true,
  priceCents: true,
  billingPeriod: true,
  memberLimit: true,
  owner: { select: { slug: true, name: true, headline: true, avatar: true, color: true } },
  tags: { select: { tag: { select: { name: true, slug: true, kind: true, color: true } } } },
  _count: { select: { memberships: { where: { status: "active" } } } },
} as const;

type SummaryRow = {
  slug: string;
  title: string;
  description: string;
  industry: string;
  coverEmoji: string;
  color: string;
  priceCents: number;
  billingPeriod: string;
  memberLimit: number;
  owner: { slug: string; name: string; headline: string | null; avatar: string; color: string };
  tags: { tag: { name: string; slug: string; kind: string; color: string } }[];
  _count: { memberships: number };
};

function toSummary(
  g: SummaryRow,
  viewerRole: "owner" | "moderator" | "member" | null,
): GroupSummaryDTO {
  const memberCount = g._count.memberships;
  return {
    slug: g.slug,
    title: g.title,
    description: g.description,
    industry: g.industry,
    coverEmoji: g.coverEmoji,
    color: g.color,
    owner: toAuthor(g.owner),
    priceCents: g.priceCents,
    priceLabel: formatPrice(g.priceCents),
    billingPeriod: g.billingPeriod,
    memberCount,
    memberLimit: g.memberLimit,
    isFull: memberCount >= g.memberLimit,
    tags: g.tags.map((t) => toTag(t.tag)),
    viewerRole,
    viewerIsMember: viewerRole !== null,
  };
}

/**
 * The caller's active role in a set of groups, by slug. Returns an empty map
 * for signed-out visitors, which is what makes every gate below fail closed.
 */
async function viewerRoles(
  slugs: string[],
): Promise<Map<string, "owner" | "moderator" | "member">> {
  const viewer = await getCurrentUser();
  if (!viewer || slugs.length === 0) return new Map();

  const rows = await prisma.groupMembership.findMany({
    where: { userId: viewer.id, status: "active", group: { slug: { in: slugs } } },
    select: { role: true, group: { select: { slug: true } } },
  });

  return new Map(rows.map((r) => [r.group.slug, r.role as "owner" | "moderator" | "member"]));
}

/** The public directory. Unlisted and suspended groups never appear here. */
export async function getGroups(): Promise<GroupSummaryDTO[]> {
  const rows = await prisma.group.findMany({
    where: { visibility: "listed", status: "active" },
    orderBy: [{ priceCents: "asc" }, { createdAt: "desc" }],
    select: summarySelect,
  });

  const roles = await viewerRoles(rows.map((g) => g.slug));
  return rows.map((g) => toSummary(g, roles.get(g.slug) ?? null));
}

export async function getMyGroups(): Promise<GroupSummaryDTO[]> {
  const user = await requireUser();

  const rows = await prisma.group.findMany({
    where: { memberships: { some: { userId: user.id, status: "active" } } },
    orderBy: { createdAt: "desc" },
    select: summarySelect,
  });

  const roles = await viewerRoles(rows.map((g) => g.slug));
  return rows.map((g) => toSummary(g, roles.get(g.slug) ?? null));
}

/**
 * Public group metadata. Safe for anyone — this is the sales page. It carries
 * `viewerIsMember` so the page knows whether to link to the feed, but it never
 * carries a single post.
 */
export async function getGroupOverview(slug: string): Promise<GroupSummaryDTO | null> {
  const group = await prisma.group.findFirst({
    where: { slug, status: { in: ["active", "pending_review"] } },
    select: summarySelect,
  });
  if (!group) return null;

  const roles = await viewerRoles([slug]);
  return toSummary(group, roles.get(slug) ?? null);
}

/**
 * The gated feed. Throws `Forbidden` for non-members — including the owner of a
 * different group, a signed-out visitor, and a member whose subscription has
 * lapsed to `past_due`.
 */
export async function getGroupFeed(slug: string): Promise<GroupPostDTO[]> {
  const membership = await requireMembership(slug);

  const posts = await prisma.groupPost.findMany({
    where: { group: { slug } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      body: true,
      isPinned: true,
      createdAt: true,
      authorId: true,
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
  });

  const canModerate = membership.role === "owner" || membership.role === "moderator";

  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    isPinned: p.isPinned,
    createdAt: p.createdAt,
    author: toAuthor(p.author),
    viewerCanDelete: canModerate || p.authorId === membership.userId,
    comments: p.comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      author: toAuthor(c.author),
    })),
  }));
}

/**
 * The single gate. Every gated read and every mutation goes through this, so
 * there is exactly one definition of "is a member" to get right.
 */
async function requireMembership(slug: string): Promise<{
  groupId: string;
  userId: string;
  role: "owner" | "moderator" | "member";
}> {
  const user = await requireUser();

  const membership = await prisma.groupMembership.findFirst({
    where: { group: { slug }, userId: user.id, status: "active" },
    select: { role: true, groupId: true },
  });
  if (!membership) throw new Forbidden("You need to join this group to see what's inside.");

  return {
    groupId: membership.groupId,
    userId: user.id,
    role: membership.role as "owner" | "moderator" | "member",
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Joins a group. Free groups join immediately; paid ones are refused here on
 * purpose — granting access to paid content before a charge exists is the
 * failure mode this whole module is built to avoid. `subscriptionRef` on the
 * membership is where billing attaches once Stripe Connect is decided (§18.1).
 */
export async function joinGroup(slug: string): Promise<void> {
  const user = await requireUser();

  const group = await prisma.group.findUnique({
    where: { slug },
    select: {
      id: true,
      status: true,
      priceCents: true,
      memberLimit: true,
      _count: { select: { memberships: { where: { status: "active" } } } },
    },
  });
  if (!group) throw new Error("That group no longer exists.");
  if (group.status !== "active") throw new Forbidden("That group is not open right now.");
  if (group.priceCents > 0) {
    throw new Forbidden("Paid groups are not open yet — billing is still being built.");
  }
  if (group._count.memberships >= group.memberLimit) {
    throw new Forbidden("This group is full.");
  }

  await prisma.groupMembership.upsert({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
    create: { groupId: group.id, userId: user.id, role: "member", status: "active" },
    update: { status: "active" },
  });

  await syncMemberCount(group.id);
}

export async function leaveGroup(slug: string): Promise<void> {
  const membership = await requireMembership(slug);
  if (membership.role === "owner") {
    throw new Forbidden("Transfer ownership before leaving a group you own.");
  }

  await prisma.groupMembership.updateMany({
    where: { groupId: membership.groupId, userId: membership.userId },
    data: { status: "cancelled" },
  });

  await syncMemberCount(membership.groupId);
}

export async function createGroupPost(input: {
  groupSlug: string;
  title?: string;
  body: string;
}): Promise<void> {
  // Membership, not just authentication — a signed-in non-member posting into a
  // paid group is exactly the negative case worth testing.
  const membership = await requireMembership(input.groupSlug);

  const body = input.body.trim();
  if (!body) throw new Error("A post needs a body.");

  await prisma.groupPost.create({
    data: {
      groupId: membership.groupId,
      authorId: membership.userId,
      title: input.title?.trim() || null,
      body,
    },
  });
}

export async function createGroupComment(input: {
  groupSlug: string;
  postId: string;
  body: string;
}): Promise<void> {
  const membership = await requireMembership(input.groupSlug);

  const body = input.body.trim();
  if (!body) throw new Error("A comment cannot be empty.");

  // The post must belong to the group the caller is a member of — otherwise a
  // member of any group could comment on any post by passing its id.
  const post = await prisma.groupPost.findUnique({
    where: { id: input.postId },
    select: { id: true, groupId: true },
  });
  if (!post || post.groupId !== membership.groupId) {
    throw new Forbidden("That post is not in this group.");
  }

  await prisma.groupComment.create({
    data: { postId: post.id, authorId: membership.userId, body },
  });
}

export async function deleteGroupPost(input: {
  groupSlug: string;
  postId: string;
}): Promise<void> {
  const membership = await requireMembership(input.groupSlug);

  const post = await prisma.groupPost.findUnique({
    where: { id: input.postId },
    select: { id: true, groupId: true, authorId: true },
  });
  if (!post || post.groupId !== membership.groupId) {
    throw new Forbidden("That post is not in this group.");
  }

  const canDelete =
    post.authorId === membership.userId ||
    membership.role === "owner" ||
    membership.role === "moderator";
  if (!canDelete) throw new Forbidden("You can only delete your own posts.");

  await prisma.groupPost.delete({ where: { id: post.id } });
}

/** `memberCount` is a denormalized display field; the rows are the truth. */
async function syncMemberCount(groupId: string): Promise<void> {
  const count = await prisma.groupMembership.count({
    where: { groupId, status: "active" },
  });
  await prisma.group.update({ where: { id: groupId }, data: { memberCount: count } });
}
