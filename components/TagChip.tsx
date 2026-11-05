import Link from "next/link";

export function TagChip({
  name,
  slug,
  color,
  active,
}: {
  name: string;
  slug?: string;
  color: string;
  active?: boolean;
}) {
  const style = active
    ? { background: color, color: "#fff" }
    : { background: `${color}14`, color };

  const content = (
    <span className="tag-chip" style={style}>
      {name}
    </span>
  );

  if (!slug) return content;
  return (
    <Link href={`/questions?tag=${slug}`} className="hover:opacity-80 transition-opacity">
      {content}
    </Link>
  );
}
