"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Monitor, Moon, Sparkles, Sun } from "lucide-react";
import { THEME_OPTIONS, type ThemePreference, useTheme } from "@/store/theme-store";

function ThemeIcon({ theme, size = 14 }: { theme: ThemePreference; size?: number }) {
  switch (theme) {
    case "light":
      return <Sun size={size} strokeWidth={1.75} aria-hidden="true" />;
    case "midnight":
      return <Sparkles size={size} strokeWidth={1.75} aria-hidden="true" />;
    case "system":
      return <Monitor size={size} strokeWidth={1.75} aria-hidden="true" />;
    case "dark":
    default:
      return <Moon size={size} strokeWidth={1.75} aria-hidden="true" />;
  }
}

export function ThemeSwitcher() {
  const { preference, resolvedTheme, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const activeMeta = THEME_OPTIONS.find((t) => t.id === preference) ?? THEME_OPTIONS[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Theme: ${activeMeta.label}. Switch color theme`}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
      >
        <ThemeIcon theme={preference === "system" ? resolvedTheme : preference} size={14} />
        <span className="hidden sm:inline">{activeMeta.label}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Choose color theme"
          className="animate-modal-in absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1.5 shadow-[var(--shadow-modal)]"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Appearance
          </div>
          {THEME_OPTIONS.map((option) => {
            const isSelected = preference === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => {
                  setPreference(option.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--accent-green)] ${
                  isSelected
                    ? "bg-[var(--green-tint-bg)] text-[var(--green-tint-text)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: option.swatchHex }}
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-[var(--border-strong)]"
                  />
                  <span>
                    <span className="block font-medium">{option.label}</span>
                    <span className="block text-[10px] text-[var(--text-muted)]">
                      {option.description}
                    </span>
                  </span>
                </span>
                {isSelected && <Check size={14} strokeWidth={2} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

