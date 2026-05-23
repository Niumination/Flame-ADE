import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SourceControlSummary } from "./useSourceControl";
import type { GitChangedFile, GitStatusSnapshot } from "./useSourceControl";

type PanelState = "closed" | "loading" | "no-repo" | "ready" | "error";
type DiffMode = "+" | "-";

export interface CommandOutput {
  stdout: string;
  stderr: string;
  exit_code: number;
  timed_out: boolean;
  truncated: boolean;
}

export type DiffSelection = {
  path: string;
  mode: DiffMode;
};

export type SourceControlEntry = {
  key: string;
  path: string;
  mode: DiffMode;
  indexStatus: string;
  worktreeStatus: string;
  statusLabel: string;
  statusCode: string;
  originalPath: string | null;
  untracked: boolean;
};

export type CheckState = "checked" | "indeterminate" | "unchecked";

export type SourceControlFileEntry = {
  key: string;
  path: string;
  originalPath: string | null;
  statusCode: string;
  statusLabel: string;
  checkState: CheckState;
  staged: boolean;
  unstaged: boolean;
  untracked: boolean;
};

export type PendingDiscard = {
  scope: "single" | "all";
  count: number;
  label: string;
};

export interface SourceControlPanelState {
  panelState: PanelState;
  repo: import("./useSourceControl").GitRepoInfo | null;
  status: GitStatusSnapshot | null;
  selected: DiffSelection | null;
  commitMessage: string;
  actionBusy: string | null;
  statusError: string | null;
  actionError: string | null;
  remoteError: string | null;
  actionMessage: string | null;
  stagedEntries: SourceControlEntry[];
  unstagedEntries: SourceControlEntry[];
  fileEntries: SourceControlFileEntry[];
  headerCheckState: CheckState;
  allClean: boolean;
  canPush: boolean;
  pushHint: string | null;
  canGenerateCommitMessage: boolean;
  generateCommitMessageHint: string;
  pendingDiscard: PendingDiscard | null;
  setCommitMessage: (value: string) => void;
  refresh: () => Promise<void>;
  selectFile: (entry: SourceControlFileEntry) => Promise<void>;
  toggleStageFile: (entry: SourceControlFileEntry) => Promise<void>;
  toggleAll: () => Promise<void>;
  requestDiscardFile: (entry: SourceControlFileEntry) => void;
  confirmPendingDiscard: () => Promise<void>;
  cancelPendingDiscard: () => void;
  commit: () => Promise<void>;
  push: () => Promise<void>;
}

function normalizeError(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Unknown source control error";
}

function normalizeStatusCode(status: string): string {
  const code = status.trim().toUpperCase();
  switch (code) {
    case "?":
      return "U";
    case "A":
      return "A";
    case "M":
      return "M";
    case "D":
      return "D";
    case "R":
    case "C":
      return "R";
    case "U":
      return "U";
    default:
      return code || "M";
  }
}

function statusCodeForMode(mode: DiffMode, file: GitChangedFile): string {
  if (mode === "-" && file.untracked) return "U";
  const primary = mode === "+" ? file.indexStatus : file.worktreeStatus;
  const fallback = mode === "+" ? file.worktreeStatus : file.indexStatus;
  return normalizeStatusCode(primary !== " " ? primary : fallback);
}

function makeEntry(
  path: string,
  mode: DiffMode,
  file: GitChangedFile,
): SourceControlEntry {
  return {
    key: `${mode}:${path}`,
    path,
    mode,
    indexStatus: file.indexStatus,
    worktreeStatus: file.worktreeStatus,
    statusLabel: file.statusLabel,
    statusCode: statusCodeForMode(mode, file),
    originalPath: file.originalPath,
    untracked: file.untracked,
  };
}

function sameSelection(
  a: DiffSelection | null,
  b: DiffSelection | null,
): boolean {
  return !!a && !!b && a.path === b.path && a.mode === b.mode;
}

function optimisticStage(
  status: GitStatusSnapshot,
  paths: Set<string>,
): GitStatusSnapshot {
  let changed = false;
  const next = status.changedFiles.map((file) => {
    if (!paths.has(file.path)) return file;
    if (file.staged && !file.unstaged) return file;
    changed = true;
    const wt =
      file.worktreeStatus !== " " ? file.worktreeStatus : file.indexStatus;
    return {
      ...file,
      indexStatus: wt,
      worktreeStatus: " ",
      staged: true,
      unstaged: false,
      untracked: false,
    };
  });
  if (!changed) return status;
  return { ...status, changedFiles: next };
}

