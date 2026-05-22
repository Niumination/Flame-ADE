# Flame ADE

**Open-source lightweight cross-platform AI-native terminal (ADE)**

Flame ADE is a fast, lightweight AI terminal (ADE) built on Tauri 2 + Rust and React 19. It pairs a native PTY backend with a modern UI — multi-tab terminals, an integrated code editor, a file explorer, and a first-class AI side-panel that works with your own API keys (or fully local models via LM Studio). Under 10 MB on disk, no telemetry, keys stored in the OS keychain.

**Primary Target**: macOS Tahoe 26.5 (Hackintosh optimized)

[![version](https://img.shields.io/badge/version-0.6.0--dev-blue)]()
[![license](https://img.shields.io/badge/license-Apache--2.0-green)]()
[![platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey)]()

---

## Screenshots

_Coming soon_

---

## Features

### Terminal
- xterm.js + WebGL renderer, multi-tab with background streaming
- Native PTY backend via `portable-pty` (zsh, bash, pwsh, …)
- Shell integration (cwd reporting, prompt markers) via injected init scripts
- Inline search, link detection, true-color

### Editor
- CodeMirror 6 with language support for TS/JS, Rust, Python, HTML/CSS, JSON, Markdown
- Inline AI autocomplete and AI edit diffs
- Vim mode
- Prebuilt themes: Tokyo Night, Nord, GitHub, Atom One, Aura, Copilot, Xcode

### File Explorer
- Catppuccin icon theme (Material Icon Theme resolver)
- Fuzzy search, keyboard navigation, inline rename, context actions

### Web Preview
- Auto-detects local dev servers and opens them in a preview tab

### AI (BYOK)
- Providers: OpenAI, Anthropic, Google, Groq, xAI, Cerebras, OpenAI-compatible
- Local / offline models via LM Studio
- Voice input, edit diffs, multi-agent and sub-agents
- Snippets / skills, customizable system prompt
- `FLAME.md` for project memory and configuration
- Tasks, plans, search, file read/write tools with approval flow

### Quality
- Lightweight and fast (~7 MB bundle)
- API keys stored in the OS keychain
- No telemetry, no account required

---

## Configure AI

1. Open **Settings → AI**.
2. Pick a provider and paste your API key. For local inference, point Flame ADE at your LM Studio endpoint.
3. Keys are written to the OS keychain via `keyring` — they never touch disk or `localStorage`.

---

## Build from source

### Prerequisites

- Rust (stable) — [https://rustup.rs](https://rustup.rs)
- Node 20+ and [pnpm](https://pnpm.io)
- Platform-specific Tauri prerequisites — [https://tauri.app/start/prerequisites/](https://tauri.app/start/prerequisites/)

### Run

```bash
pnpm install
pnpm tauri dev          # development
pnpm tauri build        # production bundle
```

### Checks

```bash
pnpm exec tsc --noEmit          # frontend type-check
cd src-tauri && cargo clippy    # Rust lint
```

---

## Tech stack

Tauri 2 · Rust · `portable-pty` · React 19 · TypeScript · xterm.js · CodeMirror 6 · Vercel AI SDK v6 · Tailwind v4 · shadcn/ui · Zustand

---

## macOS Tahoe Notes

Flame ADE is primarily developed and tested on **macOS Tahoe 26.5** running on Hackintosh hardware (ThinkPad X13 Yoga Gen 1, Intel i5-10310U).

- Window management uses `titleBarStyle: Overlay` with native traffic lights
- WebGL rendering optimized for Intel UHD Graphics
- Shell integration tested with macOS default zsh
- Keychain integration verified with Tahoe security model

---

## Contributing

Issues and PRs are welcome! Feel free to open issues, suggest features, or submit pull requests.

---

## License

Flame ADE is licensed under the Apache-2.0 License.

---

## About

Lightweight (7MB) AI terminal emulator (ADE) built in Rust & Tauri & React
