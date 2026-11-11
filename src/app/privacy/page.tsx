import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { APP_CONFIG } from "@/config/app";
import { IMAGE_LIMITS } from "@/config/limits";

export const metadata: Metadata = {
  title: `Privacy, Metadata Scope & FAQ — ${APP_CONFIG.name}`,
  description: `Learn how ${APP_CONFIG.name} redacts images locally in your browser, strips common EXIF metadata, and avoids server uploads.`,
  alternates: {
    canonical: "/privacy",
  },
};

const FAQ_ITEMS = [
  {
    q: "Are my images uploaded to any server?",
    a: "No. After the website HTML/JS assets load, reading, decoding, blurring, solid-cover painting, resizing, and re-encoding happen strictly inside your browser tab's memory. You can open your browser's DevTools → Network tab while editing and exporting to confirm zero image requests leave your device.",
  },
  {
    q: "Why does BlurBefore recommend Solid Cover instead of Blur for secrets?",
    a: "Opaque solid-cover rectangles permanently replace underlying pixels with a uniform color. Blur reduces legibility visually, but blurred text or numbers can still leak character lengths, shapes, or partial contrast patterns. Always use Solid Cover for passwords, account numbers, API keys, and sensitive names.",
  },
  {
    q: "Does exporting guarantee 100% forensic removal of all metadata?",
    a: "Exporting decodes your image onto a clean raster surface and re-encodes a brand-new JPEG, PNG, or WebP file, which strips common source EXIF and GPS location fields across supported browsers. However, browser encoders vary and re-encoding is not a forensic guarantee against every specialized metadata chunk or steganographic payload.",
  },
  {
    q: "Which formats and limits are supported?",
    a: `MVP supports JPEG/JPG, PNG, and static WebP up to ${Math.round(IMAGE_LIMITS.maxFileSizeBytes / (1024 * 1024))} MB and ${IMAGE_LIMITS.maxDecodedPixels / 1_000_000} megapixels, with up to ${IMAGE_LIMITS.maxRedactionRegions} redaction regions per image. Animated GIFs/WebPs, HEIC, TIFF, and SVG are rejected so frames or vector contents are not silently dropped.`,
  },
  {
    q: "Why did WebP export appear disabled or transparent areas turn white in JPEG?",
    a: "Some browsers cannot encode WebP natively via Canvas, so BlurBefore checks actual encoder output and disables unsupported formats rather than silently exporting a mismatched file. JPEG does not support alpha transparency, so transparent PNG pixels are flattened onto a white background when exporting to JPEG.",
  },
  {
    q: "What happens if I refresh or close the tab?",
    a: "Because BlurBefore does not persist images to cloud storage or browser storage, refreshing or closing the tab discards the current editing session and releases temporary memory.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader activePath="/privacy" />

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-10 px-4 py-10 sm:px-6 sm:py-14">
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex text-sm font-medium text-emerald-400 hover:underline focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            ← Back to {APP_CONFIG.name} Editor
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Privacy Scope, Redaction Guide &amp; FAQ
          </h1>
          <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
            Clear technical details on how {APP_CONFIG.name} handles your files, what metadata
            cleaning covers, and best practices for irreversible redaction.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <h2 className="text-base font-semibold text-emerald-100">
              Recommended: Solid Cover
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-emerald-200/90">
              Replaces every pixel inside the selected rectangle with a single opaque color and
              flattens the final export. Ideal for emails, phone numbers, financial totals, and IDs.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <h2 className="text-base font-semibold text-amber-100">
              Visual Treatment: Blur
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-amber-200/90">
              Applies deterministic isolated pixel blurring to obscure faces or low-sensitivity
              context. Never rely on blur alone when short digits or text must remain unrecoverable.
            </p>
          </div>
        </section>

        <section aria-labelledby="faq-heading" className="space-y-4">
          <h2 id="faq-heading" className="text-xl font-semibold text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <article
                key={item.q}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
              >
                <h3 className="text-sm font-semibold text-white">{item.q}</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-300 sm:text-sm">{item.a}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
