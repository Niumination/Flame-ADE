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
]

export function isPathDenied(path: string): boolean {
  return DENIED_PATTERNS.some((pattern) => pattern.test(path))
}

export function assertPathSafe(path: string): void {
  if (isPathDenied(path)) {
    throw new Error(`Access denied: path contains sensitive pattern: ${path}`)
  }
}
