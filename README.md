# 🔥 Flame ADE

**Lightweight AI-native terminal emulator (ADE) — Tauri 2 + Rust + React 19**

[![version](https://img.shields.io/badge/version-0.6.0--dev-blue?style=flat-square)]()
[![license](https://img.shields.io/badge/license-Apache--2.0-green?style=flat-square)]()
[![platform](https://img.shields.io/badge/platform-macOS%20|%20Linux%20|%20Windows-lightgrey?style=flat-square)]()
[![CI](https://img.shields.io/badge/CI-passing-brightgreen?style=flat-square)]()
[![Rust](https://img.shields.io/badge/Rust-1.95.0-orange?style=flat-square)]()
[![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)]()

Flame ADE pairs a **native PTY backend** (Rust + `portable-pty`) with a **modern React UI** — multi-tab terminals, an integrated CodeMirror 6 editor, a file explorer, web preview, Git panel, and a first-class **BYOK AI side-panel** that works with your own API keys or fully local models via LM Studio.

**~7 MB on disk · No telemetry · Keys in OS keychain only**

**Primary target**: macOS Tahoe 26.5 (Hackintosh Intel i5-10310U optimized)

---

## ✨ Features

### 🖥️ Terminal
| Feature | Status |
|---------|--------|
| xterm.js + WebGL renderer (GPU-accelerated) | ✅ |
| Multi-tab with background streaming (tabs stay alive when hidden) | ✅ |
| Native PTY via `portable-pty` (zsh, bash, fish, pwsh) | ✅ |
| Shell integration — OSC 7 (cwd) + OSC 133 (prompt boundaries) | ✅ |
| True-color, font ligatures, link detection | ✅ |
| Auto-injected init scripts (no manual shell config) | ✅ |

### 📝 Editor
| Feature | Status |
|---------|--------|
| CodeMirror 6 — TS/JS, Rust, Python, HTML/CSS, JSON, Markdown, Go, C/C++ | ✅ |
| Vim mode (`@replit/codemirror-vim`) | ✅ |
| Multiple themes: Tokyo Night, Nord, GitHub, Atom One, Aura, Copilot, Xcode | ✅ |
| Inline AI autocomplete | ✅ |

### 📂 File Explorer
- Directory tree with Catppuccin/Material icons
- Fuzzy search with keyboard navigation
- Inline rename, context actions (create, delete, rename)
- Backslash-aware cross-platform paths

### 🌐 Web Preview
- Sandboxed iframe (`allow-scripts allow-same-origin`)
- URL input bar with Go button
- Auto-detects local dev servers
- Loading state + error handling

### ⎇ Git Panel
| View | Features |
|------|----------|
| **Changes** | Staging with checkboxes, per-file diff viewer, commit message input |
| **Log** | Commit history (hash + message) |
| **Branches** | List local branches, switch with one click |

### 🤖 AI (BYOK — Bring Your Own Key)

| Feature | Status |
|---------|--------|
| Multi-provider: OpenAI, Anthropic, Google, Groq, xAI, Cerebras | ✅ |
| OpenAI-compatible custom endpoint (LM Studio for local/offline) | ✅ |
| Agent system with sub-agents + tools | ✅ |
| Slash commands: `/explain`, `/fix`, `/test`, `/refactor`, `/docs` | ✅ |
| Approval flow for dangerous operations (write, run, delete) | ✅ |
| Voice input (Web Speech API) | ✅ |
| AI edit diffs — side-by-side, per-hunk accept/reject | ✅ |
| Session management with persistence | ✅ |
| Project memory via `FLAME.md` | ✅ |

### 🛡️ Security
| Measure | Status |
|---------|--------|
| API keys in OS keychain only (never localStorage/disk) | ✅ |
| Path traversal protection (canonicalize + deny-list) | ✅ |
| SSRF + DNS rebinding defense on AI HTTP | ✅ |
| Sandboxed iframe for web preview | ✅ |
| CSP hardened | ✅ |
| No telemetry, no analytics, no account | ✅ |
| Minisign-signed release artifacts | ✅ |

---

## 🚀 Quick Start

### Prerequisites

```bash
# Rust (stable)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# pnpm
brew install pnpm   # macOS
# or: npm i -g pnpm

# Tauri system deps
# macOS: brew install pkg-config
# Linux: see https://tauri.app/start/prerequisites/
```

### Run from source

```bash
git clone https://github.com/your-org/flame-ade.git
cd flame-ade
pnpm install
pnpm tauri dev
```

Dev mode starts:
- **Vite** dev server at `http://localhost:1420` (hot-reload frontend)
- **Rust** backend compiles (~14s debug, ~5m release)

### Production build

```bash
pnpm tauri build
```

Output bundle in `src-tauri/target/release/bundle/`.

---

## 🧪 Tests

```bash
# TypeScript (vitest)
pnpm test

# Rust (unit + integration)
cd src-tauri && cargo test

# Type check
pnpm exec tsc --noEmit

# Rust lint
cd src-tauri && cargo clippy
```

**Current coverage**: 67 Rust tests (50 unit + 17 integration) + 2 TypeScript smoke tests.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+I` | Toggle AI panel |
| `Cmd+W` | Close active tab |
| `Cmd+T` | New terminal tab |
| `Enter` (chat) | Send AI message |
| `↑` (chat) | Edit last message |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                Webview (React 19)                   │
│  ┌──────────┬──────────┬──────────┬──────────┐     │
│  │ Terminal │  Editor  │ Explorer │    AI    │     │
│  │ xterm.js │ CM 6     │  Tree    │ Panel    │     │
│  └────┬─────┴────┬─────┴────┬─────┴────┬─────┘     │
│       │          │          │          │            │
│  ┌────┴──────────┴──────────┴──────────┴─────┐     │
│  │       IPC (invoke / Channel events)        │     │
│  └────────────────────┬───────────────────────┘     │
├───────────────────────┼─────────────────────────────┤
│               Rust Backend (Tauri 2)                │
│  ┌──────────┬──────────┬──────────┬──────────┐     │
│  │   PTY    │    FS    │  Shell   │   Git    │     │
│  │portable  │ tree,    │ run,     │ status,  │     │
│  │ -pty     │ search,  │ session, │ diff,    │     │
│  │          │ grep     │ bg       │ commit   │     │
│  ├──────────┴──────────┴──────────┴──────────┤     │
│  │              Secrets (keyring)             │     │
│  └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

### Two-Process Model
- **Rust backend** owns all OS access (PTY, FS, shell, git, keychain)
- **React webview** owns the UI — communicates exclusively via IPC
- Crash in one process doesn't take down the other
- Webview never touches the filesystem or processes directly

---

## 🔧 Configuration

### AI Providers

1. Open **Settings → AI** (or click 🤖 in header)
2. Pick a provider from the dropdown
3. Paste your API key (stored in **OS keychain**, never on disk)
4. For local models: select "OpenAI-compatible" → point to `http://localhost:1234/v1`

### Keychains

| OS | Backend |
|----|---------|
| macOS | Native Keychain (apple-native) |
| Linux | Secret Service / file fallback |
| Windows | Credential Manager |

### Project Memory

Place a `FLAME.md` in your workspace root — Flame ADE reads it as agent context (similar to `AGENTS.md` / `CLAUDE.md`).

---

## 📦 Bundle Targets

| Platform | Format | Min Version |
|----------|--------|-------------|
| macOS (x86_64 + arm64) | .dmg | 10.15 |
| Linux | .deb / .rpm / AppImage | — |
| Windows | NSIS installer | Windows 10+ |

---

## 📚 Documentation

| File | Description |
|------|-------------|
| [AGENTS.md](./AGENTS.md) | Project context for AI agents |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Deep dive into system design |
| [WORKFLOW.md](./WORKFLOW.md) | Daily development workflow |
| [FLAME.md](./FLAME.md) | Project memory / living architecture |
| [PLAN.md](./PLAN.md) | Development roadmap |
| [CHANGELOG.md](./CHANGELOG.md) | Release history |
| [SECURITY.md](./SECURITY.md) | Security policy |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guide |

---

## 🤝 Contributing

PRs welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Key points:
- Branch from `develop`, PR back to `develop`
- Run `pnpm exec tsc --noEmit` and `cargo clippy` before committing
- Write tests for new features

---

## 🧑‍💻 Development

### Daily workflow

```bash
opencode              # OpenCode AI session
pnpm tauri dev        # Start dev server
# ... make changes ...
pnpm exec tsc --noEmit
cd src-tauri && cargo clippy
pnpm test && cd src-tauri && cargo test
git add -A && git commit -m "feat: description"
```

### OpenCode commands

| Command | Agent |
|---------|-------|
| `/dev` | Start Tauri dev server |
| `/build` | Production build |
| `/lint` | TypeScript + Rust lint |
| `/test` | Run all tests |
| `/engon` | Full project verification |

---

## 📄 License

Apache-2.0 — see [LICENSE](./LICENSE).

---

## 🙏 Acknowledgments

- [Terax AI](https://terax.ai) — design inspiration
- [Tauri 2](https://tauri.app) — app framework
- [Vercel AI SDK](https://sdk.vercel.ai) — AI integration
- [xterm.js](https://xtermjs.org) — terminal emulator
- [CodeMirror 6](https://codemirror.net) — code editor
- [portable-pty](https://github.com/wez/wezterm) — PTY backend
