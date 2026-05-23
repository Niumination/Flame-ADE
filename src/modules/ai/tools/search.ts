import { tool } from "ai";
import { z } from "zod";
import { invoke } from "@tauri-apps/api/core";
import { checkReadableCanonical } from "../lib/security";
import { resolvePath, type ToolContext } from "./context";

interface GrepMatch {
  path: string;
  line: number;
  content: string;
}

const MAX_LINE_LEN = 160;

function clipLine(s: string): string {
  if (s.length <= MAX_LINE_LEN) return s;
  return `${s.slice(0, MAX_LINE_LEN)}…[+${s.length - MAX_LINE_LEN}]`;
}

function resolveRoot(rawRoot: string | undefined, ctx: ToolContext): { ok: true; path: string } | { ok: false; error: string } {
  if (rawRoot && rawRoot.trim().length > 0) {
    try {
      return { ok: true, path: resolvePath(rawRoot, ctx.getCwd()) };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
  const ws = ctx.getWorkspaceRoot();
  if (ws) return { ok: true, path: ws };
  const cwd = ctx.getCwd();
  if (cwd) return { ok: true, path: cwd };
  return { ok: false, error: "no workspace root or active cwd; pass `root` explicitly." };
}

function simpleGlobMatch(pattern: string, filepath: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const regexStr = escaped.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]");
  try {
    return new RegExp(`^${regexStr}$`).test(filepath);
  } catch {
    return filepath.includes(pattern.replace(/\*/g, ""));
  }
}

export function buildSearchTools(ctx: ToolContext) {
  return {
    grep: tool({
      description:
        "Search file contents in the workspace using a regular expression. Honors .gitignore. Returns up to `max_results` (default 30, max 500) `{path, line, text}` hits, with a `truncated` flag when more existed. Long match lines are clipped to 160 chars. Use this for code navigation — do NOT brute-force read_file across the tree. Narrow with `glob` when you can; raise `max_results` only if the first batch truly isn't enough.",
      inputSchema: z.object({
        pattern: z.string().describe("Regex pattern (Rust regex dialect). Anchor and escape literal characters as needed."),
        root: z.string().optional().describe("Root to search under. Defaults to workspace root, then active cwd."),
        glob: z.array(z.string()).optional().describe("Optional include-globs over relative paths, e.g. ['**/*.ts', 'src/**/*.tsx']."),
        case_insensitive: z.boolean().optional(),
        max_results: z.number().int().min(1).max(500).optional(),
      }),
      execute: async ({ pattern, root, glob: _glob, case_insensitive, max_results }) => {
        const r = resolveRoot(root, ctx);
        if (!r.ok) return { error: r.error };
        const safety = checkReadableCanonical(r.path);
        if (!safety.ok) return { error: safety.reason, root: r.path };
        const resolved = safety.canonical;
        const cap = Math.min(max_results ?? 30, 500);
        try {
          let matches = await invoke<GrepMatch[]>("fs_grep", {
            pattern,
            rootPath: resolved,
          });
          if (case_insensitive) {
            const lower = pattern.toLowerCase();
            matches = matches.filter((m) => m.content.toLowerCase().includes(lower));
          }
          const truncated = matches.length > cap;
          if (truncated) matches = matches.slice(0, cap);
          return {
            root: resolved,
            hits: matches.map((h) => ({
              path: h.path,
              line: h.line,
              text: clipLine(h.content),
            })),
            truncated,
            files_scanned: 0,
          };
        } catch (e) {
          return { error: String(e), root: resolved };
        }
      },
    }),

    glob: tool({
      description:
        "Find files by path pattern (gitignore-aware). Use over `list_directory` when you want all matches recursively. Patterns use globset syntax: `**/*.ts`, `src/**/test_*.py`. Returns up to `max_results` matches.",
      inputSchema: z.object({
        pattern: z.string().describe("Glob pattern over relative paths."),
        root: z.string().optional(),
        max_results: z.number().int().min(1).max(2000).optional(),
      }),
      execute: async ({ pattern, root, max_results }) => {
        const r = resolveRoot(root, ctx);
        if (!r.ok) return { error: r.error };
        const safety = checkReadableCanonical(r.path);
        if (!safety.ok) return { error: safety.reason, root: r.path };
        const resolved = safety.canonical;

        try {
          const searchTerm = pattern.replace(/[*?{}[\]!]/g, "").replace(/.*[/\\]/, "").replace(/\./g, ".");
          const results = await invoke<string[]>("fs_search", { pattern: searchTerm, rootPath: resolved });
          const matched = results.filter((f) => simpleGlobMatch(pattern, f));
          const cap = Math.min(max_results ?? 2000, 2000);
          const truncated = matched.length > cap;
          return {
            root: resolved,
            hits: truncated ? matched.slice(0, cap) : matched,
            truncated,
          };
        } catch (e) {
          return { error: String(e), root: resolved };
        }
      },
    }),
  } as const;
}
