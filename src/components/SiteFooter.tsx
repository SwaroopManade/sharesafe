import Link from "next/link";
import { APP_CONFIG } from "@/config/app";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-page)] py-6 text-xs text-[var(--text-muted)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="leading-relaxed">
          <strong className="font-medium text-[var(--text-secondary)]">{APP_CONFIG.name}</strong> —
          Images are processed strictly in your browser memory and never uploaded. Unexported edits
          are discarded on refresh.
        </p>
        <div className="flex shrink-0 items-center gap-4">
          <Link
            href="/privacy"
            className="text-[var(--text-secondary)] underline-offset-4 transition-colors duration-150 hover:text-[var(--text-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
          >
            Privacy &amp; Metadata Caveats
          </Link>
        </div>
      </div>
    </footer>
  );
}
