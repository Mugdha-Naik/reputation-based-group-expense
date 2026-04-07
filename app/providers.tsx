"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SessionProvider } from "next-auth/react";

type ThemeMode = "day" | "night";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "night";
    }

    const storedTheme = window.localStorage.getItem("app-theme");
    return storedTheme === "day" || storedTheme === "night" ? storedTheme : "night";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "day") {
      root.classList.add("theme-day");
    } else {
      root.classList.remove("theme-day");
    }
    window.localStorage.setItem("app-theme", theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (nextTheme) => setThemeState(nextTheme),
      toggleTheme: () => setThemeState((current) => (current === "day" ? "night" : "day")),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeProvider");
  }

  return context;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
