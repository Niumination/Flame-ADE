# Flame ADE — Community Launch Plan

## Target Audience
- Rust developers (Tauri, systems programming)
- Terminal enthusiasts (iTerm2, Warp, Kitty users)
- AI-assisted developers (Cursor, Copilot, Claude Code users)
- Hackintosh / macOS power users

## Key Selling Points
- **~7 MB** — 10× smaller than VS Code-based tools
- **No telemetry** — privacy-first, no account needed
- **BYOK AI** — your keys, your choice (or fully local via LM Studio)
- **macOS Tahoe 26.5** — primary target, tested on real Hackintosh hardware
- **Two-process model** — Rust backend, React UI, security-isolated
- **Open source** — Apache-2.0

## Platforms

### 1. Hacker News

**Title options:**
1. "Flame ADE — A 7MB AI-native terminal emulator built with Tauri + Rust"
2. "Show HN: Flame ADE — Open-source AI terminal with BYOK, under 10MB"
3. "Flame ADE: Lightweight AI terminal emulator (Tauri 2 + Rust, no Electron)"

**Body draft:**

```
I built Flame ADE — an open-source AI-native terminal emulator (ADE) that's ~7MB on disk, built with Tauri 2 (Rust) + React 19.

No Electron, no telemetry, no account required. You bring your own API keys (or run local models via LM Studio).

Key features:
• Native PTY backend via portable-pty (zsh, bash, fish)
• xterm.js + WebGL renderer — GPU-accelerated
• Multi-tab with background streaming (tabs stay alive when hidden)
• Shell integration (OSC 7 + OSC 133 — cwd tracking, prompt boundaries)
• CodeMirror 6 editor with Vim mode, 7+ themes
• File explorer with fuzzy search
• Git panel (changes, log, branches, commit)
• Web preview (sandboxed iframe)
• AI agent system with tools, sub-agents, approval flow
• Voice input (Web Speech API)
• OS keychain for API keys (never localStorage/disk)

Why build another terminal?
I wanted something truly lightweight that pairs a native PTY with an AI agent — without the bloat of Electron-based tools. The two-process model (Rust backend, React UI) means crash isolation and security.

Build from source:
  pnpm install && pnpm tauri dev

Tech: Rust (Tauri 2), React 19, TypeScript, Vite 7, xterm.js, CodeMirror 6, Vercel AI SDK v6, Tailwind v4, Zustand.

https://github.com/anomalyco/flame-ade

Would love feedback from the community!
```

### 2. Reddit — r/rust

**Title:**
```
Flame ADE: Open-source AI terminal emulator in Rust (Tauri 2, portable-pty, ~7MB)
```

**Body:**
```
Hey r/rust! I've been building Flame ADE — a lightweight AI-native terminal emulator using Rust + Tauri 2.

The backend is pure Rust (portable-pty for PTY handling, keyring for OS keychain, serde for IPC). The frontend is React 19 with TypeScript. Total binary size: ~7MB.

What makes it different:
• Two-process model — Rust owns all OS access, webview communicates via IPC
• BYOK AI — your own API keys, stored in OS keychain, never on disk
• Works with local models via LM Studio (OpenAI-compatible endpoint)
• No telemetry, no account required
• macOS Tahoe 26.5 primary target (tested on Intel Hackintosh)

Features:
- Multi-tab xterm.js terminal with WebGL
- CodeMirror 6 editor, file explorer
- Git panel, web preview
- AI agent with tools (read/write/search/bash/fs), sub-agents, approval flow
- Edit diffs with per-hunk accept/reject

Would love Rustaceans to check it out and give feedback!
```

### 3. Reddit — r/programming

**Title:**
```
Flame ADE — 7MB AI terminal emulator (no Electron, no telemetry, BYOK)
```

**Body:** Similar to HN post but shorter, emphasizing the "no bloat" angle.

### 4. Reddit — r/macOS

**Title:**
```
Flame ADE — Lightweight AI terminal for macOS (Tahoe 26.5 tested, ~7MB)
```

**Body:** Focus on macOS features, Tahoe compatibility, Hackintosh testing.

### 5. Twitter/X

```
Flame ADE v0.6.0 — open-source AI terminal emulator

~7MB | Tauri 2 + Rust | BYOK AI | No telemetry | Apache-2.0

Built for macOS Tahoe 26.5, runs on Linux & Windows too.

github.com/anomalyco/flame-ade
#rust #tauri #terminal #opensource #ai
```

### 6. YouTube (launch video)

Script outline:
1. Open Flame ADE, show terminal with tabs
2. Show file explorer → open file in editor
3. Show AI panel, ask a question, show streaming response
4. Show git panel (status, commit, log)
5. Show web preview
6. Conclusion + link

---

## Release Checklist

### Pre-launch (24h before)
- [ ] Push final README + docs
- [ ] Create GitHub Release v0.6.0 with binaries
- [ ] Test `pnpm tauri build` on macOS one final time
- [ ] Verify all CI checks pass

### Launch day
- [ ] Post to HN (best time: 8-10 AM Pacific / 3-5 PM UTC on weekdays)
- [ ] Post to r/rust + r/programming + r/macOS
- [ ] Tweet from project account
- [ ] Share in relevant Discord/Slack communities

### Post-launch (48h)
- [ ] Monitor HN/Reddit comments and respond
- [ ] Fix critical bugs reported by community
- [ ] Add CONTRIBUTORS.md if people contribute
- [ ] Track GitHub stars, forks, issues

---

## Repository Setup

Before sharing links, ensure:
- [x] README is polished with badges, features, architecture, screenshots placeholder
- [x] LICENSE file exists (Apache-2.0)
- [x] SECURITY.md is complete
- [x] CONTRIBUTING.md is complete
- [x] CI workflow is passing
- [ ] GitHub repo description + topics set
- [ ] GitHub Pages or simple landing page (optional)

### GitHub repo settings
```
Description: ~7MB AI-native terminal emulator (Tauri 2 + Rust + React 19)
Topics: terminal, terminal-emulator, tauri, rust, react, ai, ade, macos, hackintosh
Website: (optional — could use GitHub Pages)
```
