import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface GitChangedFile {
  path: string;
  originalPath: string | null;
  indexStatus: string;
  worktreeStatus: string;
  staged: boolean;
  unstaged: boolean;
  untracked: boolean;
  statusLabel: string;
}

export interface GitStatusSnapshot {
  branch: string;
  upstream: string | null;
  isDetached: boolean;
  ahead: number;
  behind: number;
  changedFiles: GitChangedFile[];
}

export interface GitRepoInfo {
  repoRoot: string;
  branch: string;
  upstream: string | null;
  isDetached: boolean;
}

interface CommandOutput {
  stdout: string;
  stderr: string;
  exit_code: number;
  timed_out: boolean;
  truncated: boolean;
}

export type SourceControlRefreshMode = "auto" | "always" | "never";
export type SourceControlRemoteAction = "fetch" | "pull" | "push";
export type SourceControlRemoteActionMode =
  | "contextual"
  | SourceControlRemoteAction;

export type SourceControlRemoteActionResult = {
  ok: boolean;
  action: SourceControlRemoteAction | null;
  error?: string;
  blocked?: "diverged" | "missing-upstream" | "no-repo";
};

export type SourceControlSummary = {
  repo: GitRepoInfo | null;
  status: GitStatusSnapshot | null;
  changedCount: number;
  upstream: string | null;
  ahead: number;
  behind: number;
  hasRepo: boolean;
  isLoading: boolean;
  localError: string | null;
  busyAction: SourceControlRemoteAction | null;
  lastRemoteError: string | null;
  applyStatus: (
    updater: (status: GitStatusSnapshot) => GitStatusSnapshot,
  ) => void;
  refresh: (options?: {
    remote?: SourceControlRefreshMode;
  }) => Promise<void>;
  runRemoteAction: (
    mode?: SourceControlRemoteActionMode,
  ) => Promise<SourceControlRemoteActionResult>;
};

const STATUS_LABELS: Record<string, string> = {
  M: "Modified",
  A: "Added",
  D: "Deleted",
  R: "Renamed",
  C: "Copied",
  U: "Updated",
  "?": "Untracked",
  "!": "Ignored",
};

function statusLabel(code: string): string {
  return STATUS_LABELS[code] ?? code;
}

function normalizeError(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Unknown source control error";
}

async function gitExec(command: string, cwd: string): Promise<CommandOutput> {
  return invoke<CommandOutput>("shell_run_command", { command, cwd });
}

function parsePorcelainLine(
  line: string,
): GitChangedFile | null {
  if (!line || line.startsWith("!")) return null;
  if (line.startsWith("#")) return null;
  if (line.startsWith("?")) {
    const path = line.slice(2).trim();
    if (!path) return null;
    return {
      path,
      originalPath: null,
      indexStatus: "?",
      worktreeStatus: "?",
      staged: false,
      unstaged: true,
      untracked: true,
      statusLabel: "Untracked",
    };
  }
  if (line.length < 3) return null;
  const xy = line.slice(0, 2);
  const rest = line.slice(3).trim();
  const [x, y] = [xy[0] === " " ? " " : xy[0], xy[1] === " " ? " " : xy[1]];
  let path = rest;
  let originalPath: string | null = null;
  if ((x === "R" || x === "C") && rest.includes("->")) {
    const parts = rest.split("->").map((s) => s.trim());
    originalPath = parts[0];
    path = parts[1] ?? parts[0];
  }
  return {
    path,
    originalPath,
    indexStatus: x,
    worktreeStatus: y,
    staged: x !== " ",
    unstaged: y !== " ",
    untracked: x === "?" || y === "?",
    statusLabel: statusLabel(x !== " " ? x : y),
  };
}

