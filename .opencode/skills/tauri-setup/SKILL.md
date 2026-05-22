# Tauri 2 Setup Skill

Use this skill when setting up or configuring Tauri 2 for Flame ADE.

## Prerequisites

### Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustc --version
```

### Install Node.js 20+
```bash
brew install node
node --version
```

### Install pnpm
```bash
brew install pnpm
pnpm --version
```

### Install Tauri CLI
```bash
pnpm add -D @tauri-apps/cli
```

### macOS Prerequisites
```bash
brew install pkg-config
```

## Project Initialization

### Create new Tauri project
```bash
pnpm create tauri-app
```

### Or initialize in existing project
```bash
pnpm tauri init
```

## Project Structure
```
flame-ade/
├── src/                    # Frontend (React)
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── lib.rs          # Main entry point
│   │   └── main.rs         # Binary entry point
│   ├── Cargo.toml          # Rust dependencies
│   ├── tauri.conf.json     # Tauri configuration
│   └── capabilities/       # Permission capabilities
├── package.json
└── index.html
```

## Key Configuration Files

### `tauri.conf.json`
```json
{
  "productName": "Flame ADE",
  "version": "0.1.0",
  "identifier": "app.flame.ade",
  "build": {
    "beforeBuildCommand": "pnpm build",
    "beforeDevCommand": "pnpm dev",
    "frontendDist": "../dist"
  },
  "app": {
    "withGlobalTauri": false,
    "windows": [
      {
        "title": "Flame ADE",
        "width": 1200,
        "height": 800,
        "titleBarStyle": "Overlay",
        "hiddenTitle": true,
        "transparent": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

### `Cargo.toml` (src-tauri)
```toml
[package]
name = "flame-ade"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
portable-pty = "0.9"
keyring = { version = "3.6", default-features = false, features = ["apple-native"] }
dirs = "5"

[target.'cfg(unix)'.dependencies]
libc = "0.2"

[profile.release]
codegen-units = 1
lto = "fat"
opt-level = "s"
panic = "abort"
strip = true
```

## Development Commands
```bash
# Start dev server
pnpm tauri dev

# Build for production
pnpm tauri build

# Check Rust code
cd src-tauri && cargo check

# Lint Rust code
cd src-tauri && cargo clippy
```

## macOS Tahoe Notes
- Test `titleBarStyle: Overlay` on macOS Tahoe 26.5
- Verify window transparency works correctly
- Ensure native traffic lights render properly
- Test with Intel Mac GPU (WebGL rendering)

## Troubleshooting

### Webview won't load
- Check `beforeDevCommand` and `beforeBuildCommand` paths
- Verify `frontendDist` points to correct output directory
- Check CSP settings in `tauri.conf.json`

### Rust compilation errors
- Ensure Rust toolchain is installed: `rustup show`
- Check `Cargo.toml` dependencies
- Run `cargo clean` and rebuild

### macOS permission issues
- Check Info.plist for required permissions
- Verify code signing for distribution
- Test with `xattr -cr` on app bundle
