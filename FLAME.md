# FLAME.md

Flame ADE loads `FLAME.md` from the workspace root as agent memory (similar to AGENTS.md / CLAUDE.md / TERAX.md). This file is the project's living architecture doc — read it before making changes.

## Project

**Flame ADE** — open-source AI-native terminal emulator. Tauri 2 + Rust (`portable-pty`) backend, React 19 + TypeScript + xterm.js (webgl) client, BYOK AI via Vercel AI SDK v6.

- Bundle id: `app.flame.ade`
- Package manager: **pnpm**
- Platforms: macOS (Tahoe 26.5 primary), Linux, Windows
- Frontend type-check: `pnpm exec tsc --noEmit`
- Rust checks: `cd src-tauri && cargo check && cargo clippy`

## Development System

- **OS**: Hackintosh macOS Tahoe 26.5
- **Hardware**: ThinkPad X13 Yoga Gen 1, Intel Core i5-10310U
- **Shell**: zsh
- **AI Provider**: OpenCode Zen

## Implementation Status

### Phase 1 — Foundation ✅ COMPLETE
All 7 tasks done. Terminal works with multi-tab, PTY backend, shell integration.

### Phase 2 — Core Features ✅ COMPLETE
- Shell integration (OSC 7/133) ✅
- File explorer ✅
- Code editor ✅
- Tab polish ✅
- Theme system ✅
- Status bar & header ✅

### Phase 3 — AI Integration ✅ COMPLETE
- AI deps + provider config ✅
- BYOK keychain ✅
- AI side panel + chat UI ✅
- Zustand chat store ✅
- Agent + tools ✅
- Message streaming + voice input ✅
### Phase 4 — Advanced Features ✅ COMPLETE
- Web Preview ✅
- Git Panel ✅
- AI Edit Diffs ✅
- Skills & Slash Commands ✅
- Auto-updater ✅
### Phase 5 — Polish ✅ COMPLETE
- Security hardening ✅ — path sanitization (canonicalize + deny-list), frontend validation, capabilities tightened
- Performance optimization ✅ — React.lazy() heavy components, React.memo() static components
- Cross-platform testing ✅ — cargo check + tsc verify on macOS x86_64
- Documentation ✅ — all docs synced with implementation
- Release prep ✅ — bumped to 0.6.0, minisign keys, CSP hardened

### Post-Phase 5 🎯
- Git init + first commit ✅
- Runtime sort panic fixed ✅
- Test infrastructure (vitest + cargo test) ✅
- shadcn/ui primitives installed (Button) ✅
- pnpm tauri dev verified ✅
- Zero Rust warnings, zero TS errors ✅
- Engon verification skill created ✅

## Architecture

### Two-process model

**Rust (`src-tauri/`)** owns all OS access. The webview never touches the FS, processes, or shells directly — everything goes through `invoke()` calls to commands registered in `src-tauri/src/lib.rs`:

- `pty::pty_*` — long-lived interactive PTY sessions (xterm ↔ portable-pty), managed by `PtyState` (`RwLock<HashMap<id, Session>>`). Output streams via a Tauri `Channel<PtyEvent>`.
- `fs::tree::*`, `fs::file::*`, `fs::mutate::*` — file explorer + editor IO.
- `fs::search::*`, `fs::grep::*` — fuzzy file finder + content search (powered by `walkdir` + `regex` crates).
- `shell::shell_run_command` — **one-shot** subshell exec used by AI tools. Distinct from PTY sessions; not the user's interactive terminal.
- `shell::shell_session_*` — persistent agent shell with state across calls.
- `shell::shell_bg_*` — long-running background processes (dev servers etc.) with bounded ring-buffer log capture.
- `secrets::secrets_*` — OS keychain via the `keyring` crate. Service constant `flame-ade`.

### PTY shell integration

PTY shells are bootstrapped via injected init scripts in `src-tauri/src/modules/pty/scripts/`:

- **Unix** (`zshenv.zsh`, `zshrc.zsh`, `bashrc.bash`) — installed via `ZDOTDIR` (zsh) or `--rcfile` (bash). Emit OSC 7 (cwd) and OSC 133 A/B/C/D (prompt boundaries + exit code) so the host can track cwd and detect command boundaries without re-parsing the prompt.
- **macOS Tahoe**: test thoroughly with Tahoe's default zsh configuration. Ensure OSC escape sequences are handled correctly.

### Frontend (`src/`)

Single-window React app. Path alias `@/*` → `src/*`. Tabs are tagged-union (`{ kind: "terminal" | "editor" | "preview" | "ai-diff" | "git", … }`) and **not** unmounted on switch — they're hidden via `invisible pointer-events-none` so PTYs and dev servers keep streaming in the background.

`App.tsx` wires modules together — keep it a coordinator. New features go inside the appropriate `modules/<area>/`.

### Module layout (`src/modules/`)

Each module is self-contained, exports a thin barrel via `index.ts`, and owns its hooks under `lib/`.

