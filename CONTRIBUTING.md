# Contributing to Flame ADE

Thank you for your interest in contributing! Flame ADE is an open-source AI-native terminal emulator built with Tauri 2, Rust, and React 19.

---

## Development Setup

### Prerequisites

```bash
# Rust stable
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# pnpm
brew install pnpm    # macOS
npm i -g pnpm         # alternative

# Tauri deps (macOS)
brew install pkg-config

# Tauri deps (Linux)
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev \
  libayatana-appindicator3-dev librsvg2-dev libxdo-dev
```

### First time

```bash
git clone https://github.com/your-org/flame-ade.git
cd flame-ade
pnpm install
pnpm tauri dev
```

---

## Branch Strategy

```
main       — stable releases
develop    — integration branch (default PR target)
feature/*  — new features
fix/*      — bug fixes
release/*  — release preparation
```

### Workflow

1. Branch from `develop`: `git checkout -b feature/my-feature develop`
2. Implement your changes
3. Run all checks (see below)
4. Push and open PR to `develop`
5. Address review feedback
6. Merge after approval

---

## Code Standards

### General
- Follow existing patterns in the codebase
- Keep functions small and focused
- Write tests for new functionality
- Document public APIs

### Rust (`src-tauri/`)
- Run `cargo clippy` — zero warnings required
- Run `cargo test` — all tests must pass
- Use `Result<T, String>` for Tauri commands (error messages are user-facing)
- Mark private helpers that need testing with `#[cfg(test)]` modules

### TypeScript/React (`src/`)
- Strict mode — `tsc --noEmit` must pass with zero errors
- Path alias: `@/` (never relative imports across modules)
- Components in `modules/<area>/components/`
- Hooks in `modules/<area>/lib/`
- UI primitives in `components/ui/` (shadcn)

### Commits
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`
- Small, focused commits (one logical change per commit)
- Descriptive messages referencing the change reason

---

## Running Checks

```bash
# TypeScript type check
pnpm exec tsc --noEmit

# TypeScript tests
pnpm test

# Rust compilation
cd src-tauri && cargo check

# Rust lint
cd src-tauri && cargo clippy

# Rust tests
cd src-tauri && cargo test

# Full verification (OpenCode)
/engon
```

**Expected**: Zero warnings, zero errors, all tests passing.

---

## Project Structure

```
flame-ade/
├── src/                        # React frontend
│   ├── modules/                # Feature modules
│   │   ├── terminal/           # xterm.js multi-tab terminal
│   │   ├── editor/             # CodeMirror 6 editor
│   │   ├── explorer/           # File tree explorer
│   │   ├── preview/            # Web preview iframe
│   │   ├── git/                # Git panel (Changes/Log/Branches)
│   │   ├── ai/                 # AI side-panel (agents, tools, sessions)
│   │   ├── tabs/               # Tab management (Zustand)
│   │   ├── header/             # Top bar with toggles
│   │   ├── statusbar/          # Bottom bar with cwd breadcrumb
│   │   ├── theme/              # Theme system (Tailwind v4 @theme)
│   │   └── settings/           # Settings store + UI
│   ├── components/
│   │   └── ui/                 # shadcn/ui primitives (Button, etc.)
│   ├── lib/                    # Shared utilities (cn, etc.)
│   └── test/                   # Vitest setup + tests
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── lib.rs              # Tauri app entry + command registration
│   │   ├── main.rs             # Binary entry
│   │   └── modules/
│   │       ├── pty/            # PTY sessions (portable-pty)
│   │       ├── fs/             # Filesystem operations
│   │       ├── shell/          # Shell commands (run, session, bg)
│   │       ├── git/            # Git commands
│   │       └── secrets/        # OS keychain (keyring)
│   ├── tests/                  # Rust integration tests
│   ├── capabilities/           # Tauri permission config
│   ├── scripts/                # Shell init scripts (zsh, bash)
│   └── tauri.conf.json         # Tauri configuration
├── .github/workflows/          # CI/CD pipelines
├── AGENTS.md                   # Project context for AI
├── ARCHITECTURE.md             # Architecture deep dive
├── WORKFLOW.md                 # Development workflow
├── FLAME.md                    # Project memory (agent context)
├── PLAN.md                     # Development roadmap
├── CHANGELOG.md                # Release history
└── README.md                   # This file
```

---

## Testing Guidelines

### Rust tests
- **Unit tests**: `#[cfg(test)] mod tests` inside each module file
  - Test private helpers via `super::*`
  - Test public functions with realistic inputs
  - Use `env!("CARGO_MANIFEST_DIR")` for path-based assertions
- **Integration tests**: in `src-tauri/tests/`
  - File existence checks
  - Content verification (scripts, configs)
  - Cross-module interactions

### TypeScript tests
- **Vitest** with jsdom environment
- Setup in `src/test/setup.ts`
- Component tests with `@testing-library/react`
- Smoke tests for critical paths

---

## Security Considerations

See [SECURITY.md](./SECURITY.md) for full policy.

**Always**:
- Never commit secrets (API keys, tokens, passwords)
- Use `sanitize_path()` on any user-provided path
- Validate and sanitize all user input
- Keep API keys in OS keychain only
- Review AI tool operations through approval flow

---

## Need Help?

- Open a [GitHub Issue](https://github.com/your-org/flame-ade/issues)
- Tag with appropriate label: `bug`, `feature`, `question`, `security`
- Include system info (OS, Rust version, Node version)

---

## Code of Conduct

Be respectful and constructive in all interactions. We're building something cool together.
