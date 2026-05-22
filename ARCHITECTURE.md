# Flame ADE — Architecture Deep Dive

## Two-Process Model

Flame ADE uses a two-process architecture where the Rust backend owns all OS access and the React webview communicates through Tauri's IPC layer.

```
+-----------------------------------------+
|           Webview (React 19)            |
|  Terminal  |  Editor  |  Explorer  | AI |
+----------------------+------------------+
                       | invoke() / Channel
+----------------------+------------------+
|          Rust Backend (Tauri 2)         |
|  PTY  |  FS  |  Search  |  Secrets  |  Git  |
+-----------------------------------------+
```

### Why Two Processes?
- **Security**: Webview cannot directly access filesystem, processes, or shells
- **Isolation**: Crash in one process doesn't bring down the other
- **Performance**: Rust handles heavy I/O, React handles UI rendering
- **Cross-platform**: Tauri abstracts OS differences

## Rust Backend (`src-tauri/`)

### Core Commands (registered in `lib.rs`)

#### PTY Module (`pty::pty_*`)
- Long-lived interactive PTY sessions
- Uses `portable-pty` crate for cross-platform PTY handling
- Output streams via Tauri `Channel<PtyEvent>`
- Session management via `RwLock<HashMap<id, Session>>`
- Shell integration via injected init scripts (OSC 7, OSC 133)

#### Filesystem Module (`fs::*`)
- `fs::tree::*` — directory tree for file explorer
- `fs::file::*` — file read/write operations
- `fs::mutate::*` — file mutations (create, delete, rename)
- `fs::search::*` — fuzzy file finder using `ignore` crate
- `fs::grep::*` — content search using `regex` crate

#### Shell Module (`shell::*`)
- `shell_run_command` — one-shot subshell exec for AI tools
- `shell_session_*` — persistent agent shell with state
- `shell_bg_*` — long-running background processes (dev servers)

#### Git Module (`git::*`)
- `git_status` — current branch + porcelain status
- `git_diff` — unstaged diff (optional file filter)
- `git_log` — recent commits (configurable count)
- `git_add` — stage files
- `git_commit` — commit with message
- `git_branches` — list local branches
- `git_checkout` — switch branches

#### Secrets Module (`secrets::*`)
- OS keychain via `keyring` crate
- Service name: `flame-ade`
- macOS: native keychain (`apple-native` feature)
- Linux: secret-service or file-based fallback
- Windows: Credential Manager (`windows-native` feature)

### Shell Integration

#### Unix (zsh/bash)
Init scripts injected via `ZDOTDIR` (zsh) or `--rcfile` (bash):
- Emit OSC 7 for cwd reporting
- Emit OSC 133 A/B/C/D for prompt boundaries and exit code
- Allows host to track cwd and detect command boundaries

#### macOS Tahoe Specific
- Test shell init scripts thoroughly on macOS 26.5
- Verify OSC escape sequence handling
- Ensure zsh/bash integration works with Tahoe's default shell config
- Test with Intel Mac-specific shell behaviors

### ConPTY / PTY Handling

#### macOS/Linux
- Uses `openpty` + `forkpty` or `posix_openpt`
- Process cleanup via `Drop` implementation
- Signal handling for SIGCHLD

