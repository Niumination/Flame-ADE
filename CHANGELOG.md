# Changelog

All notable changes to Flame ADE.

## [0.6.0] — 2026-05-22

### Phase 1 — Foundation ✅ (Completed)
- Scaffolded Tauri 2 + React 19 + Vite 7 project structure
- Configured TypeScript 5.7 with `@/*` path alias
- Set up Tailwind v4 with `@theme` config in `App.css`
- Installed pnpm, Rust 1.95.0 (x86_64-apple-darwin), Node 26
- Created `vite.config.ts` with Tauri-compatible build settings
- Created `tsconfig.json` + `tsconfig.node.json` with strict mode

### Rust Backend ✅ (Completed)
- `src-tauri/Cargo.toml` — Tauri 2, `portable-pty` 0.8, `uuid`, `dirs`, `keyring`, `walkdir`, `regex`
- `src-tauri/src/lib.rs` — Builder with plugins (shell, store, fs, dialog, updater) + 31 commands
- `src-tauri/src/main.rs` — Binary entry point calling `flame_ade_lib::run()`
- `src-tauri/src/build.rs` — Tauri build script
- `src-tauri/tauri.conf.json` — macOS overlay title bar, transparent window, min macOS 10.15
- `src-tauri/capabilities/default.json` — Tightened permissions (shell, store, dialog, updater only)
- Module structure: `pty/`, `fs/`, `shell/`, `secrets/`, `git/`

### PTY Backend ✅ (Completed)
- `src-tauri/src/modules/pty/mod.rs` — Full PTY implementation:
  - `PtyState` — session registry via `RwLock<HashMap<id, Session>>`
  - `pty_create` — opens PTY via `NativePtySystem`, spawns shell, starts read thread
  - `pty_write` — sends input to PTY writer
  - `pty_resize` — resizes PTY via `MasterPty::resize()`
  - `pty_close` — kills child process, removes session
- `src-tauri/src/modules/pty/scripts/zshenv.zsh` — zsh shell integration:
  - OSC 7 (cwd reporting)
  - OSC 133 A/B/C/D (prompt/command boundaries + exit code)
- `src-tauri/src/modules/pty/scripts/zshrc.zsh` — sources user's real zshrc via `FLAME_ADE_REAL_ZDOTDIR`
- `src-tauri/src/modules/pty/scripts/bashrc.bash` — bash shell integration

### Frontend ✅ (Completed)
- `src/main.tsx` — React 19 entry with StrictMode
- `src/App.tsx` — Root coordinator with TabBar + multi-tab layout
- `src/App.css` — Tailwind v4 `@theme` with dark mode colors
- `src/lib/utils.ts` — `cn()` utility with clsx

### Terminal Module ✅ (Completed)
- `TerminalStack.tsx` — Terminal component with loading state
- `pty-bridge.ts` — `usePtyBridge()` hook with invoke + event listeners
- `useTerminalSession.ts` — xterm.js session hook (WebGL + FitAddon)
- `osc-handlers.ts` — `parseOsc7()`, `parseOsc133()` parsers
- `themes.ts` — Tokyo Night, Nord, Default themes

### Tabs Module ✅ (Completed)
- `useTabs.ts` — Zustand store with `TabKind: terminal | editor | preview | ai-diff | git`
- `TabBar.tsx` — Tab bar UI with + button, close buttons, context menu
- moveTab, duplicateTab, closeOtherTabs, closeTabsToRight
- Emoji icons per tab kind

### Shell Integration ✅ (Completed)
- zsh init scripts with OSC 7 + OSC 133 via ZDOTDIR injection (runtime `/tmp` dir)
- bash init scripts with OSC 7 + OSC 133 via `--rcfile`
- Frontend OSC parsers (parseOsc7, parseOsc133)
- User's real zshrc/bashrc sourced via FLAME_ADE_REAL_ZDOTDIR

### File Explorer ✅ (Completed)
- Rust fs backend: read_tree, read_file, write_file, create_dir, delete, rename, exists
- fs_search (walkdir) + fs_grep (regex)
- React ExplorerPanel with file tree, expand/collapse, search, refresh
- File icons by extension (emoji-based)
- Integrated into App.tsx with toggle button

