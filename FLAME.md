# FLAME.md

Flame ADE loads `FLAME.md` from the workspace root as agent memory. This file documents the project's architecture, patch system, and differences from the upstream reference (Terax AI).

---

## Project Identity

- **Name**: Flame ADE
- **Bundle ID**: `app.flame.ade`
- **Upstream Reference**: Terax AI v0.7.1 (`https://github.com/crynta/terax-ai`)
- **Tech Stack**: Tauri 2, Rust (`portable-pty 0.9`), React 19, TypeScript, xterm.js (WebGL), CodeMirror 6, Vercel AI SDK v6, Tailwind v4, shadcn/ui (radix-luma), Zustand
- **Primary Platform**: macOS Tahoe 26.5 (Hackintosh, Intel Core i5-10310U)
- **Package Manager**: pnpm

---

## Patch System

### Policy
Flame ADE is a fork of Terax AI with specific modifications. To simplify syncing upstream changes, all deviations from Terax are documented below. When porting a new Terax version, check this table first.

### Perubahan dari Terax AI v0.7.1

| # | File / Location | Perubahan | Alasan | Tanggal |
|---|---|---|---|---|
| P1 | `src-tauri/tauri.conf.json` | `identifier: "app.flame.ade"` | Brand identity | 2026-05-23 |
| P1 | `src-tauri/Cargo.toml` | `name: "flame-ade"`, `lib.name: "flame_ade_lib"` | Brand identity | 2026-05-23 |
| P1 | `package.json` | `name: "flame-ade"` | Brand identity | 2026-05-23 |
| P2 | `src/modules/ai/config.ts` | Dual default AI provider: OpenCode Zen (free) + OpenAI/Anthropic (paid) | BYOK flexibility + free tier | Phase 5 |
| P3 | `src/modules/ai/config.ts` | OpenCode Zen provider dengan 12 model | Default AI provider | Phase 5 |
| P4 | — | **Tidak ada**: `tauri.linux.conf.json`, `tauri.windows.conf.json` | macOS Tahoe first — skip Linux/Windows custom titlebar | Selamanya |
| P5 | — | **Tidak ada**: Windows ConPTY Job Object (`pty/job.rs`) | Skip Windows-specific features | Selamanya |
| P6 | — | **Tidak ada**: WSL integration (`workspace.rs` WSL commands) | Skip Windows-specific features | Selamanya |
| P7 | — | **Tidak ada**: Design skills (`/design`, `ui-design`, dll) | Fitur ini milik OpenCode utama, bukan Flame ADE | 2026-05-23 |
| P8 | `src-tauri/tauri.conf.json` | `macOS.minimumSystemVersion: "13.0"` (Terax: 13.0, Flame asli: 10.15) | macOS Tahoe optimization | 2026-05-23 |
| P9 | `src-tauri/Cargo.toml` | `dirs = "6"` (Terax: `dirs = "5"`) | API kompatibel, versi lebih baru | 2026-05-23 |
| P10 | `src-tauri/Cargo.toml` | Retain `tauri-plugin-shell`, `tauri-plugin-fs`, `tauri-plugin-dialog` (Terax tidak punya) | Legacy — akan dihapus setelah full port | 2026-05-23 |
| P11 | `src-tauri/src/modules/terminal/` | **Tidak ada**: Rust native terminal launcher module | Flame ADE menggunakan embedded xterm.js, bukan native terminal | 2026-05-23 |
| P12 | `src/modules/terminal/lib/useTerminalPrefs.ts` | Simple store tanpa native app list (Terax: full native terminal app integration) | No native terminal launcher | 2026-05-23 |
| P13 | `src-tauri/src/modules/pty/` | Split `mod.rs` → `mod.rs` + `session.rs` + `shell_init.rs` + `commands.rs` | Struktur modular, selaras dengan `fs/` dan `shell/` | 2026-05-23 |
| P14 | `src/modules/theme/applyTheme.ts` | Dual CSS vars: set both `--color-{name}` (Tailwind v4) + `--{name}` (CodeMirror/legacy) | Terax AI menggunakan CSS vars `--{name}`, Tailwind v4 membutuhkan `--color-{name}` — keduanya harus di-set agar komponen shadcn/ui + CodeMirror bereaksi ke theme switch | 2026-05-24 |
| P15 | `src/modules/settings/SettingsPanel.tsx` | Auto-start toggle (Launch at login) | Terax AI belum punya feature ini | 2026-05-24 |
| P16 | `src/modules/ai/store/chatStore.ts`, `agent-runner.ts`, `AgentStatusPill.tsx` | AgentStatusPill `isStreaming` wiring — read from chatStore instead of hardcoded false | Fitur baru, tidak ada di Terax AI — streaming state sebelumnya hardcoded | 2026-05-24 |
| P17 | `src/App.css` | Improved default `@theme` palette — depth hierarchy, indigo primary, semi-transparent borders, sidebar tokens | Default styling Terax AI juga flat, tapi kita upgrade biar lebih refined sebagai stand-alone project | 2026-05-24 |

