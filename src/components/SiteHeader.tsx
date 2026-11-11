import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { HeaderSessionBadge } from "@/components/HeaderSessionBadge";
import { APP_CONFIG } from "@/config/app";

interface SiteHeaderProps {
  activePath?: "/" | "/privacy";
}

export function SiteHeader({ activePath = "/" }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#2e2e2e] bg-[#0a0a0a]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
        >
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#166534] bg-[#052e16] text-[11px] font-bold tracking-tighter text-[#4ade80]"
          >
            BB
          </span>
          <span className="text-sm font-semibold tracking-tight text-[#f5f5f5]">
            {APP_CONFIG.name}
          </span>
          <span className="hidden items-center gap-1 rounded-full border border-[#166534] bg-[#052e16] px-2 py-0.5 text-[10px] font-medium text-[#4ade80] sm:inline-flex">
            <ShieldCheck size={11} strokeWidth={1.75} aria-hidden="true" />
            100% Local
          </span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-1">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e] ${
              activePath === "/"
                ? "bg-[#1a1a1a] text-[#f5f5f5] border border-[#2e2e2e]"
                : "text-[#666666] hover:bg-[#111111] hover:text-[#a3a3a3]"
            }`}
          >
            <span>Editor</span>
            <HeaderSessionBadge />
          </Link>
          <Link
            href="/privacy"
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e] ${
              activePath === "/privacy"
                ? "bg-[#1a1a1a] text-[#f5f5f5] border border-[#2e2e2e]"
                : "text-[#666666] hover:bg-[#111111] hover:text-[#a3a3a3]"
            }`}
          >
            Privacy &amp; FAQ
          </Link>
        </nav>
      </div>
    </header>
  );
}
