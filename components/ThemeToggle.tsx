"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("gym-theme") === "light" ? "light" : "dark";
    setTheme(stored);
    document.documentElement.dataset.theme = stored;
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("gym-theme", next);
    document.documentElement.dataset.theme = next;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-extrabold"
      style={{
        borderColor: "var(--faint)",
        background: "var(--surface-soft)",
        color: "var(--text)"
      }}
      aria-label="Toggle color theme"
      title="Toggle theme"
    >
      {theme === "dark" ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
      <span className="hidden sm:inline">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