function optimisticUnstage(
  status: GitStatusSnapshot,
  paths: Set<string>,
): GitStatusSnapshot {
  let changed = false;
  const next: GitChangedFile[] = [];
  for (const file of status.changedFiles) {
    if (!paths.has(file.path)) {
      next.push(file);
      continue;
    }
    if (!file.staged && file.unstaged) {
      next.push(file);
      continue;
    }
    changed = true;
    const idx =
      file.indexStatus !== " " ? file.indexStatus : file.worktreeStatus;
    if (idx === "R" && file.originalPath) {
      next.push({
        path: file.originalPath,
        originalPath: null,
        indexStatus: " ",
        worktreeStatus: "D",
        staged: false,
        unstaged: true,
        untracked: false,
        statusLabel: "Deleted",
      });
      next.push({
        path: file.path,
        originalPath: null,
        indexStatus: " ",
        worktreeStatus: "?",
        staged: false,
        unstaged: true,
        untracked: true,
        statusLabel: "Untracked",
      });
      continue;
    }
    next.push({
      ...file,
      originalPath: null,
      indexStatus: " ",
      worktreeStatus: idx === "A" ? "?" : idx,
      staged: false,
      unstaged: true,
      untracked: idx === "A",
    });
  }
  if (!changed) return status;
  return { ...status, changedFiles: next };
}

function optimisticDiscard(
  status: GitStatusSnapshot,
  paths: Set<string>,
): GitStatusSnapshot {
  let changed = false;
  const next: GitChangedFile[] = [];
  for (const file of status.changedFiles) {
    if (!paths.has(file.path)) {
      next.push(file);
      continue;
    }
    if (file.staged) {
      changed = true;
      next.push({
        ...file,
        worktreeStatus: " ",
        unstaged: false,
        untracked: false,
      });
    } else {
      changed = true;
    }
  }
  if (!changed) return status;
  return { ...status, changedFiles: next };
}

async function shellGit(
  command: string,
  repoRoot: string,
): Promise<CommandOutput> {
  return invoke<CommandOutput>("shell_run_command", {
    command,
    cwd: repoRoot,
  });
}

