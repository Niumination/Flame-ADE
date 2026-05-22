# Flame ADE — Master Development Plan

## Visi
Flame ADE adalah AI-native terminal emulator (ADE) yang ringan, cross-platform, dengan **prioritas utama macOS Tahoe 26.5 compatibility**. Dibangun dari nol untuk menghindari issue yang dialami Terax AI di macOS versi baru.

## Target Sistem
- **Primary**: Hackintosh macOS Tahoe 26.5
- **Hardware**: ThinkPad X13 Yoga Gen 1, Intel Core i5-10310U
- **Secondary**: macOS 10.15+, Linux (.deb/.rpm/AppImage), Windows (NSIS)

## Perbedaan Utama dengan Terax AI
1. **macOS Tahoe 26.5 native support** — testing & optimization untuk macOS versi terbaru
2. **Intel Mac optimized** — performa optimal di Hackintosh dengan CPU Intel 10th gen
3. **Same feature set** — Terminal, Editor, Explorer, AI, Web Preview, Git, Security
4. **Better Tauri 2 compatibility** — fix issue yang Terax alami di macOS baru

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Backend** | Rust (Tauri 2), `portable-pty` untuk PTY handling |
| **Frontend** | React 19, TypeScript, Vite 7 |
| **Terminal** | xterm.js + WebGL renderer |
| **Editor** | CodeMirror 6 (Vim mode, multiple themes) |
| **AI SDK** | Vercel AI SDK v6 |
| **UI** | Tailwind v4, shadcn/ui, radix-ui, motion |
| **State** | Zustand |
| **Package Manager** | pnpm |

## Development Phases

### Phase 1: Foundation (Minggu 1-2)
- [x] Project setup (Tauri 2 + Rust + React)
- [x] PTY backend implementation
- [x] Basic terminal dengan xterm.js
- [x] Multi-tab support
- [x] macOS Tahoe compatibility testing
- [x] Window management (titleBarStyle, custom controls)

### Phase 2: Core Features (Minggu 3-4) ✅ COMPLETE
- [x] Shell integration (OSC 7, OSC 133)
- [x] File explorer
- [x] Code editor (CodeMirror 6)
- [x] Tab polish (move, duplicate, context menu)
- [x] Theme system (ThemeProvider, Tokyo Night/Nord themes)
- [x] Status bar & header (cwd breadcrumb, explorer/AI toggle)

### Phase 3: AI Integration (Minggu 5-6) ✅ COMPLETE
- [x] Vercel AI SDK v6 + multi-provider config
- [x] BYOK keychain (keyring crate, secrets commands)
- [x] AI side panel (chat UI, session management)
- [x] Zustand chat store with session persistence
- [x] Agent & sub-agent system with tools
- [x] Approval flow for dangerous operations
- [x] Voice input
- [x] Full message streaming with Vercel AI SDK

### Phase 4: Advanced Features (Minggu 7-8) ✅ COMPLETE
- [x] Web preview
- [x] Git/source control panel (Rust git commands + React GitPanel)
- [x] AI edit diffs (EditDiff component)
- [x] Skills & slash commands (/explain, /fix, /test, /refactor, /docs)
- [x] Auto-updater (tauri-plugin-updater)

### Phase 5: Polish & Security (Minggu 9-10) ✅ COMPLETE
- [x] Security hardening (path sanitization, deny-list, capabilities tightened)
- [x] Performance optimization (React.lazy, React.memo)
- [x] Cross-platform testing (cargo check + tsc on macOS x86_64)
- [x] Documentation finalized
- [x] Release preparation (v0.6.0, minisign keys, CSP)

## Module Structure

```
flame-ade/
+-- src/                          # Frontend React
|   +-- modules/
|   |   +-- terminal/             # xterm.js terminal
|   |   +-- editor/               # CodeMirror 6 editor
|   |   +-- explorer/             # File explorer
|   |   +-- preview/              # Web preview
|   |   +-- ai/                   # AI subsystem
|   |   |   +-- lib/              # agent, sessions, composer, security
|   |   |   +-- tools/            # AI tools
|   |   |   +-- agents/           # Sub-agent registry
|   |   +-- tabs/                 # Tab management
|   |   +-- header/               # Top bar
|   |   +-- statusbar/            # Bottom bar
|   |   +-- shortcuts/            # Keyboard shortcuts
|   |   +-- settings/             # Settings
|   |   +-- updater/              # Auto-updater
|   +-- components/
|   |   +-- ui/                   # shadcn/ui primitives
|   |   +-- ai-elements/          # @ai-elements components
|   +-- App.tsx                   # Root coordinator
+-- src-tauri/                    # Rust backend
|   +-- src/
|   |   +-- lib.rs                # Main entry
|   |   +-- modules/
|   |   |   +-- pty/              # PTY management
|   |   |   +-- fs/               # Filesystem operations
|   |   |   +-- shell/            # Shell command execution
|   |   |   +-- git/              # Git commands
|   |   |   +-- secrets/          # Keychain integration
|   +-- Cargo.toml
|   +-- capabilities/
|   +-- tauri.conf.json
+-- package.json
+-- opencode.json                 # OpenCode project config
+-- AGENTS.md                     # Project context
+-- ARCHITECTURE.md               # Deep dive arsitektur
+-- WORKFLOW.md                   # Development workflow
+-- FLAME.md                      # Project memory (seperti TERAX.md)
+-- PLAN.md                       # File ini
```

## Milestone Checklist

### v0.1.0 — Prototype
- [x] Tauri 2 project initialized
- [x] Basic Rust PTY backend
- [x] xterm.js rendering
- [x] Single tab terminal
- [x] Multi-tab support
- [x] Shell integration (OSC 7, OSC 133)

### v0.2.0 — Multi-tab + Editor
- [x] Multi-tab support
- [x] CodeMirror 6 editor
- [x] File explorer
- [x] Basic theming

### v0.3.0 — AI Panel
- [x] Vercel AI SDK integration
- [x] Single provider (OpenAI/Anthropic)
- [x] Basic chat interface
- [x] API key storage (keychain)

### v0.4.0 — Agentic Workflow
- [x] Agent & sub-agent system
- [x] Tools (read, write, bash, search)
- [x] Approval flow
- [x] Edit diffs

### v0.5.0 — Full Feature Set
- [x] All AI providers
- [x] Voice input
- [x] Web preview
- [x] Git panel
- [x] Skills & slash commands
- [x] Auto-updater

### v0.6.0 — Polish
- [x] Security hardening
- [x] Performance optimization
- [x] macOS Tahoe testing
- [x] Documentation

### v1.0.0 — Release
- [ ] Cross-platform builds
- [ ] Stable release
- [ ] Community launch
