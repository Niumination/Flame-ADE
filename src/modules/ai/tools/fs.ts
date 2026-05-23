import { tool } from "ai";
import { z } from "zod";
import { invoke } from "@tauri-apps/api/core";
import { checkReadableCanonical, checkWritableCanonical } from "../lib/security";
import { newQueuedEditId, usePlanStore } from "../store/planStore";
import { resolvePath, type ToolContext } from "./context";

const READ_BYTE_CAP = 25 * 1024;
const READ_LINE_CAP = 2000;

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

interface DirEntry {
  name: string;
  kind: string;
}

interface FileTreeEntry {
  name: string;
  path: string;
  kind: string;
  size: number | null;
  children: FileTreeEntry[] | null;
}

export function buildFsTools(ctx: ToolContext) {
  return {
    read_file: tool({
      description:
        "Read a UTF-8 text file. Defaults to the first 2000 lines (capped at 25KB). Pass `offset`/`limit` for line-based windowing of large files. Refuses binary, oversized, or sensitive files (.env, keys, credentials). If you call this on the same path twice in a session without edits in between, the second call returns `unchanged: true` instead of re-emitting the content — re-read the prior tool result.",
      inputSchema: z.object({
        path: z.string().describe("Absolute path, or relative to the active terminal cwd."),
        offset: z.number().int().min(0).optional().describe("0-based start line. Default 0."),
        limit: z.number().int().min(1).max(10000).optional().describe("Max lines to return. Default 2000."),
      }),
      execute: async ({ path, offset, limit }) => {
        const reqPath = resolvePath(path, ctx.getCwd());
        const safety = checkReadableCanonical(reqPath);
        if (!safety.ok) return { error: safety.reason, path: reqPath };
        const abs = safety.canonical;
        try {
          const content = await invoke<string>("fs_read_file", { path: abs });
          const size = content.length;
          const hash = djb2(content);

          const isFullRead = offset === undefined && limit === undefined;
          const prior = ctx.readCache.get(abs);
          if (isFullRead && prior && prior.size === size && prior.hash === hash) {
            return { path: abs, unchanged: true, size };
          }
          ctx.readCache.set(abs, { size, hash });

          if (isFullRead) {
            const lines = content.split("\n");
            const sliceEnd = Math.min(lines.length, READ_LINE_CAP);
            let sliced = lines.slice(0, sliceEnd).join("\n");
            let truncated = sliceEnd < lines.length;
            if (sliced.length > READ_BYTE_CAP) {
              sliced = sliced.slice(0, READ_BYTE_CAP);
              truncated = true;
            }
            return {
              path: abs,
              content: sliced,
              size,
              total_lines: lines.length,
              ...(truncated ? { truncated: true, hint: "call read_file with offset to continue" } : {}),
            };
          }

          const lines = content.split("\n");
          const start = offset ?? 0;
          const requested = limit ?? READ_LINE_CAP;
          const end = Math.min(lines.length, start + requested);
          let sliced = lines.slice(start, end).join("\n");
          let truncated = end < lines.length;
          if (sliced.length > READ_BYTE_CAP) {
            sliced = sliced.slice(0, READ_BYTE_CAP);
            truncated = true;
          }
          return {
            path: abs,
            content: sliced,
            size,
            total_lines: lines.length,
            start_line: start,
            end_line: end,
            ...(truncated ? { truncated: true } : {}),
          };
        } catch (e) {
          return { error: String(e), path: abs };
        }
      },
    }),

    list_directory: tool({
      description:
        "List immediate entries (files + directories) in a directory. Hidden entries are omitted.",
      inputSchema: z.object({
        path: z.string().describe("Absolute path, or relative to the active terminal cwd."),
      }),
      execute: async ({ path }) => {
        const reqPath = resolvePath(path, ctx.getCwd());
        const safety = checkReadableCanonical(reqPath);
        if (!safety.ok) return { error: safety.reason, path: reqPath };
        const abs = safety.canonical;
        try {
          const entries = await invoke<FileTreeEntry[]>("fs_read_tree", { path: abs, depth: 0 });
          return {
            path: abs,
            entries: entries.map((e): DirEntry => ({ name: e.name, kind: e.kind })),
          };
        } catch (e) {
          return { error: String(e), path: abs };
        }
      },
    }),

    write_file: tool({
      description:
        "Create or overwrite a file with the given content. Always asks the user before running. Prefer `edit` / `multi_edit` for in-place changes — only use `write_file` for creating a brand-new file or fully replacing a tiny one.",
      inputSchema: z.object({
        path: z.string(),
        content: z.string(),
      }),
      execute: async ({ path, content }) => {
        const reqPath = resolvePath(path, ctx.getCwd());
        const safety = checkWritableCanonical(reqPath);
        if (!safety.ok) return { error: safety.reason, path: reqPath };
        const abs = safety.canonical;

        if (usePlanStore.getState().active) {
          let original = "";
          let isNewFile = false;
          try {
            original = await invoke<string>("fs_read_file", { path: abs });
          } catch {
            isNewFile = true;
          }
          usePlanStore.getState().enqueue({
            id: newQueuedEditId(),
            kind: "write_file",
            path: abs,
            originalContent: original,
            proposedContent: content,
            isNewFile,
          });
          return { path: abs, queued_for_plan_review: true, ok: true };
        }

        try {
          await invoke("fs_write_file", { path: abs, content });
          ctx.readCache.set(abs, { size: content.length, hash: djb2(content) });
          return { path: abs, bytesWritten: content.length, ok: true };
        } catch (e) {
          return { error: String(e), path: abs };
        }
      },
    }),

    create_directory: tool({
      description:
        "Create a directory (and any missing parents). Always asks the user before running.",
      inputSchema: z.object({
        path: z.string(),
      }),
      execute: async ({ path }) => {
        const reqPath = resolvePath(path, ctx.getCwd());
        const safety = checkWritableCanonical(reqPath);
        if (!safety.ok) return { error: safety.reason, path: reqPath };
        const abs = safety.canonical;
        if (usePlanStore.getState().active) {
          usePlanStore.getState().enqueue({
            id: newQueuedEditId(),
            kind: "create_directory",
            path: abs,
            originalContent: "",
            proposedContent: "",
            isNewFile: true,
            description: "Create directory",
          });
          return { path: abs, queued_for_plan_review: true, ok: true };
        }
        try {
          await invoke("fs_create_dir", { path: abs });
          return { path: abs, ok: true };
        } catch (e) {
          return { error: String(e), path: abs };
        }
      },
    }),
  } as const;
}
