"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "luucid.theme";

function getSystemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme() {
  if (typeof window === "undefined") return "light";

  const fromAttr = document.documentElement?.dataset?.theme;
  if (fromAttr === "dark" || fromAttr === "light") return fromAttr;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // ignore
  }

  return getSystemTheme();
}

function applyTheme(nextTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = nextTheme;
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Avoid SSR/client mismatches by only rendering after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setTheme(getInitialTheme());
  }, []);

  useEffect(() => {
    if (theme !== "dark" && theme !== "light") return;

    applyTheme(theme);

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const isDark = theme === "dark";

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="fixed right-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--luucid-border) bg-(--luucid-surface-soft) shadow-sm backdrop-blur transition-colors hover:bg-(--luucid-surface) focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      style={{ top: "calc(1rem + env(safe-area-inset-top))" }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-(--luucid-text)" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5 text-(--luucid-text)" aria-hidden="true" />
      )}
    </button>
  );
}
