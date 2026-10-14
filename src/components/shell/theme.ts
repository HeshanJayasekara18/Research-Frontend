// Theme: "light" | "dark" | "superdark" (pure black). Stored per browser.
// THEME_SCRIPT runs inline in <head> before first paint, so there is no flash of the wrong theme.

export type Theme = "light" | "dark" | "superdark";
export const THEMES: Theme[] = ["light", "dark", "superdark"];
const KEY = "app-theme";

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${KEY}");if(t!=="light"&&t!=="dark"&&t!=="superdark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "superdark" ? t : "dark";
}

export function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* storage unavailable: theme still applies for this visit */
  }
}
