import Link from "next/link";
import { APP_CONFIG } from "@/config/app";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#2e2e2e] bg-[#0a0a0a] py-6 text-xs text-[#666666]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="leading-relaxed">
          <strong className="font-medium text-[#a3a3a3]">{APP_CONFIG.name}</strong> — Images are
          processed strictly in your browser memory and never uploaded. Unexported edits are
          discarded on refresh.
        </p>
        <div className="flex shrink-0 items-center gap-4">
          <Link
            href="/privacy"
            className="text-[#a3a3a3] underline-offset-4 transition-colors duration-150 hover:text-[#f5f5f5] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
          >
            Privacy &amp; Metadata Caveats
          </Link>
        </div>
      </div>
    </footer>
  );
}
