# Rust PTY Skill

Use this skill when implementing or debugging PTY functionality in Flame ADE.

## Overview

PTY (Pseudo Terminal) is the core of Flame ADE's terminal emulator. It creates a bidirectional communication channel between the terminal frontend (xterm.js) and the shell process.

## Architecture

```
┌──────────────┐     invoke()      ┌──────────────────┐
│   xterm.js   │ ◄──────────────► │  Rust PTY Backend │
│  (Webview)   │    Channel       │  (portable-pty)   │
└──────────────┘                  └──────────────────┘
```

## Key Components

### Session Management
```rust
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use portable_pty::{PtyPair, ChildKiller, MasterPty};

pub struct Session {
    pub pair: PtyPair,
    pub killer: Box<dyn ChildKiller + Send + Sync>,
    pub writer: Box<dyn std::io::Write + Send>,
}

pub type PtyState = Arc<RwLock<HashMap<u32, Session>>>;
```

### PTY Commands (lib.rs)
```rust
#[tauri::command]
async fn pty_open(
    state: State<'_, PtyState>,
    cols: u16,
    rows: u16,
    cwd: Option<String>,
    shell: Option<String>,
) -> Result<u32, String> {
    // Create new PTY session
    // Return session ID
}

#[tauri::command]
async fn pty_write(
    state: State<'_, PtyState>,
    id: u32,
    data: String,
) -> Result<(), String> {
    // Write data to PTY
}

#[tauri::command]
async fn pty_resize(
    state: State<'_, PtyState>,
    id: u32,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    // Resize PTY
}

#[tauri::command]
async fn pty_close(
    state: State<'_, PtyState>,
    id: u32,
) -> Result<(), String> {
    // Close PTY and kill child process
}
```

### Output Channel
```rust
use tauri::Emitter;

// Send PTY output to frontend
let event = PtyEvent {
    session_id: id,
    data: output_bytes,
};
app.emit("pty-output", event)?;
```

## Shell Integration

### OSC 7 (cwd reporting)
```
\033]7;file://hostname/path/to/cwd\007
```

### OSC 133 (prompt boundaries)
```
\033]133;A\007  # Command start
\033]133;B\007  # Command end (before output)
\033]133;C\007  # Command end (after output)
\033]133;D;<exit_code>\007  # Command finished
```

### Unix Init Scripts
Create init scripts in `src-tauri/src/modules/pty/scripts/`:

**zshrc.zsh**
```bash
# Flame ADE shell integration
precmd() {
    print -Pn "\e]133;C;\e\\"
    print -Pn "\e]133;A\e\\"
}
preexec() {
    print -Pn "\e]133;B\e\\"
}
# Report cwd
chpwd() {
    print -Pn "\e]7;file://$HOST${PWD}\e\\"
}
```

**bashrc.bash**
```bash
# Flame ADE shell integration
PROMPT_COMMAND='echo -ne "\e]133;C;\e\\\e]133;A\e\\";'$PROMPT_COMMAND
trap 'echo -ne "\e]133;D;$?\e\\"' DEBUG
```

## macOS Tahoe Notes

### PTY Creation
```rust
#[cfg(target_os = "macos")]
fn create_pty() -> Result<PtyPair, String> {
    // Test PTY creation on macOS Tahoe 26.5
    let builder = PtyBuilder::default();
    builder.open().map_err(|e| e.to_string())
}
```

### Shell Detection
```rust
fn get_default_shell() -> String {
    // macOS default is zsh
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
    
    // Verify shell exists
    if std::path::Path::new(&shell).exists() {
        shell
    } else {
        "/bin/zsh".to_string()
    }
}
```

## Common Issues

### PTY won't open
- Check `portable-pty` version in `Cargo.toml`
- Verify shell path exists
- Check permissions for PTY device files

### Output not streaming
- Verify Tauri channel is properly connected
- Check event emission in Rust
- Ensure frontend is listening for `pty-output` events

### Resize not working
- Call `pty_resize` on terminal resize
- Update xterm.js dimensions
- Check for race conditions

### Child process not killed
- Ensure `ChildKiller` is stored in session
- Call `killer.kill()` on session close
- On macOS, verify process cleanup

## Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_pty_open_close() {
        // Test PTY lifecycle
    }
    
    #[test]
    fn test_pty_write_read() {
        // Test bidirectional communication
    }
    
    #[test]
    fn test_pty_resize() {
        // Test resize functionality
    }
}
```
