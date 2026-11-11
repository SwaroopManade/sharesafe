import type { Metadata } from "next";
import { APP_CONFIG } from "@/config/app";
import { EditorProvider } from "@/store/editor-store";
import { ThemeProvider } from "@/store/theme-store";
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

const THEME_INIT_SCRIPT = `(function(){try{var k="blurbefore-theme";var p=localStorage.getItem(k);var d=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;var r=(p==="dark"||p==="light"||p==="midnight")?p:(d?"dark":"light");document.documentElement.dataset.theme=r;document.documentElement.style.colorScheme=r==="light"?"light":"dark";}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] antialiased transition-colors duration-150 selection:bg-[var(--green-tint-bg)] selection:text-[var(--green-tint-text)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--accent-green)] focus:px-3.5 focus:py-2 focus:text-xs focus:font-semibold focus:text-[var(--text-inverse)] focus:outline-none"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <EditorProvider>{children}</EditorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
