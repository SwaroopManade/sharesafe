"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemePreference = "system" | "dark" | "light" | "midnight";
export type ResolvedTheme = "dark" | "light" | "midnight";

export const THEME_STORAGE_KEY = "blurbefore-theme";

export interface ThemeOptionMeta {
  id: ThemePreference;
  label: string;
  description: string;
  swatchHex: string;
}

export const THEME_OPTIONS: readonly ThemeOptionMeta[] = [
  {
    id: "dark",
    label: "Dark",
    description: "Near-black studio focus",
    swatchHex: "#0a0a0a",
  },
  {
    id: "light",
    label: "Light",
    description: "Clean daylight studio",
    swatchHex: "#fafafa",
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Deep slate navy",
    swatchHex: "#0b1120",
  },
  {
    id: "system",
    label: "System",
    description: "Match OS appearance",
    swatchHex: "#52525b",
  },
] as const;

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "dark" || value === "light" || value === "midnight";
}

export function resolveThemePreference(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return preference;
}

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeToDocument(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved === "light" ? "light" : "dark";
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "dark";
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(raw) ? raw : "system";
  } catch {
    return "dark";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const stored = readStoredPreference();
    setPreferenceState(stored);

    const media =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;

    if (media) {
      setSystemPrefersDark(media.matches);
      setHasMounted(true);
      const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    setHasMounted(true);
    return undefined;
  }, []);

  const resolvedTheme = useMemo(
    () => resolveThemePreference(preference, systemPrefersDark),
    [preference, systemPrefersDark],
  );

  useEffect(() => {
    if (!hasMounted) return;
    applyThemeToDocument(resolvedTheme);
  }, [hasMounted, resolvedTheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage errors in restricted private browsing modes
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
    }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside a ThemeProvider.");
  }
  return ctx;
}
