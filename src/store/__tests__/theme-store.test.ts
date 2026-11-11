import { describe, expect, it } from "vitest";
import { isThemePreference, resolveThemePreference, THEME_OPTIONS } from "@/store/theme-store";

describe("theme-store helpers", () => {
  it("validates supported theme preferences", () => {
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("midnight")).toBe(true);
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("neon")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });

  it("resolves system preference based on OS color scheme", () => {
    expect(resolveThemePreference("system", true)).toBe("dark");
    expect(resolveThemePreference("system", false)).toBe("light");
    expect(resolveThemePreference("light", true)).toBe("light");
    expect(resolveThemePreference("midnight", false)).toBe("midnight");
  });

  it("exposes all expected theme options", () => {
    expect(THEME_OPTIONS.map((t) => t.id)).toEqual(["dark", "light", "midnight", "system"]);
  });
});

