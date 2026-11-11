import type { Metadata } from "next";
import { APP_CONFIG } from "@/config/app";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${APP_CONFIG.name} — Blur, Redact & Clean Image Metadata Locally`,
  description:
    "Free, zero-upload browser tool to permanently redact sensitive areas with solid cover or blur, strip common EXIF/GPS metadata, resize, and compress images locally.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${APP_CONFIG.name} — Privacy-First Image Redaction Toolkit`,
    description:
      "Redact screenshots and photos right in your browser. Zero image uploads, flattened pixel export, and EXIF/GPS removal.",
    type: "website",
    url: "/",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
