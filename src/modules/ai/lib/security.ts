const DENIED_PATTERNS = [
  /\.env$/i,
  /\.env\.\w+$/i,
  /\.ssh\//,
  /\.aws\//,
  /\.gcloud\//,
  /id_rsa$/,
  /id_ed25519$/,
  /\.pem$/i,
  /\.key$/i,
];

export function isPathDenied(path: string): boolean {
  return DENIED_PATTERNS.some((pattern) => pattern.test(path));
}

export function assertPathSafe(path: string): void {
  if (isPathDenied(path)) {
    throw new Error(`Access denied: path contains sensitive pattern: ${path}`);
  }
}

/**
 * Simplified canonicalization check — Rust backend handles real canonicalization.
 * Frontend only validates deny list.
 */
export function checkReadableCanonical(
  path: string,
): { ok: true; canonical: string } | { ok: false; reason: string } {
  try {
    assertPathSafe(path);
    return { ok: true, canonical: path };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

export function checkWritableCanonical(
  path: string,
): { ok: true; canonical: string } | { ok: false; reason: string } {
  try {
    assertPathSafe(path);
    return { ok: true, canonical: path };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

/**
 * Validate a shell command before execution.
 */
export function checkShellCommand(
  command: string,
): { ok: true } | { ok: false; reason: string } {
  if (!command || command.trim().length === 0) {
    return { ok: false, reason: "command is empty" };
  }
  const interactive = ["vim", "nano", "less", "more", "top", "htop", "btop", "vi"];
  const firstWord = command.trim().split(/\s+/)[0];
  if (interactive.includes(firstWord)) {
    return { ok: false, reason: `interactive command '${firstWord}' is not allowed` };
  }
  return { ok: true };
}