function parseBranchLine(line: string): {
  branch: string;
  upstream: string | null;
  isDetached: boolean;
  ahead: number;
  behind: number;
} {
  const content = line.replace(/^## /, "");
  const isDetached = content.startsWith("HEAD (");
  let branch = isDetached ? "HEAD" : content.split("...")[0] ?? content;
  let upstream: string | null = null;
  let ahead = 0;
  let behind = 0;
  if (!isDetached && content.includes("...")) {
    const after = content.split("...")[1] ?? "";
    const parts = after.split(" ");
    upstream = parts[0] || null;
    for (let i = 1; i < parts.length; i++) {
      if (parts[i] === "ahead") ahead = parseInt(parts[i + 1] ?? "0", 10);
      if (parts[i] === "behind") behind = parseInt(parts[i + 1] ?? "0", 10);
    }
  }
  return { branch, upstream, isDetached, ahead, behind };
}

async function fetchStatus(
  repoRoot: string,
): Promise<{ repo: GitRepoInfo; status: GitStatusSnapshot }> {
  const output = await gitExec("git status --porcelain -b", repoRoot);
  const lines = output.stdout.split("\n").filter(Boolean);
  const branchLine = lines.find((l) => l.startsWith("##"));
  const branchInfo = branchLine
    ? parseBranchLine(branchLine)
    : { branch: "unknown", upstream: null, isDetached: false, ahead: 0, behind: 0 };
  const fileLines = lines.filter((l) => !l.startsWith("#"));
  const changedFiles: GitChangedFile[] = [];
  for (const line of fileLines) {
    const file = parsePorcelainLine(line);
    if (file) changedFiles.push(file);
  }
  const repo: GitRepoInfo = {
    repoRoot,
    branch: branchInfo.branch,
    upstream: branchInfo.upstream,
    isDetached: branchInfo.isDetached,
  };
  const status: GitStatusSnapshot = {
    branch: branchInfo.branch,
    upstream: branchInfo.upstream,
    isDetached: branchInfo.isDetached,
    ahead: branchInfo.ahead,
    behind: branchInfo.behind,
    changedFiles,
  };
  return { repo, status };
}

async function getRepoRoot(cwd: string): Promise<string | null> {
  try {
    const output = await gitExec("git rev-parse --show-toplevel", cwd);
    const root = output.stdout.trim();
    return root || null;
  } catch {
    return null;
  }
}

export function useSourceControl(
  contextPath: string | null,
  enabled: boolean = true,
): SourceControlSummary {
  const [state, setState] = useState<{
    repo: GitRepoInfo | null;
    status: GitStatusSnapshot | null;
    hasRepo: boolean;
    isLoading: boolean;
    localError: string | null;
    busyAction: SourceControlRemoteAction | null;
    lastRemoteError: string | null;
  }>({
    repo: null,
    status: null,
    hasRepo: false,
    isLoading: false,
    localError: null,
    busyAction: null,
    lastRemoteError: null,
  });
  const stateRef = useRef(state);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const applyStatus = useCallback(
    (updater: (status: GitStatusSnapshot) => GitStatusSnapshot) => {
      setState((current) => {
        if (!current.status) return current;
        const next = updater(current.status);
        if (next === current.status) return current;
        return { ...current, status: next };
      });
    },
    [],
  );

  const doRefresh = useCallback(async (): Promise<void> => {
    if (!mountedRef.current || !enabled) return;
    const requestId = ++requestIdRef.current;
    if (!contextPath) {
      setState({
        repo: null,
        status: null,
        hasRepo: false,
        isLoading: false,
        localError: null,
        busyAction: null,
        lastRemoteError: null,
      });
      return;
    }
    setState((current) => ({ ...current, isLoading: true, localError: null }));
    try {
      const repoRoot = await getRepoRoot(contextPath);
      if (requestId !== requestIdRef.current || !mountedRef.current) return;
      if (!repoRoot) {
        setState({
          repo: null,
          status: null,
          hasRepo: false,
          isLoading: false,
          localError: null,
          busyAction: null,
          lastRemoteError: null,
        });
        return;
      }
      const { repo, status } = await fetchStatus(repoRoot);
      if (requestId !== requestIdRef.current || !mountedRef.current) return;
      setState({
        repo,
        status,
        hasRepo: true,
        isLoading: false,
        localError: null,
        busyAction: null,
        lastRemoteError: stateRef.current.lastRemoteError,
      });
    } catch (error) {
      if (requestId !== requestIdRef.current || !mountedRef.current) return;
      setState((current) => ({
        ...current,
        repo: null,
        hasRepo: false,
        status: null,
        isLoading: false,
        localError: normalizeError(error),
      }));
    }
  }, [contextPath, enabled]);

  const refresh = useCallback(
    async (options?: { remote?: SourceControlRefreshMode }) => {
      if (!mountedRef.current) return;
      const remoteMode = options?.remote ?? "never";
      await doRefresh();
      if (remoteMode !== "never") {
        const repo = stateRef.current.repo;
        if (repo?.upstream) {
          try {
            await gitExec("git fetch", repo.repoRoot);
            if (mountedRef.current) await doRefresh();
          } catch {
            // fetch failure is non-fatal
          }
        }
      }
    },
    [doRefresh],
  );

  const runRemoteAction = useCallback(
    async (
      mode: SourceControlRemoteActionMode = "contextual",
    ): Promise<SourceControlRemoteActionResult> => {
      const { repo, status } = stateRef.current;
      if (!repo || !status) {
        return { ok: false, action: null, blocked: "no-repo" };
      }
      if (!status.upstream) {
        return { ok: false, action: null, blocked: "missing-upstream" };
      }
      let action: SourceControlRemoteAction | null;
      if (mode === "contextual") {
        if (status.ahead > 0 && status.behind > 0) {
          return { ok: false, action: null, blocked: "diverged" };
        }
        if (status.behind > 0) action = "pull";
        else if (status.ahead > 0) action = "push";
        else action = "fetch";
      } else {
        action = mode;
      }
      if (!action) {
        return { ok: false, action: null, blocked: "diverged" };
      }
      setState((current) => ({ ...current, busyAction: action }));
      try {
        if (action === "fetch") {
          await gitExec("git fetch", repo.repoRoot);
        } else if (action === "pull") {
          await gitExec("git fetch", repo.repoRoot);
          await gitExec("git pull --ff-only", repo.repoRoot);
        } else {
          await gitExec("git push", repo.repoRoot);
        }
        setState((current) => ({ ...current, lastRemoteError: null }));
        await refresh({ remote: "never" });
        return { ok: true, action };
      } catch (error) {
        const message = normalizeError(error);
        setState((current) => ({ ...current, lastRemoteError: message }));
        await refresh({ remote: "never" }).catch(() => {});
        return { ok: false, action, error: message };
      } finally {
        setState((current) => ({ ...current, busyAction: null }));
      }
    },
    [refresh],
  );

  useEffect(() => {
    if (!enabled) {
      setState({
        repo: null,
        status: null,
        hasRepo: false,
        isLoading: false,
        localError: null,
        busyAction: null,
        lastRemoteError: null,
      });
      return;
    }
    void refresh({ remote: "never" });
  }, [refresh, contextPath, enabled]);

  return useMemo<SourceControlSummary>(
    () => ({
      repo: state.repo,
      status: state.status,
      changedCount: state.status?.changedFiles.length ?? 0,
      upstream: state.status?.upstream ?? state.repo?.upstream ?? null,
      ahead: state.status?.ahead ?? 0,
      behind: state.status?.behind ?? 0,
      hasRepo: state.hasRepo,
      isLoading: state.isLoading,
      localError: state.localError,
      busyAction: state.busyAction,
      lastRemoteError: state.lastRemoteError,
      applyStatus,
      refresh,
      runRemoteAction,
    }),
    [state, applyStatus, refresh, runRemoteAction],
  );
}