#### Windows (future)
- ConPTY via `CreatePseudoConsole`
- Job Object with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`
- `SPAWN_LOCK` mutex for concurrent spawn safety

## React Frontend (`src/`)

### Module Architecture

Each module in `src/modules/` is self-contained:
- Exports via `index.ts` barrel file
- Owns its hooks under `lib/`
- Uses `@/` path alias (never relative across modules)

#### Terminal Module (`modules/terminal/`)
- `TerminalStack` — one mounted xterm per tab
- `useTerminalSession` — PTY bridge hook
- `osc-handlers.ts` — parses OSC 7 and OSC 133
- `themes.ts` — terminal color themes
- Tabs hidden via `invisible pointer-events-none` (not unmounted)

#### Editor Module (`modules/editor/`)
- `EditorStack` — mirrors `TerminalStack` pattern
- `extensions.ts` — CodeMirror 6 language modes
- Supports: TS/JS, Rust, Python, HTML/CSS, JSON, Markdown, Go, C/C++/Java/C#, PHP
- Vim mode via `@replit/codemirror-vim`
- Themes: Tokyo Night, Nord, GitHub, Atom One, Aura, Copilot, Xcode

#### Explorer Module (`modules/explorer/`)
- File tree with Material/Catppuccin icons
- Fuzzy search, keyboard navigation
- Context actions, inline rename
- Backslash-aware `basename` for cross-platform paths

#### Preview Module (`modules/preview/`)
- `PreviewPanel` — URL input bar + sandboxed iframe
- Loading state, error handling
- Dev-server auto-detection

#### Git Module (`modules/git/`)
- `GitPanel` — three views: Changes, Log, Branches
- File staging with checkboxes, commit message input
- Diff viewer per file, branch switching

#### AI Module (`modules/ai/`)
- `lib/agent-runner.ts` — streamText-based agent with tool interception
- `lib/skills.ts` — slash command registry (/explain, /fix, /test, /refactor, /docs)
- `lib/config.ts` — multi-provider configuration
- `lib/provider.ts` — provider factory for AI SDK
- `lib/keychain.ts` — frontend keychain bridge
- `lib/security.ts` — deny-list for secret paths
- `lib/live-context.ts` — live terminal context bridge
- `store/chatStore.ts` — Zustand store for AI sessions & messages
- `store/approvalStore.ts` — Zustand store for tool approval queue
- `components/AiPanel.tsx` — AI side panel with chat UI & session management
- `components/ApprovalDialog.tsx` — approval modal for dangerous operations
- `components/VoiceInput.tsx` — microphone button with SpeechRecognition
- `components/EditDiff.tsx` — side-by-side diff viewer with per-hunk accept/reject

#### Tabs Module (`modules/tabs/`)
- `useTabs` — source of truth for tab list + active id
- `useWorkspaceCwd` — derives explorer root + inherited cwd
- Tagged-union tab types: `{ kind: "terminal" | "editor" | "preview" | "ai-diff" | "git" }`

### State Management
- **Zustand** for global state (tabs, settings, AI sessions)
- **React Context** for composer state, theme, live context
- **tauri-plugin-store** for persistent settings and sessions

### UI Conventions
- **shadcn/ui** — primitives in `src/components/ui/`
- **Tailwind v4** — config in `src/App.css` via `@theme`
- **motion** — animations (Framer Motion successor)
- **react-resizable-panels** — resizable layouts
- `cn()` from `@/lib/utils` for class merging

## AI Subsystem

### Agent Architecture
```
Main Agent (Experimental_Agent)
+-- System Prompt (from config.ts)
+-- Tools (tools.ts)
|   +-- read_file (auto-execute)
|   +-- list_directory (auto-execute)
|   +-- fs_search (auto-execute)
|   +-- fs_grep (auto-execute)
|   +-- write_file (needs approval)
|   +-- create_directory (needs approval)
|   +-- rename (needs approval)
|   +-- delete (needs approval)
|   +-- run_command (needs approval)
|   +-- shell_session_run (needs approval)
|   +-- shell_bg_spawn (needs approval)
+-- Sub-agents (registry)
    +-- Named sub-agents with own system prompts
    +-- Different tool subsets per agent
```

### Providers (BYOK)
- OpenAI, Anthropic, Google, Groq, xAI, Cerebras
- OpenAI-compatible (custom endpoint)
- LM Studio for local/offline models

### Session Management
- Named sessions persisted via `tauri-plugin-store`
- `chatStore.ts` — module-scoped `Map<sessionId, Chat<UIMessage>>`
- Auto-derive titles from first user message
- Switching API key wipes chat map; sessions persist

### Live Context Bridge
- `App.tsx` calls `setLive({ getCwd, getTerminalContext, ... })`
- Tools read active terminal's cwd + last 300 lines
- Lazy by design — no pre-snapshotting

### Security
- Deny-list for secret paths (`.env*`, `.ssh/`, credentials, keychain dirs)
- SSRF and DNS rebinding defense on outbound HTTP
- Sandboxed preview surface (iframe)
- Trust gating in terminal escape-sequence handling

## Window Management

### macOS
- `titleBarStyle: Overlay` + `hiddenTitle: true` in `tauri.conf.json`
- Native traffic lights via overlay

### Linux (future)
- `decorations: false` + `transparent: true`
- Custom window controls rendered by React

### Windows (future)
- Same as Linux
- NSIS installer in `currentUser` mode

## Cross-Platform Conventions

### Paths
- Use `dirs` crate (`dirs::home_dir()`, `dirs::cache_dir()`)
- Never raw `$HOME` or `%USERPROFILE%`
- Canonical form: forward-slash on frontend
- Normalize with `.split(/[\\/]/)` at boundaries

### Terminal Input
- Send `\r` (CR) for Enter, not `\n` (LF)
- PowerShell on Windows requires CR

### Shell Init Scripts
- Gate Unix-only logic behind `#[cfg(unix)]`
- Windows arm in separate module

## Bundle Config

### Targets
- **macOS**: minimumSystemVersion 10.15
- **Linux**: deb, rpm, AppImage
- **Windows**: NSIS (currentUser mode, WebView2 embedded)

### Auto-updater
- minisign public key verification
- Release artifacts from GitHub releases

## Known Gotchas

### macOS Tahoe
- Test all Tauri window management features on Tahoe 26.5
- Verify keychain integration works with Tahoe's security changes
- Test shell init scripts with Tahoe's default zsh configuration
- Intel Mac: ensure WebGL rendering works properly

### React 19 Strict Mode
- Double-mounts `useEffect` in dev
- Terminals may spawn twice on first render
- SPAWN_LOCK mutex serializes this

### Tab CWD Storage
- Comes from OSC 7 with forward slashes
- Anything consuming `tab.cwd` and passing to Rust fs must normalize separators

### AI Composer
- Mount unconditionally — conditional wrapper changes parent element type
- Remounting entire tree would re-spawn every PTY
