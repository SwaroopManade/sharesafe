import Link from "next/link";
import { APP_CONFIG } from "@/config/app";

interface SiteHeaderProps {
  activePath?: "/" | "/privacy";
}

export function SiteHeader({ activePath = "/" }: SiteHeaderProps) {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/30"
          >
            BB
          </span>
          <span className="text-base font-semibold tracking-tight text-white">
            {APP_CONFIG.name}
          </span>
          <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 sm:inline-block">
            100% Local
          </span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
              activePath === "/"
                ? "bg-zinc-800/80 text-white"
                : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            Editor
          </Link>
          <Link
            href="/privacy"
            className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
              activePath === "/privacy"
                ? "bg-zinc-800/80 text-white"
                : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            Privacy &amp; FAQ
          </Link>
        </nav>
      </div>
    </header>
  );
}