export function useSourceControlPanel(
  isOpen: boolean,
  summary: SourceControlSummary,
  onOpenDiff:
    | ((input: {
        path: string;
        repoRoot: string;
        mode: DiffMode;
        originalPath: string | null;
        title?: string;
      }) => void)
    | null,
): SourceControlPanelState {
  const [panelState, setPanelState] = useState<PanelState>("closed");
  const [, setRepo] = useState<import("./useSourceControl").GitRepoInfo | null>(null);
  const [status, setStatus] = useState<GitStatusSnapshot | null>(null);
  const [selected, setSelected] = useState<DiffSelection | null>(null);
  const [commitMessage, setCommitMessage] = useState("");
  const [localActionBusy, setLocalActionBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pendingDiscard, setPendingDiscard] = useState<{
    scope: "single";
    entry: SourceControlEntry;
  } | null>(null);
  const selectedRef = useRef<DiffSelection | null>(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const stagedEntries = useMemo(
    () =>
      (status?.changedFiles ?? [])
        .filter((file) => file.staged)
        .map((file) => makeEntry(file.path, "+", file)),
    [status],
  );

  const unstagedEntries = useMemo(
    () =>
      (status?.changedFiles ?? [])
        .filter((file) => file.unstaged)
        .map((file) => makeEntry(file.path, "-", file)),
    [status],
  );

  const fileEntries = useMemo<SourceControlFileEntry[]>(() => {
    const seen = new Set<string>();
    const out: SourceControlFileEntry[] = [];
    for (const file of status?.changedFiles ?? []) {
      if (seen.has(file.path)) continue;
      seen.add(file.path);
      const checkState: CheckState =
        file.staged && file.unstaged
          ? "indeterminate"
          : file.staged
            ? "checked"
            : "unchecked";
      const statusCode = file.unstaged
        ? statusCodeForMode("-", file)
        : statusCodeForMode("+", file);
      out.push({
        key: file.path,
        path: file.path,
        originalPath: file.originalPath,
        statusCode,
        statusLabel: file.statusLabel,
        checkState,
        staged: file.staged,
        unstaged: file.unstaged,
        untracked: file.untracked,
      });
    }
    return out;
  }, [status]);

  const headerCheckState = useMemo<CheckState>(() => {
    if (fileEntries.length === 0) return "unchecked";
    const allChecked = fileEntries.every((e) => e.checkState === "checked");
    if (allChecked) return "checked";
    const anyStaged = fileEntries.some((e) => e.staged);
    return anyStaged ? "indeterminate" : "unchecked";
  }, [fileEntries]);

  const allClean = stagedEntries.length === 0 && unstagedEntries.length === 0;
  const canPush = !!status?.upstream && status.behind === 0;
  const pushHint = useMemo(() => {
    if (!status) return null;
    if (!status.upstream)
      return "Configure or publish this branch in the terminal to enable push.";
    if (status.behind > 0)
      return "Pull remote changes before pushing local commits.";
    if (status.ahead === 0)
      return `No local commits to push to ${status.upstream}.`;
    return `Pushes to ${status.upstream}.`;
  }, [status]);

  const refresh = useCallback(async () => {
    if (!isOpen) {
      setPanelState("closed");
      return;
    }
    await summary.refresh({ remote: "never" });
  }, [isOpen, summary]);

  useEffect(() => {
    if (!isOpen) {
      setPanelState("closed");
      return;
    }
    if (summary.isLoading && !summary.hasRepo && !summary.status) {
      setPanelState("loading");
      return;
    }
    if (!summary.hasRepo) {
      setRepo(null);
      setStatus(null);
      setSelected(null);
      setPanelState("no-repo");
      return;
    }
    if (summary.localError && !summary.status) {
      setRepo(summary.repo);
      setStatus(null);
      setPanelState("error");
      return;
    }
    if (!summary.repo || !summary.status) {
      if (summary.isLoading) {
        setPanelState("loading");
      }
      return;
    }
    setRepo(summary.repo);
    setStatus(summary.status);
    setPanelState("ready");

    const current = selectedRef.current;
    const exists =
      !!current &&
      summary.status.changedFiles.some((file) => {
        if (file.path !== current.path) return false;
        return current.mode === "+" ? file.staged : file.unstaged;
      });
    if (!exists && current) {
      const samePathOtherMode = summary.status.changedFiles.find(
        (file) =>
          file.path === current.path &&
          (current.mode === "+" ? file.unstaged : file.staged),
      );
      if (samePathOtherMode) {
        setSelected({
          path: samePathOtherMode.path,
          mode: current.mode === "+" ? "-" : "+",
        });
      } else {
        setSelected(null);
      }
    }
  }, [isOpen, summary.hasRepo, summary.isLoading, summary.localError, summary.repo, summary.status]);

  const selectFile = useCallback(
    async (entry: SourceControlFileEntry) => {
      if (!summary.repo) return;
      const mode: DiffMode = entry.unstaged ? "-" : "+";
      const nextSelection: DiffSelection = { path: entry.path, mode };
      if (sameSelection(selected, nextSelection)) {
        setActionError(null);
        setActionMessage(null);
        return;
      }
      setSelected(nextSelection);
      setActionError(null);
      setActionMessage(null);
      const file = status?.changedFiles.find((c) => c.path === entry.path);
      if (file && onOpenDiff) {
        onOpenDiff({
          path: nextSelection.path,
          repoRoot: summary.repo.repoRoot,
          mode: nextSelection.mode,
          originalPath: file.originalPath ?? null,
        });
      }
    },
    [onOpenDiff, selected, status, summary.repo],
  );

  const runMutation = useCallback(
    async (
      busyKey: string,
      optimistic: ((status: GitStatusSnapshot) => GitStatusSnapshot) | null,
      ipc: () => Promise<void>,
    ) => {
      if (!summary.repo || summary.busyAction) return;
      setLocalActionBusy(busyKey);
      setActionMessage(null);
      setActionError(null);
      if (optimistic) summary.applyStatus(optimistic);
      try {
        await ipc();
        await summary.refresh({ remote: "never" });
      } catch (error) {
        setActionError(normalizeError(error));
        await summary.refresh({ remote: "never" }).catch(() => {});
      } finally {
        setLocalActionBusy(null);
      }
    },
    [summary],
  );

  const toggleStageFile = useCallback(
    async (entry: SourceControlFileEntry) => {
      if (!summary.repo) return;
      const paths = new Set([entry.path]);
      if (entry.checkState === "checked") {
        await runMutation(
          `unstage:${entry.path}`,
          (s) => optimisticUnstage(s, paths),
          () =>
            shellGit(
              `git restore --staged "${entry.path}"`,
              summary.repo!.repoRoot,
            ).then(() => {}),
        );
      } else {
        await runMutation(
          `stage:${entry.path}`,
          (s) => optimisticStage(s, paths),
          () => invoke("git_add", { path: summary.repo!.repoRoot, files: [entry.path] }),
        );
      }
    },
    [summary, runMutation],
  );

  const toggleAll = useCallback(async () => {
    if (!summary.repo) return;
    const allStaged = fileEntries.every((e) => e.staged);
    if (allStaged) {
      const paths = new Set(fileEntries.map((e) => e.path));
      await runMutation(
        "unstage:all",
        (s) => optimisticUnstage(s, paths),
        () =>
          shellGit(
            `git restore --staged .`,
            summary.repo!.repoRoot,
          ).then(() => {}),
      );
    } else {
      const paths = new Set(
        fileEntries.filter((e) => !e.staged).map((e) => e.path),
      );
      await runMutation(
        "stage:all",
        (s) => optimisticStage(s, paths),
        () =>
          invoke("git_add", { path: summary.repo!.repoRoot, files: [...paths] }),
      );
    }
  }, [fileEntries, summary, runMutation]);

  const requestDiscardFile = useCallback(
    (entry: SourceControlFileEntry) => {
      if (!summary.repo || summary.busyAction) return;
      setPendingDiscard({
        scope: "single",
        entry: {
          key: `-:${entry.path}`,
          path: entry.path,
          mode: "-",
          indexStatus: " ",
          worktreeStatus: entry.statusCode,
          statusLabel: entry.statusLabel,
          statusCode: entry.statusCode,
          originalPath: entry.originalPath,
          untracked: entry.untracked,
        },
      });
    },
    [summary],
  );

  const cancelPendingDiscard = useCallback(() => {
    setPendingDiscard(null);
  }, []);

  const confirmPendingDiscard = useCallback(async () => {
    if (!summary.repo || !pendingDiscard) return;
    const entry = pendingDiscard.entry;
    setPendingDiscard(null);
    const paths = new Set([entry.path]);
    await runMutation(
      `discard:${entry.path}`,
      (s) => optimisticDiscard(s, paths),
      () =>
        shellGit(
          entry.untracked
            ? `git clean -f "${entry.path}"`
            : `git checkout -- "${entry.path}"`,
          summary.repo!.repoRoot,
        ).then((r) => {
          if (r.exit_code !== 0) throw new Error(r.stderr || "Discard failed");
        }),
    );
  }, [pendingDiscard, summary, runMutation]);

  const commit = useCallback(async () => {
    if (!summary.repo || summary.busyAction) return;
    setLocalActionBusy("commit");
    setActionMessage(null);
    setActionError(null);
    try {
      await invoke("git_commit", {
        path: summary.repo.repoRoot,
        message: commitMessage,
      });
      setCommitMessage("");
      setActionMessage("Committed successfully");
      await summary.refresh({ remote: "never" });
    } catch (error) {
      setActionError(normalizeError(error));
    } finally {
      setLocalActionBusy(null);
    }
  }, [commitMessage, summary]);

  const push = useCallback(async () => {
    if (!summary.repo) return;
    setActionMessage(null);
    setActionError(null);
    const result = await summary.runRemoteAction("push");
    if (result.ok) {
      setActionMessage(
        status?.upstream ? `Pushed to ${status.upstream}` : "Push completed",
      );
    } else if (result.error) {
      setActionError(result.error);
    }
  }, [status?.upstream, summary]);

  const pendingDiscardView = useMemo<PendingDiscard | null>(() => {
    if (!pendingDiscard) return null;
    return {
      scope: "single" as const,
      count: 1,
      label: pendingDiscard.entry.path,
    };
  }, [pendingDiscard]);

  return {
    panelState,
    repo: summary.repo,
    status,
    selected,
    commitMessage,
    actionBusy: localActionBusy ?? summary.busyAction,
    statusError: summary.localError,
    actionError,
    remoteError: summary.lastRemoteError,
    actionMessage,
    stagedEntries,
    unstagedEntries,
    fileEntries,
    headerCheckState,
    allClean,
    canPush,
    pushHint,
    canGenerateCommitMessage: false,
    generateCommitMessageHint: "AI commit generation not available",
    pendingDiscard: pendingDiscardView,
    setCommitMessage,
    refresh,
    selectFile,
    toggleStageFile,
    toggleAll,
    requestDiscardFile,
    confirmPendingDiscard,
    cancelPendingDiscard,
    commit,
    push,
  };
}
