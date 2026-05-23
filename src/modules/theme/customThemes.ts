import type { Theme } from "./types";

const LS_KEY = "flame-ade:custom-themes";

export async function listCustomThemes(): Promise<Theme[]> {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v) return JSON.parse(v) as Theme[];
  } catch {
    /* ignore */
  }
  return [];
}

export async function saveCustomTheme(theme: Theme): Promise<void> {
  const current = await listCustomThemes();
  const next = current.filter((t) => t.id !== theme.id).concat(theme);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    throw new Error("Failed to save custom theme. Local storage may be full.");
  }
}

export async function deleteCustomTheme(id: string): Promise<void> {
  const current = await listCustomThemes();
  const next = current.filter((t) => t.id !== id);
  if (next.length === current.length) return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
