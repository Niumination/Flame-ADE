# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.6.x   | :white_check_mark: |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

Please report security vulnerabilities by opening a GitHub issue with the `security` label.

## Security Checklist

- [ ] Path guards on all filesystem operations
- [ ] Deny-list for secret paths (`.env*`, `.ssh/`, credentials, keychain dirs)
- [ ] SSRF protection on outbound HTTP requests
- [ ] DNS rebinding defense
- [ ] Sandboxed iframe for web preview
- [ ] Trust gating in terminal escape-sequence handling
- [ ] IPC sandboxing between webview and Rust backend
- [ ] OS keychain for API key storage (never localStorage)
- [ ] No telemetry, no analytics, no external tracking

## Security Audits

Run security audits regularly:

```bash
# Rust
cd src-tauri && cargo audit

# Node
pnpm audit
```

## Best Practices

1. Never commit secrets
2. Use OS keychain for API keys
3. Validate all user input
4. Sanitize file paths
5. Use HTTPS for all external requests
6. Keep dependencies updated
