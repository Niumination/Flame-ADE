# Flame ADE — Project Context

Flame ADE is an open-source AI-native terminal emulator (ADE — Agentic Development Environment) built with Tauri 2, Rust, and React 19. It is designed to be lightweight (~7MB), cross-platform, with **primary focus on macOS Tahoe 26.5 compatibility**.

## System Context
- **Development OS**: Hackintosh macOS Tahoe 26.5
- **Hardware**: ThinkPad X13 Yoga Gen 1, Intel Core i5-10310U
- **Shell**: zsh
- **Package Manager**: pnpm
- **Rust**: 1.95.0 (x86_64-apple-darwin)
- **Node**: 26.0.0

## Tech Stack
- **Backend**: Rust (Tauri 2), `portable-pty` 0.8
- **Frontend**: React 19, TypeScript 5.7, Vite 7
- **Terminal**: @xterm/xterm 6 + @xterm/addon-webgl + @xterm/addon-fit
- **Editor**: CodeMirror 6
- **AI**: Vercel AI SDK v6
- **UI**: Tailwind v4, shadcn/ui, motion (pending)
- **State**: Zustand 5

## Project Structure
```
flame-ade/
├── src/                          # React frontend
│   ├── modules/
│   │   ├── git/                   # ✅ Git panel
│   │   ├── preview/               # ✅ Web preview
│   │   ├── terminal/             # ✅ xterm.js terminal
│   │   ├── tabs/                 # ✅ Tab management
│   │   ├── explorer/             # ✅ File explorer
│   │   ├── editor/               # ✅ Code editor
│   │   ├── theme/                # ✅ Theme system
│   │   ├── header/               # ✅ Top bar
│   │   ├── statusbar/            # ✅ Bottom bar
│   │   └── ai/                   # ✅ AI subsystem
│   ├── components/
│   │   └── ui/                   # ✅ shadcn/ui primitives (Button)
│   ├── test/                     # ✅ Vitest setup + smoke tests
│   ├── lib/
│   │   └── utils.ts              # ✅ cn() utility
│   ├── App.tsx                   # ✅ Root coordinator
│   ├── App.css                   # ✅ Tailwind v4 @theme
│   └── main.tsx                  # ✅ React entry
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── lib.rs                # ✅ Main entry + plugin setup
│   │   ├── main.rs               # ✅ Binary entry
│   │   └── modules/
│   │       ├── mod.rs            # ✅ Module registry
│   │       ├── pty/              # ✅ PTY implementation
│   │       ├── fs/               # ✅ File system commands
│   │       ├── shell/            # ✅ Shell commands
│   │       ├── git/              # ✅ Git commands
│   │       └── secrets/          # ✅ Keychain
│   ├── tests/                    # ✅ Rust integration tests
│   ├── capabilities/
│   │   └── default.json          # ✅ Permissions
│   ├── Cargo.toml                # ✅ Dependencies
│   ├── tauri.conf.json           # ✅ Window + bundle config
│   └── build.rs                  # ✅ Tauri build script
├── vitest.config.ts              # ✅ Vitest config
├── components.json               # ✅ shadcn/ui config
├── package.json                  # ✅ Dependencies + scripts
├── vite.config.ts                # ✅ Vite + alias config
└── opencode.json                 # ✅ OpenCode config

## Implementation Status

### Phase 1 — Foundation ✅ COMPLETE
- [x] Tauri 2 + React 19 + Vite 7 scaffolding
- [x] Rust backend structure (pty, fs, shell, secrets modules)
- [x] PTY backend (portable-pty, session management, event streaming)
- [x] xterm.js terminal (WebGL renderer, TerminalStack, useTerminalSession)
- [x] Multi-tab support (Zustand store, hidden tabs, tab switching)
- [x] Window management (titleBarStyle overlay, transparent window)
- [x] macOS Tahoe 26.5 compatibility (Intel x86_64 compile)

### Phase 2 — Core Features ✅ COMPLETE
- [x] Shell integration (OSC 7 + OSC 133, zsh/bash init scripts)
- [x] File explorer (fs tree, mutations, fuzzy search)
- [x] Code editor (CodeMirror 6, language modes, themes)
- [x] Tab management polish (move, duplicate, context menu)
- [x] Theme system (Tailwind v4 @theme, multiple themes)
- [x] Status bar (CwdBreadcrumb, tab info) & Header (explorer/AI toggle)

### Phase 3 — AI Integration ✅ COMPLETE
- [x] Vercel AI SDK v6 + multi-provider config
- [x] BYOK keychain (Rust keyring crate, secrets commands)
- [x] AI side panel (chat UI, session management, provider settings)
- [x] Zustand chat store with session persistence
- [x] Agent & sub-agent system with tools
- [x] Approval flow for dangerous operations
- [x] Voice input
- [x] Full message streaming with Vercel AI SDK

### Phase 4 — Advanced Features ✅
- [x] Web preview (PreviewPanel, iframe sandbox, URL input)
- [x] Git panel (Rust git commands, React GitPanel with changes/log/branches views)
- [x] AI edit diffs (EditDiff component, side-by-side diff, per-hunk accept/reject)
- [x] Skills & slash commands (/explain, /fix, /test, /refactor, /docs)
- [x] Auto-updater (tauri-plugin-updater configured)

### Phase 5 — Polish ✅
- [x] Security hardening — path sanitization in Rust fs, frontend path validation, removed unnecessary capabilities, minisign signing keys
- [x] Performance optimization — lazy-load heavy components (AiPanel, ExplorerPanel, GitPanel, PreviewPanel), React.memo TabBar + StatusBar
- [x] Cross-platform testing — cargo check + tsc verify on macOS x86_64
- [x] Documentation finalized — all docs synced with code, milestone checklist updated
- [x] Release prep — version 0.6.0, CSP hardened, updater public key configured inline

### Post-Phase 5 Polish 🎯
- [x] Git init + first commit (100 files)
- [x] Fix runtime panic in sort comparator (total order violation)
- [x] Test infrastructure: vitest + @testing-library (2 smoke tests ✅)
- [x] Rust integration tests (6 module existence tests ✅)
- [x] shadcn/ui primitives installed (@radix-ui/react-slot, Button component)
- [x] `pnpm tauri dev` verified — compiles + launches without errors
- [x] `pnpm tauri build` — compiles successfully (full release build takes ~5m)
- [x] Zero Rust warnings, zero TypeScript errors
- [x] Engon verification skill created
- [x] Rust test coverage: 67 tests (50 unit + 17 integration) ✅
- [x] TypeScript test coverage: 52 tests (5 files) ✅
- [x] CI/CD workflows: CI (push/PR) + Release (tag v*) ✅

## Key Decisions
1. **macOS Tahoe first** — test and optimize for macOS 26.5 before other platforms
2. **Intel Mac optimized** — ensure smooth performance on 10th gen Intel CPUs
3. **Two-process model** — Rust backend owns OS access, React webview communicates via IPC
4. **BYOK AI** — users bring their own API keys, stored in OS keychain
5. **No telemetry** — privacy-first, no account required
6. **Tabs hidden not unmounted** — `invisible pointer-events-none` to keep PTYs alive

## Development Commands
```bash
pnpm install                    # Install dependencies
pnpm tauri dev                  # Development mode (Vite + Tauri)
pnpm tauri build                # Production build
pnpm exec tsc --noEmit          # TypeScript type check
cd src-tauri && cargo check     # Rust compilation check
cd src-tauri && cargo clippy    # Rust lint
pnpm test                       # Run tests (vitest)
```

## Build Verification
- `cargo check` — ✅ passes (0 warnings — fixed unused `id` field, removed unused `parking_lot`)
- `tsc --noEmit` — ✅ passes (0 errors)
- `pnpm tauri dev` — ✅ launches successfully

## AI Provider
- **Primary**: OpenCode Zen
- **Models**: Claude Sonnet 4-5 (main), Claude Haiku 4-5 (lightweight tasks)

## Rules
- Follow existing code conventions from Terax AI as reference
- Always test on macOS Tahoe 26.5
- Keep binary size under 10MB
- No telemetry, no analytics
- API keys only in OS keychain, never in localStorage or disk
- Security-first: path guards, SSRF protection, sandboxed preview
- **After each task**: run type checks, update CHANGELOG.md, update this file