### Catatan Migrasi
- **P4-P6**: Jika suatu saat Flame ADE di-port ke Linux/Windows, referensi dari Terax ada di file platform-specific.
- **P7**: Design skills sudah dihapus dari codebase. Jangan di-restore.
- **P10**: Plugin legacy akan dihapus secara bertahap seiring porting code.
- **P11-P12**: Native terminal launcher dihapus karena Flame ADE menggunakan embedded xterm.js.
- **P13**: PTY module di-split mengikuti pola modular `fs/` dan `shell/`.
- **P14**: Saat porting Terax baru, pastikan `applyTheme.ts` tetap set dual format `--color-{name}` + `--{name}`.
- **P15-P16**: Fitur original Flame ADE (auto-start, streaming pill). Tidak ada di Terax — jangan dihapus saat merge.
- **P17**: Default theme adalah palette Flame ADE sendiri, bukan copy dari Terax.

---

## Restoration Master Plan

### Phase 0 — Foundation & CI Fix ✅
- [x] `package.json` — `pnpm.onlyBuiltDependencies: ["esbuild"]`
- [x] Sync npm dependencies dengan Terax
- [x] Sync Cargo dependencies dengan Terax
- [x] Update `tauri.conf.json` (CSP, visible: false, plugins)
- [x] Update `capabilities/default.json`
- [x] Update `vite.config.ts` (multi-entry + chunking)
- [x] Update `components.json` (radix-luma, mist, hugeicons)
- [x] Update CI workflows
- [x] `settings.html` — placeholder
- [x] `FLAME.md` — patch system documentation

### Phase 1 — Terminal Restoration ✅
- [x] Rollback native terminal launcher
- [x] Restore xterm.js embedded terminal
- [x] Update App.tsx integration
- [x] Hapus `terminal/mod.rs` Rust native launcher
- [x] Recreate useTerminalPrefs.ts (no native apps)
- [x] Fix Rust module references (mod.rs, lib.rs)
- [x] Verify: cargo check ✅, tsc --noEmit ✅, pnpm test 52/52 ✅

### Phase 2 — Rust Backend Port ✅
- [x] Port `workspace.rs` (authorization, WSL skip)
- [x] Port `net.rs` (SSRF-safe HTTP, DNS rebinding protection)
- [x] Port `proc.rs` (process utilities, hide_console)
- [x] Upgrade `shell/` — split into mod.rs + session.rs + background.rs + ringbuffer.rs
- [x] Upgrade `git/` — commands registered unchanged
- [x] Upgrade `secrets.rs` — single file with Linux file-based fallback (mode 0600)
- [x] Upgrade `fs/` — split into tree.rs + file.rs + mutate.rs + search.rs + grep.rs
- [x] Update `mod.rs` + `lib.rs` — register net, proc, workspace, secrets_get_all
- [x] Zero cargo warnings, zero clippy warnings
- [x] Verify: cargo test 84/84 ✅, tsc --noEmit ✅, pnpm test 52/52 ✅
- [x] Upgrade `pty/` — split into mod.rs + session.rs + shell_init.rs + commands.rs ✅

### Phase 3 — Frontend Infrastructure ✅
- [x] `src/lib/fonts.ts` — Nerd Font detection (JetBrains Mono + fallback chain)
- [x] `src/lib/platform.ts` — IS_MAC/IS_LINUX/IS_WINDOWS, MOD_KEY, custom window controls
- [x] `src/lib/launchDir.ts` — `initLaunchDir()` + `getLaunchDir()` via Rust `get_launch_dir` command
- [x] `src/main.tsx` — window-show pattern (hidden window → show after React render)
- [x] `src/styles/globals.css` — scrollbar styling, zoom support, base resets
- [x] Rust `get_launch_dir` command + `init_launch_cwd()` in setup
- [x] `src/App.tsx` — port from Terax ✅
- [x] `src/components/` — WindowControls, ai-elements, ui primitives ✅
- [ ] `src/settings/` — full settings SPA (deferred)

### Phase 4 — Core Modules Port ✅
- [x] `theme/` — 11 themes, background images, custom themes ✅
- [x] `sidebar/` — SidebarRail (SidebarViewId, Terax port) ✅
- [x] `source-control/` — SourceControlPanel + useSourceControl + useSourceControlPanel ✅
- [x] `git-history/` — GitHistoryPane + GitHistoryStack + GraphRail + commit graph ✅
- [x] `markdown/` — MarkdownPreviewPane + MarkdownStack ✅
- [x] `updater/` — UpdaterBanner + updater store ✅
- [x] `workspace/` — useWorkspacePanel + useWorkspace ✅
- [x] Upgrade `editor/` — autocomplete, AiDiff, GitDiffManager, editor tabs ✅
- [x] Upgrade `explorer/` — FileTree, SearchOverlay, inline rename, icons ✅
- [x] Upgrade `header/` — Header + InlineSearch + Breadcrumb ✅
- [x] Upgrade `statusbar/` — StatusBar + CwdBreadcrumb + BranchIndicator ✅
- [x] Upgrade `tabs/` — TabBar + TabContextMenu + TabDnd + TerminalTabIndicator ✅
- [x] Upgrade `preview/` — PreviewPanel + DevServerDetector ✅

