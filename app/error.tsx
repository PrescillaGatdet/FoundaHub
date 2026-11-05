"use client";

import Link from "next/link";

// The DAL throws `Unauthorized` and `Forbidden` rather than returning empty
// data, so a blocked read lands here instead of silently rendering nothing.
// In production React replaces the message with a generic one, which is the
// behaviour we want — the specific reason stays on the server.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="text-4xl">🚧</div>
      <h1 className="mt-4 text-xl font-bold text-slate-900">That didn&apos;t work</h1>
      <p className="mt-2 text-sm text-slate-600">
        {error.message || "Something went wrong on our end."}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-ghost">
          Go home
        </Link>
      </div>
    </div>
  );
}
