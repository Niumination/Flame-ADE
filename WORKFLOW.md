# Flame ADE — Development Workflow

## Prerequisites

### System Requirements
- **OS**: macOS Tahoe 26.5 (primary development)
- **Hardware**: Intel Core i5-10310U or better
- **RAM**: 8GB minimum, 16GB recommended

### Software Requirements
1. **Rust** (stable) — https://rustup.rs
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Node.js 20+** — https://nodejs.org
   ```bash
   brew install node
   ```

3. **pnpm** — https://pnpm.io
   ```bash
   brew install pnpm
   ```

4. **Tauri prerequisites** — https://tauri.app/start/prerequisites/
   ```bash
   # macOS
   brew install pkg-config
   ```

5. **OpenCode** — https://opencode.ai
   ```bash
   brew install anomalyco/tap/opencode
   ```

## Daily Workflow

### 1. Start Development Session
```bash
cd ~/Desktop/Flame\ ADE
opencode
```

### 2. Install Dependencies (first time or after pull)
```bash
pnpm install
```

### 3. Start Dev Server
```bash
pnpm tauri dev
```
Or use OpenCode command: `/dev`

### 4. Work on Features
- Use **Build agent** (default) for implementation
- Use **Plan agent** (Tab key) for planning before making changes
- Use **@subagents** for specialized tasks:
  - `@architect` — architecture decisions
  - `@rust-dev` — Rust backend code
  - `@frontend-dev` — React/TypeScript code
  - `@ai-engineer` — AI integration
  - `@security-auditor` — security review
  - `@qa-tester` — testing
  - `@docs-writer` — documentation

### 5. Check Code Quality
```bash
# TypeScript type check
pnpm exec tsc --noEmit

# Rust lint
cd src-tauri && cargo clippy

# Or use OpenCode command: /lint
```

### 6. Run Tests
```bash
pnpm test

# Or use OpenCode command: /test
```

### 7. Commit Changes
```bash
git add .
git commit -m "feat: description of changes"
```

## Branch Strategy

```
main          — stable releases
develop       — integration branch
feature/*     — new features
fix/*         — bug fixes
release/*     — release preparation
```

### Workflow
1. Create feature branch from `develop`
2. Implement feature
3. Run lint and tests
4. Open PR to `develop`
5. Code review (use `@security-auditor` for security review)
6. Merge to `develop`
7. Periodic release from `develop` to `main`

## OpenCode Commands

| Command | Description | Agent |
|---------|-------------|-------|
| `/dev` | Start Tauri dev server | build |
| `/build` | Build production bundle | build |
| `/test` | Run test suite | qa-tester |
| `/lint` | Run linting and type checks | qa-tester |
| `/clippy` | Run cargo clippy | rust-dev |
| `/release` | Prepare new release | release-manager |
| `/audit` | Security audit | security-auditor |
| `/architect` | Architecture review | architect |

## Code Review Process

1. **Self-review**: Use `@qa-tester` to run tests and checks
2. **Security review**: Use `@security-auditor` for vulnerability scan
3. **Architecture review**: Use `@architect` for design decisions
4. **Manual review**: Review diff before committing

## Release Process

1. Update `CHANGELOG.md` with recent changes
2. Bump version in `package.json` and `src-tauri/Cargo.toml`
3. Run full test suite and lint checks
4. Build for all platforms: `pnpm tauri build`
5. Create git tag: `git tag -a v0.x.x -m "Release v0.x.x"`
6. Push tag: `git push origin --tags`
7. Create GitHub release with binaries

## Testing Strategy

### Unit Tests
- Rust: `cargo test` in `src-tauri/`
- TypeScript: `pnpm test` (vitest)

### Integration Tests
- PTY session lifecycle
- File operations
- AI tool execution

### Manual Testing
- Terminal rendering (xterm.js correctness)
- Shell integration (OSC 7, OSC 133)
- AI agent workflow
- macOS Tahoe specific behaviors

## Troubleshooting

### Tauri dev server won't start
```bash
# Check Rust installation
rustc --version

# Check Node.js
node --version

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

### PTY issues on macOS Tahoe
- Verify shell init scripts are loading correctly
- Check OSC escape sequence handling
- Test with different shells (zsh, bash)

### Build fails
```bash
# Clean and rebuild
rm -rf node_modules dist
pnpm install
pnpm tauri build

# Check Rust
cd src-tauri && cargo clean && cargo build
```

### AI not responding
- Verify API key is set in Settings → AI
- Check network connectivity
- Try different provider

## Best Practices

1. **Small commits** — one logical change per commit
2. **Descriptive messages** — follow conventional commits
3. **Test before commit** — run lint and tests
4. **Document changes** — update relevant docs
5. **Security first** — never commit secrets or keys
6. **macOS Tahoe testing** — test every feature on Tahoe 26.5
7. **Keep it lightweight** — justify every dependency
