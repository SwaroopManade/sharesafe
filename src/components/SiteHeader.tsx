import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { HeaderSessionBadge } from "@/components/HeaderSessionBadge";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { APP_CONFIG } from "@/config/app";

interface SiteHeaderProps {
  activePath?: "/" | "/privacy";
}

export function SiteHeader({ activePath = "/" }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--header-bg)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
        >
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--green-tint-border)] bg-[var(--green-tint-bg)] text-[11px] font-bold tracking-tighter text-[var(--green-tint-text)]"
          >
            BB
          </span>
          <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            {APP_CONFIG.name}
          </span>
          <span className="hidden items-center gap-1 rounded-full border border-[var(--green-tint-border)] bg-[var(--green-tint-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--green-tint-text)] sm:inline-flex">
            <ShieldCheck size={11} strokeWidth={1.75} aria-hidden="true" />
            100% Local
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <nav aria-label="Main navigation" className="flex items-center gap-1">
            <Link
              href="/"
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)] sm:px-3 ${
                activePath === "/"
                  ? "border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-1)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <span>Editor</span>
              <HeaderSessionBadge />
            </Link>
            <Link
              href="/privacy"
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)] sm:px-3 ${
                activePath === "/privacy"
                  ? "border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-1)] hover:text-[var(--text-secondary)]"
              }`}
            >
              Privacy &amp; FAQ
            </Link>
          </nav>

          <div className="h-4 w-px bg-[var(--border-subtle)]" aria-hidden="true" />

          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
