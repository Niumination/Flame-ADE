# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.6.x   | ✅ Active development |
| < 0.6   | ❌ Not supported |

## Reporting a Vulnerability

Open a **GitHub issue** with the `security` label.

Please include:
- Affected version
- Steps to reproduce
- Potential impact
- Suggested fix (if known)

We aim to respond within 48 hours.

---

## ✅ Security Checklist

All items are **implemented and verified**:

### Path Traversal Protection
- [x] All filesystem operations `sanitize_path()` — canonicalize if exists, deny-list check
- [x] Deny-list for sensitive paths: `.env*`, `.ssh/`, `id_rsa`, `.pem`, `.key`, `credentials`
- [x] Case-insensitive matching (`.SSH` also blocked)
- [x] Frontend path validation (`assertPathSafe`) in fs-bridge.ts

### API Key Security
- [x] OS keychain only — `keyring` crate with `apple-native` on macOS
- [x] Never in localStorage, settings files, or disk cache
- [x] Frontend only knows whether key *exists* — value never returned to webview

### Network Security
- [x] SSRF protection on outbound HTTP (AI provider requests)
- [x] DNS rebinding defense
- [x] HTTPS enforced for all external connections

### Web Preview
- [x] Sandboxed iframe (`allow-scripts allow-same-origin`)
- [x] URL input validation
- [x] Loading + error state handling
- [x] Dev-server auto-detection with origin restriction

### Terminal Security
- [x] Trust gating in escape sequence handling
- [x] Shell init scripts carefully scoped (OSC 7 + OSC 133 only)
- [x] PTY sessions isolated by UUID

### IPC Security
- [x] Tauri capabilities strictly limited (shell, store, dialog, updater)
- [x] No unnecessary plugin permissions
- [x] Two-process model — webview never touches FS/processes directly

### Build Security
- [x] CSP hardened in `tauri.conf.json`
- [x] Release artifacts signed with minisign
- [x] No telemetry, no analytics, no external tracking
- [x] Zero Rust warnings, strict TypeScript mode

---

## Security Audits

Run these regularly:

```bash
# Rust dependencies
cd src-tauri && cargo audit

# Node dependencies
pnpm audit

# Full verification (OpenCode)
/engon
```

---

## Best Practices

1. **Never commit secrets** — API keys, tokens, passwords
2. **OS keychain only** — no `.env` files, no localStorage
3. **Validate all user input** — paths, commands, URLs
4. **Sanitize file paths** — `sanitize_path()` on every FS operation
5. **HTTPS only** — reject plain HTTP for AI provider endpoints
6. **Keep dependencies updated** — `pnpm audit` + `cargo audit` regularly
7. **Review AI tool operations** — approval flow for write/run/delete
