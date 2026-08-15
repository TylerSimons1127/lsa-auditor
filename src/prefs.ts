// Preferences model for the LSA Auditor dashboard.
// All options are user-facing and applied at runtime via CSS custom properties.

export type ThemeMode = "light" | "dark";
export type AccentKey = "indigo" | "blue" | "violet" | "emerald" | "rose" | "amber" | "slate";
export type FontKey = "inter" | "grotesk" | "system" | "mono";
export type DensityKey = "comfortable" | "compact";
export type DateFormat = "iso" | "us" | "eu" | "relative";
export type CurrencyKey = "USD" | "EUR" | "GBP" | "none";
export type NumberFormat = "en" | "eu";

export interface Prefs {
  theme: ThemeMode;
  accent: AccentKey;
  font: FontKey;
  density: DensityKey;
  dateFormat: DateFormat;
  currency: CurrencyKey;
  numberFormat: NumberFormat;
  animations: boolean;
  compactStats: boolean;
  rowStripes: boolean;
  accentRows: boolean;
  defaultFilter: "all" | "needs-review" | "auto-junk" | "likely-good";
}

export const ACCENTS: Record<AccentKey, { label: string; h: number; s: number; l: number }> = {
  indigo: { label: "Indigo", h: 243, s: 75, l: 59 },
  blue: { label: "Blue", h: 214, s: 80, l: 56 },
  violet: { label: "Violet", h: 262, s: 72, l: 60 },
  emerald: { label: "Emerald", h: 152, s: 56, l: 42 },
  rose: { label: "Rose", h: 347, s: 72, l: 55 },
  amber: { label: "Amber", h: 38, s: 92, l: 48 },
  slate: { label: "Slate", h: 215, s: 20, l: 45 },
};

export const FONTS: Record<FontKey, { label: string; stack: string }> = {
  inter: { label: "Inter", stack: '"Inter", system-ui, sans-serif' },
  grotesk: { label: "Space Grotesk", stack: '"Space Grotesk", system-ui, sans-serif' },
  system: { label: "System", stack: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
  mono: { label: "Mono", stack: 'ui-monospace, "SF Mono", "Roboto Mono", monospace' },
};

export const DEFAULT_PREFS: Prefs = {
  theme: "light",
  accent: "indigo",
  font: "inter",
  density: "comfortable",
  dateFormat: "iso",
  currency: "USD",
  numberFormat: "en",
  animations: true,
  compactStats: false,
  rowStripes: true,
  accentRows: false,
  defaultFilter: "all",
};

const KEY = "lsa-auditor-prefs";

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

/** Apply preferences to the document root via CSS custom properties. */
export function applyPrefs(p: Prefs) {
  const root = document.documentElement;
  const a = ACCENTS[p.accent];
  root.style.setProperty("--accent", `${a.h} ${a.s}% ${a.l}%`);
  root.style.setProperty("--accent-soft", `${a.h} ${a.s}% ${a.l}% / 0.12`);
  root.style.setProperty("--accent-fg", a.l > 60 ? "222 47% 11%" : "0 0% 100%");
  root.style.setProperty("--font-ui", FONTS[p.font].stack);
  root.style.setProperty("--density", p.density === "compact" ? "0.72" : "1");
  root.dataset.theme = p.theme;
  root.dataset.stripes = p.rowStripes ? "on" : "off";
  root.dataset.accentRows = p.accentRows ? "on" : "off";
  root.dataset.anim = p.animations ? "on" : "off";
  root.dataset.compactStats = p.compactStats ? "on" : "off";
}
