import Link from "next/link";
import { Laptop, ShieldCheck, SlidersHorizontal, Square } from "lucide-react";
import { BlurBeforeApp } from "@/components/BlurBeforeApp";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { APP_CONFIG } from "@/config/app";

const CAPABILITY_CARDS = [
  {
    icon: Square,
    title: "Flattened Pixel Redaction",
    body: "Opaque solid-cover bars (recommended for secrets) and deterministic blur are burned directly into exported pixels—never stored as removable layers.",
  },
  {
    icon: ShieldCheck,
    title: "EXIF & GPS Cleaning",
    body: "Re-encoding onto a clean canvas strips common camera details, timestamps, and GPS location metadata from supported JPEG, PNG, and WebP files.",
  },
  {
    icon: SlidersHorizontal,
    title: "Resize & Smart Compression",
    body: "Set output dimensions with aspect-ratio lock enabled by default, pick JPEG, PNG, or WebP, and choose predictable file-size presets.",
  },
  {
    icon: Laptop,
    title: "Zero Uploads, Zero Accounts",
    body: "Everything runs inside your browser tab via Canvas and Web Workers. Check your browser Network tab anytime to verify zero image bytes leave.",
  },
];

export default function HomePage() {
  const intakeHero = (
    <div className="max-w-2xl space-y-3">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--green-tint-border)] bg-[var(--green-tint-bg)] px-3 py-1 text-[11px] font-medium text-[var(--green-tint-text)]">
        <ShieldCheck size={13} strokeWidth={1.75} aria-hidden="true" />
        No Sign-up · Local Browser Processing · Zero Uploads
      </div>
      <h1 className="text-[28px] font-bold leading-tight tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">
        Redact screenshots &amp; clean metadata before you share.
      </h1>
      <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-[15px]">
        {APP_CONFIG.name} hides sensitive details with permanent solid cover or blur, removes
        common EXIF/GPS metadata, resizes, and compresses images—entirely in your browser.
      </p>
    </div>
  );

  const intakeFooter = (
    <section
      aria-labelledby="capabilities-heading"
      className="space-y-5 border-t border-[var(--border-subtle)] pt-10"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="capabilities-heading"
            className="text-base font-semibold tracking-tight text-[var(--text-primary)]"
          >
            Built for safer image sharing
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
            Everything you need before posting receipts, chat screenshots, tickets, or photos.
          </p>
        </div>
        <Link
          href="/privacy"
          className="text-xs font-medium text-[var(--green-tint-text)] transition-colors hover:text-[var(--accent-green)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--accent-green)]"
        >
          Read Privacy Scope &amp; FAQ →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CAPABILITY_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-card)]"
            >
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--green-tint-text)]">
                <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{card.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                {card.body}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-page)]">
      <SiteHeader activePath="/" />

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <BlurBeforeApp intakeHero={intakeHero} intakeFooter={intakeFooter} />
      </main>

      <SiteFooter />
    </div>
  );
}
