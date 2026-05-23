import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_THEME_ID, type Theme } from "./types";
import { applyTheme, clearTheme } from "./applyTheme";
import { SurfaceLayer } from "./SurfaceLayer";
import { getBuiltinTheme, getDefaultTheme } from "./themes";

export type ThemePref = "system" | "light" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultMode?: ThemePref;
};

type ThemeProviderState = {
  mode: ThemePref;
  resolvedMode: "dark" | "light";
  themeId: string;
  setMode: (mode: ThemePref) => void;
  setThemeId: (id: string) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | null>(null);

const LS_MODE_KEY = "flame-ade:theme-mode";
const LS_THEME_ID_KEY = "flame-ade:theme-id";

function readPref<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return JSON.parse(v) as T;
  } catch {
    /* ignore */
  }
  return fallback;
}

function writePref<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function resolveTheme(id: string): Theme {
  return getBuiltinTheme(id) ?? getDefaultTheme();
}

export function ThemeProvider({ children, defaultMode = "system" }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemePref>(() => readPref(LS_MODE_KEY, defaultMode));
  const [themeId, setThemeIdState] = useState<string>(() => readPref(LS_THEME_ID_KEY, DEFAULT_THEME_ID));
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolvedMode: "dark" | "light" =
    mode === "system" ? (systemDark ? "dark" : "light") : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedMode);
  }, [resolvedMode]);

  useEffect(() => {
    if (themeId === DEFAULT_THEME_ID) {
      clearTheme();
      return;
    }
    const theme = resolveTheme(themeId);
    applyTheme(theme, resolvedMode);
  }, [themeId, resolvedMode]);

  const setMode = useCallback((next: ThemePref) => {
    setModeState(next);
    writePref(LS_MODE_KEY, next);
  }, []);

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id);
    writePref(LS_THEME_ID_KEY, id);
  }, []);

  const value = useMemo<ThemeProviderState>(
    () => ({ mode, resolvedMode, themeId, setMode, setThemeId }),
    [mode, resolvedMode, themeId, setMode, setThemeId],
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      <SurfaceLayer />
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme(): ThemeProviderState {
  const ctx = useContext(ThemeProviderContext);
  if (!ctx) throw new Error("useTheme must be used within a <ThemeProvider>");
  return ctx;
}