- **terminal/** — `TerminalStack` keeps one mounted xterm per tab via `useTerminalSession` + `pty-bridge`. `osc-handlers.ts` parses OSC 7 and OSC 133 markers. Themes in `themes.ts`.
- **editor/** — CodeMirror 6 stack (`EditorStack` mirrors `TerminalStack`). `extensions.ts` configures language modes; supports vim mode and prebuilt themes.
- **explorer/** — file tree with Material/Catppuccin icons, fuzzy search, keyboard nav, inline rename, context actions.
- **preview/** — auto-detected dev-server preview tab.
- **git/** — Git panel with Changes/Log/Branches views.
- **tabs/** — `useTabs` is the source of truth for tab list + active id. `useWorkspaceCwd` derives explorer root + inherited cwd for new tabs.
- **header/** — top bar + inline search.
- **statusbar/** — bottom bar, `CwdBreadcrumb`, AI tools indicator.
- **shortcuts/** — keymap registry + `useGlobalShortcuts`.
- **settings/** — settings store, preferences hook, settings window opener.
- **ai/** — see below.

### AI subsystem (`src/modules/ai/`)

BYOK. Multi-provider via `@ai-sdk/*`: **OpenAI, Anthropic, Google, Groq, xAI, Cerebras, OpenAI-compatible** (LM Studio for local/offline).

- **Key storage**: OS keychain via `keyring` (Rust). Frontend reads/writes through `secrets_*` commands. Service `KEYRING_SERVICE = "flame-ade"`. Never persist keys to disk, settings store, or `localStorage`.
- **Agent** (`lib/agent-runner.ts`): `streamText` with tool interception, approval flow, and real-time streaming.
- **Sub-agents** (`agents/registry.ts`, `agents/runSubagent.ts`): named sub-agents with their own system prompts and tool subsets.
- **Sessions** (`lib/sessions.ts` + `store/chatStore.ts`): conversations organized into named sessions, persisted via `tauri-plugin-store`.
- **Composer** (`lib/composer.tsx`): React context providing shared input state for both docked `AiInputBar` and any other surface.
- **Voice input**: streamed transcription pipeline via Web Speech API.
- **Live context bridge**: `App.tsx` calls `setLive({ getCwd, getTerminalContext, … })` so tools can read the *currently active* terminal's cwd + last 300 lines of buffer.
- **Tools** (`tools/tools.ts`): `read_file`, `list_directory`, `fs_search`, `fs_grep` auto-execute. `write_file`, `create_directory`, `rename`, `delete`, `run_command`, `shell_session_run`, `shell_bg_spawn` set `needsApproval: true`. `lib/security.ts` is a deny-list refusing obvious secret paths.
- **Edit diffs**: AI-proposed edits open in a side-by-side diff tab; user accepts/rejects per hunk before the write tool actually runs.
- **Skills / snippets**: slash command registry (`/explain`, `/fix`, `/test`, `/refactor`, `/docs`) in `lib/skills.ts`, auto-prepends prompts before agent invocation.

### UI conventions

- **shadcn/ui** configured via `components.json`. Primitives in `src/components/ui/` — don't hand-edit; re-run `pnpm dlx shadcn add` to upgrade.
- **AI Elements** (Vercel) in `src/components/ai-elements/` from the `@ai-elements` registry.
- **Tailwind v4** — no `tailwind.config.*`, config is in `src/App.css` via `@theme`. Use `cn()` from `@/lib/utils`.
- Animation: `motion` (Framer Motion successor). Resizable layout: `react-resizable-panels`.
- Path imports: always `@/…`, never relative across modules.
- Cross-platform paths: normalize separators with `.split(/[\\/]/)`.
- Canonical path form on the frontend is **forward-slash**.

### Window styling

- macOS: `titleBarStyle: Overlay` + `hiddenTitle: true` in `tauri.conf.json` (native traffic lights via overlay).
- Test thoroughly on macOS Tahoe 26.5 for any rendering issues.

### Tauri capabilities

`src-tauri/capabilities/default.json` is the allowlist for plugin APIs available to the webview. New plugins typically need:
1. `Cargo.toml` dependency
2. `.plugin(...)` call in `lib.rs` `run()`
3. capability entry in `default.json`

### Cross-platform conventions

- HOME / cache dirs: use the `dirs` crate (`dirs::home_dir()`, `dirs::cache_dir()`), never raw `$HOME`.
- Shell init scripts: gate Unix-only logic behind `#[cfg(unix)]`.
- Terminal input: send `\r` (CR) for Enter, not `\n` (LF).

### Bundle config

- `bundle.targets: "all"` plus per-platform sections in `tauri.conf.json`:
  - **macOS**: `minimumSystemVersion: 10.15`.
  - **Linux**: deb depends `libwebkit2gtk-4.1-0`, `libgtk-3-0`; rpm `webkit2gtk4.1`, `gtk3`.
  - **Windows**: NSIS installer in `currentUser` mode, WebView2 via `embedBootstrapper`.
- Auto-updater configured with a public minisign key.

### Known gotchas

- **macOS Tahoe**: Test all Tauri features on Tahoe 26.5. Verify keychain integration, window management, and shell init scripts.
- **Intel Mac**: Ensure WebGL rendering works properly on Intel GPUs.
- **React 19 strict mode** double-mounts `useEffect` in dev → terminals spawn twice on first render. The `SPAWN_LOCK` mutex serializes this.
- **Tab `cwd` storage**: comes from OSC 7 with forward slashes. Anything that consumes `tab.cwd` and passes it to a Rust fs command must normalize separators.
- **AiComposerProvider** is mounted unconditionally at the App.tsx root — a conditional wrapper would change the parent element type when keys load, remounting the entire tree.
