const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/g,
  /api[-_]?key['":\s]+[A-Za-z0-9_\-]{16,}/gi,
  /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}/g,
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g,
]

export function redactSecrets(text: string): string {
  let result = text
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]')
  }
  return result
}
