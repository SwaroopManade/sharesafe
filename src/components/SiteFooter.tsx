import Link from "next/link";
import { APP_CONFIG } from "@/config/app";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 py-8 text-xs text-zinc-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <strong className="font-medium text-zinc-200">{APP_CONFIG.name}</strong> — Images are
          processed strictly in your browser memory and never uploaded. Projects are not saved if
          you refresh or close this tab.
        </p>
        <div className="flex shrink-0 items-center gap-4">
          <Link
            href="/privacy"
            className="text-zinc-300 underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            Privacy &amp; Metadata Caveats
          </Link>
        </div>
      </div>
    </footer>
  );
}

