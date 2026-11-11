import Link from "next/link";
import { BlurBeforeApp } from "@/components/BlurBeforeApp";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { APP_CONFIG } from "@/config/app";

const CAPABILITY_CARDS = [
  {
    title: "Permanent Flattened Redaction",
    body: "Opaque solid-cover bars (recommended for secrets) and deterministic pixel blur are burned straight into exported raster pixels—never saved as removable layers.",
  },
  {
    title: "EXIF & GPS Cleaning",
    body: "Exporting decodes and re-encodes supported images onto a clean canvas to strip common camera, timestamp, and GPS location metadata.",
  },
  {
    title: "Resize & Lossy Compression",
    body: "Adjust output dimensions with aspect-ratio lock enabled by default, choose JPEG, PNG, or WebP, and pick clear file-size quality presets.",
  },
  {
    title: "Zero Uploads, Zero Accounts",
    body: "Everything runs inside your browser tab using Canvas and Web Workers. You can inspect your browser Network tab to verify zero image bytes leave your device.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader activePath="/" />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-14 px-4 py-8 sm:px-6 sm:py-10">
        <section className="space-y-6">
          <div className="max-w-3xl space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              No Sign-up · Local Browser Processing · Zero Server Uploads
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Redact screenshots &amp; strip metadata before you share.
            </h1>
            <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
              {APP_CONFIG.name} helps you hide sensitive details with permanent solid-cover boxes or
              blur, clean common EXIF/GPS metadata, resize, and compress images—entirely on your
              own device.
            </p>
          </div>

          <BlurBeforeApp />
        </section>

        <section aria-labelledby="capabilities-heading" className="space-y-5 border-t border-zinc-800/80 pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="capabilities-heading" className="text-xl font-semibold text-white">
                Built for safer image sharing
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Everything you need before posting receipts, chat screenshots, tickets, or photos.
              </p>
            </div>
            <Link
              href="/privacy"
              className="text-sm font-medium text-emerald-400 hover:underline focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              Read Privacy Scope &amp; FAQ →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITY_CARDS.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
              >
                <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-300">{card.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
