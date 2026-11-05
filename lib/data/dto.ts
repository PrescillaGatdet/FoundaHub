import "server-only";

// Shared shapes returned by the DAL. Everything a page or component receives is
// one of these — never a Prisma row. Keeping them in one file makes it obvious
// what the client is allowed to see.

export type AuthorDTO = {
  slug: string;
  name: string;
  headline: string | null;
  avatar: string;
  color: string;
};

export type TagDTO = {
  name: string;
  slug: string;
  kind: string;
  color: string;
};

export const toAuthor = (u: {
  slug: string;
  name: string;
  headline: string | null;
  avatar: string;
  color: string;
}): AuthorDTO => ({
  slug: u.slug,
  name: u.name,
  headline: u.headline,
  avatar: u.avatar,
  color: u.color,
});

export const toTag = (t: {
  name: string;
  slug: string;
  kind: string;
  color: string;
}): TagDTO => ({ name: t.name, slug: t.slug, kind: t.kind, color: t.color });

/** Money is stored in cents everywhere. Format it in exactly one place. */
export function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  if (cents % 100 === 0) return `$${(cents / 100).toLocaleString("en-US")}`;
  return `$${(cents / 100).toFixed(2)}`;
}