### Phase 5 — AI Subsystem Port ✅
- [x] All providers (OpenRouter, DeepSeek, Mistral, LM Studio, MLX, Ollama, + OpenCode Zen) ✅
- [x] Inline AI autocomplete (useInlineCompletion) ✅
- [x] Custom agents + sub-agents (registry + plan mode) ✅
- [x] Bottom-docked AiInputBar + AiChat + AiMiniWindow ✅
- [x] OpenCode Zen dual config (free + paid) ✅
- [x] Full tool set (context, edit, fs, search, shell, subagent, terminal, todo, read, write) ✅
- [x] 14 file tools + 6 shell tools + 4 AI tools = 24 tools total ✅
- [x] Zustand stores (chatStore, approvalStore, agentsStore, agentStateMachine) ✅
- [x] Components (AiPanel, AiChat, AiInputBar, ApprovalDialog, AgentStatusPill, AgentSwitcher, AiStatusBarControls, AiMiniWindow, AiDiffPanel) ✅

### Phase 6 — Integration & Polish ✅
- [x] App.tsx full integration (terminal, editor, explorer, preview, markdown, settings tabs + sidebar rail + AiPanel) ✅
- [x] Hapus design skills references (P7) ✅
- [x] UI components (ai-elements: markdown-code, EditDiff, UnifiedDiff, SquiggleUnderline + 20+ shadcn/ui primitives) ✅
- [x] WindowControls (macOS traffic lights overlay) ✅
- [x] Auto-start toggle — Settings → System ✅
- [x] AgentStatusPill isStreaming — wired to chatStore ✅
- [ ] macOS Tahoe testing (PENDING)
- [ ] Window state persistence (PENDING)

### Phase 7 — Documentation & Verification ✅
- [x] Full `FLAME.md` patch table (P1–P13) ✅
- [x] Engon verification: cargo check ✅ (0 warnings), tsc --noEmit ✅ (0 errors), pnpm test ✅ (50/50), cargo test ✅ (85/85) ✅

---

## Development System

- **OS**: Hackintosh macOS Tahoe 26.5
- **Hardware**: ThinkPad X13 Yoga Gen 1, Intel Core i5-10310U
- **Shell**: zsh
- **AI Provider**: OpenCode Zen

## Commands

```bash
pnpm install                    # Install dependencies
pnpm tauri dev                  # Development mode
pnpm tauri build                # Production build
pnpm exec tsc --noEmit          # TypeScript type check
cd src-tauri && cargo check     # Rust compilation check
cd src-tauri && cargo clippy    # Rust lint
pnpm test                       # Run tests (vitest)
```

## Architecture

### Two-Process Model
```
+-----------------------------------------+
|           Webview (React 19)            |
|  Terminal  |  Editor  |  Explorer  | AI |
+----------------------+------------------+
                       | invoke() / Channel
+----------------------+------------------+
|          Rust Backend (Tauri 2)         |
|  PTY | FS | Git | Shell | Secrets | Net |
+-----------------------------------------+
```

### Rust Backend Modules
- `pty` — PTY session management (portable-pty 0.9, split: mod.rs + session.rs + shell_init.rs + commands.rs)
- `fs` — Filesystem operations (tree, file, mutate, search, grep)
- `shell` — One-shot + persistent agent shell + background processes
- `git` — Full git operations (status, diff, stage, commit, log, branches, push)
- `secrets` — OS keychain (keyring crate)
- `net` — SSRF-safe HTTP client for AI providers
- `proc` — Process utilities
- `workspace` — Workspace authorization and management

### Frontend Modules
- `terminal/` — xterm.js with WebGL, multi-pane, OSC 7/133
- `editor/` — CodeMirror 6, AI autocomplete, diff stacks
- `explorer/` — File tree, fuzzy search, context actions
- `sidebar/` — Sidebar rail (explorer/source-control toggle)
- `source-control/` — Git source control panel
- `git-history/` — Commit graph with lane rendering
- `preview/` — Web preview (iframe, dev-server detection)
- `markdown/` — Markdown preview
- `ai/` — Full AI subsystem (agents, tools, sessions, composer)
- `header/` — Top bar with inline search
- `statusbar/` — Bottom bar with cwd, AI status, workspace env
- `tabs/` — Tab management (multi-pane per tab)
- `theme/` — Theme system (11 themes, background images)
- `settings/` — Settings window (separate SPA)
- `shortcuts/` — Keyboard shortcuts registry
- `updater/` — Auto-updater UI
- `workspace/` — Workspace environment (WSL support)

### AI Subsystem
- BYOK multi-provider (OpenAI, Anthropic, Google, Groq, xAI, Cerebras, OpenRouter, DeepSeek, Mistral, OpenAI-compatible, OpenCode Zen)
- Local/offline (LM Studio, MLX, Ollama)
- Agentic workflow with tools, sub-agents, plan mode
- Dual default: OpenCode Zen (free) + OpenAI/Anthropic (paid)
- Key storage: OS keychain only
