export function Avatar({
  emoji,
  color,
  size = 40,
}: {
  emoji: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `${color}1a`,
        fontSize: size * 0.5,
      }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}
