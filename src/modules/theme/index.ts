export { ThemeProvider, useTheme } from "./ThemeProvider";
export type { ThemePref } from "./ThemeProvider";
export { listBuiltinThemes, getBuiltinTheme, getDefaultTheme } from "./themes";
export type { Theme, ThemeColors, ThemeMode, TerminalPalette } from "./types";
export { DEFAULT_THEME_ID } from "./types";
export { applyTheme, clearTheme } from "./applyTheme";
export { BackgroundImage } from "./SurfaceLayer";
export { parseThemeFile, starterTheme, isThemeFilePath } from "./themeFiles";
export { listCustomThemes, saveCustomTheme, deleteCustomTheme } from "./customThemes";
