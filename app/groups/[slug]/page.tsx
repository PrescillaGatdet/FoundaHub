import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { getGroupOverview, getGroupFeed } from "@/lib/data/groups";
import {
  joinGroupAction,
  leaveGroupAction,
  createGroupPostAction,
  createGroupCommentAction,
  deleteGroupPostAction,
} from "@/app/actions";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Two calls, deliberately. The overview is public; the feed is not. Fetching
  // the feed only for members is a rendering decision — `getGroupFeed` re-checks
  // membership itself, because this page is not the only way to reach it.
  const group = await getGroupOverview(slug);
  if (!group) notFound();

  const posts = group.viewerIsMember ? await getGroupFeed(slug) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/groups" className="text-sm text-indigo-600 hover:underline">
        ← All groups
      </Link>

      {/* Public header — this much is visible to anyone. */}
      <div className="card mt-3 p-6">
        <div className="flex flex-wrap items-start gap-4">
          <span
            className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-3xl"
            style={{ background: `${group.color}14` }}
          >
            {group.coverEmoji}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{group.title}</h1>
              <span className="tag-chip bg-slate-100 text-slate-600">{group.industry}</span>
            </div>
            <p className="mt-2 text-slate-600">{group.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <Avatar emoji={group.owner.avatar} color={group.owner.color} size={24} />
                Run by <span className="font-medium text-slate-700">{group.owner.name}</span>
              </span>
              <span>·</span>
              <span>
                {group.memberCount}/{group.memberLimit} members
              </span>
              <span>·</span>
              <span className="font-semibold text-slate-900">
                {group.priceLabel}
                {group.priceCents > 0 && `/${group.billingPeriod === "monthly" ? "mo" : "once"}`}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {group.viewerIsMember ? (
              group.viewerRole === "owner" ? (
                <span className="tag-chip bg-emerald-50 text-emerald-700">You own this group</span>
              ) : (
                <form action={leaveGroupAction}>
                  <input type="hidden" name="groupSlug" value={group.slug} />
                  <button type="submit" className="btn-ghost text-sm">
                    Leave group
                  </button>
                </form>
              )
            ) : group.priceCents > 0 ? (
              <div className="text-right">
                <button type="button" disabled className="btn-primary cursor-not-allowed opacity-50">
                  Join for {group.priceLabel}/mo
                </button>
                <p className="mt-1 max-w-[14rem] text-xs text-slate-400">
                  Paid groups open once billing ships.
                </p>
              </div>
            ) : group.isFull ? (
              <span className="tag-chip bg-slate-100 text-slate-500">Group is full</span>
            ) : (
              <form action={joinGroupAction}>
                <input type="hidden" name="groupSlug" value={group.slug} />
                <button type="submit" className="btn-primary">
                  Join — free
                </button>
              </form>
            )}
          </div>
        </div>

        {group.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">
            {group.tags.map((t) => (
              <span
                key={t.slug}
                className="rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ background: `${t.color}14`, color: t.color }}
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Everything below here is members-only. */}
      {!group.viewerIsMember ? (
        <div className="card mt-6 p-10 text-center">
          <div className="text-3xl">🔒</div>
          <h2 className="mt-3 font-semibold text-slate-900">Posts are members-only</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            {group.memberCount} founders are posting inside. Join to read the discussion and
            add your own.
          </p>
        </div>
      ) : (
        <>
          <div className="card mt-6 p-6">
            <h2 className="text-base font-bold text-slate-900">Post to the group</h2>
            <form action={createGroupPostAction} className="mt-3 space-y-3">
              <input type="hidden" name="groupSlug" value={group.slug} />
              <input
                name="title"
                maxLength={160}
                placeholder="Title (optional)"
                className="input"
              />
              <textarea
                name="body"
                required
                rows={4}
                placeholder="What's on your mind? This stays inside the group."
                className="input resize-y"
              />
              <div className="flex justify-end">
                <button type="submit" className="btn-primary">
                  Post
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 space-y-4">
            {posts.length === 0 ? (
              <div className="card p-10 text-center text-slate-500">
                Nothing posted yet. Start the first thread.
              </div>
            ) : (
              posts.map((p) => (
                <article key={p.id} className="card p-6">
                  <div className="flex items-start gap-3">
                    <Avatar emoji={p.author.avatar} color={p.author.color} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {p.author.name}
                        </span>
                        <span className="text-xs text-slate-400">{timeAgo(p.createdAt)}</span>
                        {p.isPinned && (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                            Pinned
                          </span>
                        )}
                      </div>
                      {p.title && (
                        <h3 className="mt-1 font-semibold text-slate-900">{p.title}</h3>
                      )}
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{p.body}</p>
                    </div>

                    {p.viewerCanDelete && (
                      <form action={deleteGroupPostAction} className="shrink-0">
                        <input type="hidden" name="groupSlug" value={group.slug} />
                        <input type="hidden" name="postId" value={p.id} />
                        <button
                          type="submit"
                          title="Delete this post"
                          className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-3">
                    {p.comments.length > 0 && (
                      <ul className="mb-3 space-y-2">
                        {p.comments.map((c) => (
                          <li key={c.id} className="flex gap-2 text-sm text-slate-600">
                            <Avatar emoji={c.author.avatar} color={c.author.color} size={20} />
                            <span>
                              {c.body}{" "}
                              <span className="text-xs text-slate-400">
                                — {c.author.name}, {timeAgo(c.createdAt)}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <form action={createGroupCommentAction} className="flex gap-2">
                      <input type="hidden" name="groupSlug" value={group.slug} />
                      <input type="hidden" name="postId" value={p.id} />
                      <input
                        name="body"
                        required
                        placeholder="Reply…"
                        className="input flex-1 py-1.5 text-sm"
                      />
                      <button type="submit" className="btn-ghost px-3 py-1.5 text-sm">
                        Reply
                      </button>
                    </form>
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
