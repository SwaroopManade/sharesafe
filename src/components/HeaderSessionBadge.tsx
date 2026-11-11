"use client";

import { useEditor } from "@/store/editor-store";

export function HeaderSessionBadge() {
  const { state } = useEditor();

  if (!state.session) return null;

  const regionCount = state.history.present.length;

  return (
    <span
      title={`Active image in memory (${regionCount} redaction region${regionCount === 1 ? "" : "s"})`}
      className="inline-flex items-center gap-1 rounded-full border border-[#166534] bg-[#052e16] px-1.5 py-0.5 text-[10px] font-semibold text-[#4ade80]"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" aria-hidden="true" />
      {regionCount > 0 ? regionCount : "Open"}
    </span>
  );
}

