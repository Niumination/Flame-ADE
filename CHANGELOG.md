# Changelog

All notable changes to Flame ADE.

## [0.6.1] — 2026-05-23

### Critical Bugfixes 🔧
- **Fix: secrets_get returns password value, not key name** (`secrets/mod.rs`) — `key: value` instead of `key: key.clone()`. API keys could never load or save.
- **Fix: PTY event race condition** (`pty-bridge.ts`) — `listen()` is now awaited via `ensureListeners()` before `bridge.create()` spawns the PTY, so no events are lost. Module-level listener leak fixed — per-session `Map<sessionId, callback>` routing instead of shared array that cleared all listeners on unmount.
- **Fix: OSC 7 cwd tracking wired** (`useTerminalSession.ts`, `TerminalStack.tsx`, `App.tsx`) — `parseOsc7()` now called on incoming PTY data; updates tab cwd in Zustand store via `useTabs.updateTab()`. Tab ID propagated from App → TerminalStack → useTerminalSession.
- **Fix: CSP blocks preview iframes** (`tauri.conf.json`) — added `frame-src 'self' http://localhost:* http://127.0.0.1:*` to CSP.
- **Fix: Preview onUrlChange not wired** (`App.tsx`) — `previewUrls` state + `onUrlChange` callback now passed to `PreviewPanel`.

### New Features ✨
- **Settings module** (`src/modules/settings/`) — Theme selector (dark/light/Tokyo Night/Nord), font size (12–20px), AI provider configuration. Accessible via ⚙ button in header or `settings` tab kind.
- **OpenCode Zen integration** (`config.ts`, `provider.ts`, `chatStore.ts`) — OpenCode Zen sebagai default AI provider. Auto-load API key dari keychain. Provider ID `opencode-zen`, base URL `https://opencode.ai/zen/v1`, 12 models (Claude Sonnet 4-5, GPT 5.x, Gemini 3, Big Pickle, free models). Users can bring their own OpenCode Zen API key.
- **Keyboard shortcuts registry** (`src/modules/shortcuts/`) — Sistem shortcut terpusat. Shortcuts: Cmd+I (AI), Cmd+E (explorer), Cmd+T (new terminal), Cmd+W (close tab), Cmd+1-9 (switch tab), Cmd+Shift+[/] (prev/next tab). Ditampilkan di Settings.
- **Theme expansion** — 3 new themes: Dracula, Catppuccin Mocha, One Dark (total 7 themes).
- **Interactive Design System** (`DESIGN.md`) — Comprehensive design document: color system, typography scale, spacing system, layout architecture, block model, AI integration patterns, motion system, accessibility, component tokens, implementation roadmap.

### Cleanup 🧹
- Fixed 5 pre-existing Rust clippy warnings: `manual_flatten`, `unnecessary_map_or`, 2× `unnecessary_cast`, `write_with_newline`.
- Fixed Rust `use tauri::Manager` import and `_app` → `app` rename.

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

### Bugfixes & Polish 🔧
- Fix: runtime panic in sort comparison function (violated total order when comparing file vs symlink)
- Remove: unused `parking_lot` dependency from Cargo.toml
- Remove: unused `id` field from PtySession struct
- Fix: README badge version 0.1.0 → 0.6.0
- Fix: SECURITY.md supported versions updated

### Test Infrastructure 🧪
- Setup vitest + @testing-library/react + jsdom
- `vitest.config.ts` configured with jsdom environment
- 2 TypeScript smoke tests passing (App.test.tsx)
- 6 Rust integration tests passing (module existence checks)
- Pre-configured for future test expansion

### shadcn/ui Primitive ✅
- Installed: @radix-ui/react-slot, class-variance-authority, tailwind-merge, lucide-react
- Created `src/components/ui/` directory
- Button component (with variants: default, destructive, outline, secondary, ghost, link)
- `components.json` configured for v4 compatibility
- All CSS variables already in App.css @theme

### Dev Server Verification ✅
- `pnpm tauri dev` confirmed working:
  - Vite 7.3.3 server on :1420 ✅
  - Rust compilation (debug) in ~14s ✅
  - App binary launches without errors ✅

### CI/CD Pipeline 🚀
- `.github/workflows/ci.yml` — CI workflow on push/PR:
  - TypeScript type check (`tsc --noEmit`)
  - Vitest test runner (`pnpm test`)
  - Rust cargo check + clippy (0 warnings enforced)
  - Rust cargo test (67 tests)
  - Tauri build (macOS + Linux x86_64)
- `.github/workflows/release.yml` — Release workflow on tag push `v*`:
  - Build matrix: macOS x86_64 + Linux x86_64
  - Minisign signing of all bundle artifacts
  - Upload artifacts + GitHub Release (draft, auto-generated notes from CHANGELOG)
- PNPM lockfile verified (151KB, 52 packages)

### Rust Test Expansion 🧪 (67 total → 50 unit + 17 integration)
- **Unit tests**: sanitize_path (deny-list, case, roundtrip), sort ordering (dir/symlink/file), fs CRUD roundtrips, git serialization + commands, pty structs + scripts, secrets serialization, shell state + timeout
- **Integration tests**: all module files, config files, frontend entry points, pty script content verification

### Documentation Finalization 📚
- README completely rewritten with feature tables, architecture diagram, badge bar, keyboard shortcuts, test commands, config guide, bundle targets, and full doc index
- SECURITY.md fully updated — all 24 checklist items checked and detailed, vulnerability reporting process, audit commands
- CONTRIBUTING.md expanded — branching strategy, code standards per language, testing guidelines, security considerations, project structure reference
- LICENSE file added (Apache-2.0 full text)

### TypeScript Test Expansion 🧪 (52 tests — 5 test files)
- **cn() utility** (6 tests) — class merging, falsy filtering, edge cases
- **useTabs store** (20 tests) — add, remove, setActive, update, move, duplicate, closeOther, closeTabsToRight, icons, edge cases
- **TabBar component** (12 tests) — rendering, tab click, add/remove, context menu (duplicate, close other, close all, close), outside click dismiss
- **ThemeProvider + useTheme** (12 tests) — dark default, theme switch, isDark detection, invalid theme, CSS variables, themes object validation

### Design Skills — Integrated from Owl-Listener/designer-skills 🎨
- Added 3 compiled opencode skills: `ui-design` (14 sub-skills), `design-systems` (11 sub-skills), `visual-critique` (4 sub-skills)
- Added 3 read-only design sub-agents: `@ui-designer`, `@design-system-engineer`, `@visual-critic` (free tier models)
- Added `/design` command — design workflow coordinator
- Skills use compiled format from `.gemini/extensions/` — only 3 entries in system prompt (not 29 individual)
- Architecture: hybrid approach — start with 3 priority skills, 6 more ready for future expansion

## [0.1.0] — Prototype

### Added
- Initial project setup
- OpenCode configuration with 8 specialized agents
- Development workflow documentation
- Architecture documentation
- macOS Tahoe 26.5 compatibility focus
