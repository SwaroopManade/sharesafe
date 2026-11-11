"use client";

import { useEditor } from "@/store/editor-store";

export function HeaderSessionBadge() {
  const { state } = useEditor();

  if (!state.session) return null;

  const regionCount = state.history.present.length;

  return (
    <span
      title={`Active image in memory (${regionCount} redaction region${regionCount === 1 ? "" : "s"})`}
      className="inline-flex items-center gap-1 rounded-full border border-[var(--green-tint-border)] bg-[var(--green-tint-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--green-tint-text)]"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-green)]" aria-hidden="true" />
      {regionCount > 0 ? regionCount : "Open"}
    </span>
  );
}