### Code Editor ✅ (Completed)
- CodeMirror 6 with basicSetup, line wrapping, indent with tab
- Language auto-detection: TS/TSX, JS/JSX, Rust, Python, JSON, Markdown, CSS, HTML
- One Dark theme
- File selection from Explorer opens editor in new tab

### Theme System ✅ (Completed)
- ThemeProvider context with dark/light/Tokyo Night/Nord themes
- CSS custom properties for dynamic theming
- useTheme() hook for consuming theme state

### Status Bar & Header ✅ (Completed)
- Header with app title, cwd display, explorer/AI toggle, preview/git tab buttons
- StatusBar with cwd breadcrumb and active tab kind indicator
- Cmd+I keyboard shortcut for AI panel

### AI Provider Config & Keychain ✅ (Completed)
- Vercel AI SDK v6 + @ai-sdk/openai/anthropic/google/groq/xai
- Multi-provider config (7 providers: OpenAI, Anthropic, Google, Groq, xAI, Cerebras, OpenAI-compatible)
- Rust keyring crate for OS keychain (secrets_set/get/delete)
- Provider factory for creating AI SDK provider instances

### AI Side Panel & Chat ✅ (Completed)
- Zustand chat store with session management (create, delete, navigate)
- Chat message CRUD per session
- Provider/model selector with API key input
- Chat UI with message bubbles, send input, loading state
- Session tabs for switching between conversations
- Skills integration (/explain, /fix, /test, /refactor, /docs)

### Agent System & Tools ✅ (Completed)
- Rust shell backend: shell_run_command, shell_session, shell_bg
- 11 AI tool definitions (4 auto-execute + 7 needs-approval)
- ApprovalDialog overlay with approve/reject buttons
- streamText-based agent runner with real-time streaming

### Message Streaming & Voice Input ✅ (Completed)
- Real-time message streaming with streamText async iteration
- VoiceInput component with Web Speech API (webkitSpeechRecognition)
- Keyboard shortcut and voice input in chat UI

### Web Preview ✅ (Completed)
- PreviewPanel with URL input bar, sandboxed iframe, loading/error states
- New preview tab button in header (🌐)

### Git Panel ✅ (Completed)
- Rust git backend: git_status, git_diff, git_log, git_add, git_commit, git_branches, git_checkout
- React GitPanel with three views: Changes, Log, Branches
- File staging with checkboxes, commit message input, diff viewer, branch switching
- New git tab button in header (⎇)

### Auto-Updater ✅ (Completed)
- tauri-plugin-updater configured (Cargo, lib.rs, capabilities)
- Release endpoint + CSP configured
- Minisign key pair generated for binary signing

### Security Hardening ✅
- Path sanitization in Rust fs module (canonicalize + deny-list)
- Frontend path validation in fs-bridge.ts
- Removed unnecessary Tauri fs plugin capabilities
- Removed unused `parking_lot` dependency
- Removed unused `id` field in PtySession (zero warnings)

### Performance Optimization ✅
- Lazy-loaded AiPanel, ExplorerPanel, GitPanel, PreviewPanel via React.lazy() + Suspense
- Memoized TabBar and StatusBar with React.memo()
- Editor's fs-bridge import uses dynamic import

### Cross-Platform Testing ✅
- Rust cargo check passes (macOS x86_64) — zero warnings
- TypeScript tsc --noEmit passes — zero errors
- Cargo.toml target-agnostic

### Release Preparation ✅
- Version bumped to 0.6.0 (package.json, Cargo.toml, tauri.conf.json)
- Minisign signing keys generated for binary verification
- CSP hardened with release endpoint allowlist
- Updater pubkey set inline
- README.md badge updated to 0.6.0
- SECURITY.md supported versions updated
- Engon verification skill created

### New: Engon Verification Skill 🛠
- Created `/engon` skill at `~/.config/opencode/skills/engon/SKILL.md`
- 4 sub-agents: engon-orchestrator, engon-explorer, engon-coder, engon-reviewer
- Verifies 6 areas: Rust structure, Frontend, Compilation, Tests, Docs, DevServer
- Registered as `/engon` command in opencode.json

## [0.1.0] — Prototype

### Added
- Initial project setup
- OpenCode configuration with 8 specialized agents
- Development workflow documentation
- Architecture documentation
- macOS Tahoe 26.5 compatibility focus
