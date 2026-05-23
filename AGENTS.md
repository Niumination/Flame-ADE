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
├── DESIGN.md                     # ✅ Interactive Design System
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
│   │   ├── ai/                   # ✅ AI subsystem
│   │   ├── shortcuts/            # ✅ Keyboard shortcuts
│   │   └── settings/             # ✅ Settings panel
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
- [x] Web preview (PreviewPanel, iframe sandbox, URL input, DevServerDetector)
- [x] Git panel (Rust git commands, React GitPanel with changes/log/branches views)
- [x] AI edit diffs (EditDiff component, side-by-side diff, per-hunk accept/reject)
- [x] Skills & slash commands (/explain, /fix, /test, /refactor, /docs)
- [x] Auto-updater (tauri-plugin-updater configured)
- [x] **theme/** — 11 themes (Tokyo Night, Nord, GitHub, Atom One, Aura, Copilot, Xcode, Dracula, Catppuccin, One Dark, Light + bg images)
- [x] **sidebar/** — SidebarRail with 6 SidebarViewId
- [x] **source-control/** — SourceControlPanel (virtualized, staging, commit)
- [x] **git-history/** — GitHistoryPane + GraphRail commit graph
- [x] **markdown/** — MarkdownPreviewPane + MarkdownStack
- [x] **updater/** — UpdaterBanner + updater store
- [x] **workspace/** — useWorkspacePanel + useWorkspace
- [x] **editor upgrade** — AiDiff, GitDiff, autocomplete, editor tabs
- [x] **explorer upgrade** — FileTree, SearchOverlay, rename, icons
- [x] **header upgrade** — InlineSearch, Breadcrumb
- [x] **statusbar upgrade** — CwdBreadcrumb, BranchIndicator
- [x] **tabs upgrade** — TabContextMenu, TabDnd, TerminalTabIndicator
- [x] **preview upgrade** — DevServerDetector

### Phase 3 — Frontend Infrastructure ✅
- [x] `src/lib/fonts.ts` — Nerd Font detection (JetBrains Mono + fallback chain)
- [x] `src/lib/platform.ts` — IS_MAC/IS_LINUX/IS_WINDOWS, MOD_KEY, custom window controls
- [x] `src/lib/launchDir.ts` — `initLaunchDir()` + `getLaunchDir()` via Rust `get_launch_dir` command
- [x] `src/main.tsx` — window-show pattern (hidden window → show after React render)
- [x] `src/styles/globals.css` — scrollbar styling, zoom support, base resets
- [x] Rust `get_launch_dir` command + `init_launch_cwd()` in setup

### Phase 5 — AI Subsystem Port ✅
- [x] All providers (OpenRouter, DeepSeek, Mistral, LM Studio, MLX, Ollama, + OpenCode Zen)
- [x] Inline AI autocomplete (useInlineCompletion)
- [x] Custom agents + sub-agents (registry + plan mode)
- [x] Bottom-docked AiInputBar + AiChat + AiMiniWindow
- [x] OpenCode Zen dual config (free + paid)
- [x] 24 tools (14 file + 6 shell + 4 AI)
- [x] Zustand stores (chatStore, approvalStore, agentsStore, agentStateMachine)
- [x] Components (AiPanel, AiChat, AiInputBar, ApprovalDialog, AgentStatusPill, AgentSwitcher, AiStatusBarControls, AiMiniWindow, AiDiffPanel, VoiceInput)

### Phase 5 — Polish ✅
- [x] Security hardening — path sanitization in Rust fs, frontend path validation, removed unnecessary capabilities, minisign signing keys
- [x] Performance optimization — lazy-load heavy components (AiPanel, ExplorerPanel, GitPanel, PreviewPanel), React.memo TabBar + StatusBar
- [x] Cross-platform testing — cargo check + tsc verify on macOS x86_64
- [x] Documentation finalized — all docs synced with code, milestone checklist updated
- [x] Release prep — version 1.0.0, CSP hardened, updater public key configured inline

### Phase 5 Enhancement — Rust Backend Port ✅
- [x] `net.rs` — SSRF-safe HTTP client with DNS rebinding protection (ai_http_request, ai_http_stream)
- [x] `proc.rs` — process utilities (hide_console for Windows)
- [x] `workspace.rs` — workspace authorization registry + commands
- [x] `secrets.rs` — single file with Linux file-based fallback (mode 0600) + secrets_get_all
- [x] `fs/` split — tree.rs, file.rs, mutate.rs, search.rs, grep.rs
- [x] `shell/` upgrade — session.rs, background.rs, ringbuffer.rs, SharedChild-based
- [x] `pty/` split — mod.rs, session.rs, shell_init.rs, commands.rs
- [x] Zero Rust warnings, zero TypeScript errors
- [x] 85 Rust tests + 50 TypeScript tests — all passing

### v0.6.1 — Critical Bugfixes 🔧
- [x] Fix `secrets_get` — returns actual password value instead of key name
- [x] Fix PTY race condition — `ensureListeners()` awaited before `bridge.create()`
- [x] Fix PTY listener leak — `Map<sessionId, callback>` routing replaces shared array
- [x] Fix OSC 7 cwd tracking — `parseOsc7()` called on incoming PTY data, updates `tab.cwd`
- [x] Fix CSP blocking preview iframes — `frame-src` added to CSP
- [x] Fix Preview `onUrlChange` not passed — `previewUrls` state + callback wired
- [x] New Settings module — theme, font size, AI provider config (⚙ button in header)
- [x] OpenCode Zen sebagai default AI provider — `opencode-zen` sebagai provider pertama di config, 12 models
- [x] Keyboard shortcuts registry — `src/modules/shortcuts/` dengan sistem shortcut terpusat
- [x] Theme expansion — +3 themes (Dracula, Catppuccin, One Dark) = 7 total
- [x] Interactive Design System — `DESIGN.md` komprehensif
- [x] 5 pre-existing Rust clippy warnings fixed
- [x] Zero Rust warnings, zero TypeScript errors

### v1.0.0 — Production Release 🚀
- [x] Version bump 0.6.1 → 1.0.0 across all config files
- [x] Full 6-area Engon verification: Rust backend ✅, Frontend modules ✅, Compilation ✅, Tests ✅, Documentation ✅, Dev server ✅
- [x] 50 TypeScript tests + 67 Rust tests — all passing
- [x] Zero Rust warnings (cargo clippy), zero TypeScript errors (tsc --noEmit)
- [x] All documentation synced and accurate
- [x] GitHub release v1.0.0 created with tag

### v1.1.0 — AI Subsystem Port & Phase 4-6 Completion 🚀
- [x] Phase 4 — All 13 modules ported (theme, sidebar, source-control, git-history, markdown, updater, workspace, editor/explorer/header/statusbar/tabs/preview upgrades)
- [x] Phase 5 — Full AI subsystem port (all 12+ providers, 24 tools, agents, stores, components)
- [x] Phase 6 — App.tsx full integration, UI components, WindowControls, design skills removed
- [x] PTY split — mod.rs → session.rs + shell_init.rs + commands.rs
- [x] 50 TypeScript tests + 85 Rust tests — all passing
- [x] Zero Rust warnings (cargo check), zero TypeScript errors (tsc --noEmit)

### v1.2.0 — Visual Polish & Auto-start 🎨
- [x] Fix: `App.css` not imported — Tailwind v4 `@theme` was never loaded
- [x] Fix: Dynamic theming broken — `applyTheme.ts` now sets dual CSS vars (`--color-{name}` + `--{name}`)
- [x] Improved default `@theme` — refined palette with depth hierarchy, indigo primary, sidebar tokens
- [x] Auto-start toggle — Settings → System → "Launch at login"
- [x] AgentStatusPill streaming indicator — wired to chatStore `isStreaming`
- [x] 50 TypeScript tests + 85 Rust tests — all passing
- [x] Zero Rust warnings, zero TypeScript errors

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
