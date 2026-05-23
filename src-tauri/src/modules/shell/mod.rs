pub mod background;
pub mod ringbuffer;
pub mod session;

use std::collections::HashMap;
use std::io::Read;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::{Arc, Mutex, RwLock};
use std::thread;
use std::time::Duration;

use serde::Serialize;
use shared_child::SharedChild;

use crate::modules::proc::hide_console;
use crate::modules::workspace::{authorize_spawn_cwd, WorkspaceEnv, WorkspaceRegistry};

// ─── Constants ────────────────────────────────────────────────

pub const DEFAULT_TIMEOUT_SECS: u64 = 30;
pub const MAX_TIMEOUT_SECS: u64 = 300;
pub const MAX_OUTPUT_BYTES: usize = 256 * 1024;

// ─── State ────────────────────────────────────────────────────

pub struct ShellState {
    pub sessions: RwLock<HashMap<u32, session::ShellSession>>,
    pub bg: RwLock<HashMap<u32, background::BackgroundProc>>,
    pub next_session_id: AtomicU32,
    pub next_bg_id: AtomicU32,
}

impl ShellState {
    pub fn new() -> Self {
        Self {
            sessions: RwLock::new(HashMap::new()),
            bg: RwLock::new(HashMap::new()),
            next_session_id: AtomicU32::new(1),
            next_bg_id: AtomicU32::new(1),
        }
    }
}

// ─── Output Types ─────────────────────────────────────────────

#[derive(Serialize)]
pub struct CommandOutput {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub timed_out: bool,
    pub truncated: bool,
}

// ─── Command Builder ──────────────────────────────────────────

fn build_oneshot_command(command: &str, workspace: &WorkspaceEnv) -> Command {
    if workspace.is_wsl() {
        if let WorkspaceEnv::Wsl { distro } = workspace {
            let mut cmd = Command::new("wsl.exe");
            cmd.arg("-d")
                .arg(distro)
                .arg("--")
                .arg("/bin/sh")
                .arg("-c")
                .arg(command);
            return cmd;
        }
    }

    #[cfg(windows)]
    {
        let mut cmd = Command::new("powershell.exe");
        cmd.arg("-NoProfile").arg("-Command").arg(command);
        cmd
    }

    #[cfg(not(windows))]
    {
        let mut cmd = Command::new("/bin/sh");
        cmd.arg("-c").arg(command);
        cmd
    }
}

// ─── One-Shot Command ─────────────────────────────────────────

#[tauri::command]
pub async fn shell_run_command(
    command: String,
    cwd: Option<String>,
    timeout_secs: Option<u64>,
    workspace: Option<WorkspaceEnv>,
    registry: tauri::State<'_, WorkspaceRegistry>,
) -> Result<CommandOutput, String> {
    let workspace = WorkspaceEnv::from_option(workspace);
    let cwd = authorize_spawn_cwd(&registry, cwd.as_deref(), &workspace)
        .map_err(|e| format!("cwd authorization failed: {e}"))?;

    let timeout = Duration::from_secs(
        timeout_secs
            .unwrap_or(DEFAULT_TIMEOUT_SECS)
            .min(MAX_TIMEOUT_SECS),
    );

    let mut cmd = build_oneshot_command(&command, &workspace);
    hide_console(&mut cmd);
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
    if let Some(ref dir) = cwd {
        cmd.current_dir(dir);
    }

    let child = cmd.spawn().map_err(|e| format!("spawn failed: {e}"))?;
    wait_with_timeout(child, timeout)
}

fn wait_with_timeout(mut child: Child, timeout: Duration) -> Result<CommandOutput, String> {
    let start = std::time::Instant::now();
    loop {
        if let Some(status) = child.try_wait().map_err(|e| e.to_string())? {
            let output = child.wait_with_output().map_err(|e| e.to_string())?;
            let (stdout, truncated_stdout) = cap_bytes(&output.stdout, MAX_OUTPUT_BYTES);
            let (stderr, truncated_stderr) = cap_bytes(&output.stderr, MAX_OUTPUT_BYTES);
            return Ok(CommandOutput {
                stdout: String::from_utf8_lossy(&stdout).to_string(),
                stderr: String::from_utf8_lossy(&stderr).to_string(),
                exit_code: status.code().unwrap_or(-1),
                timed_out: false,
                truncated: truncated_stdout || truncated_stderr,
            });
        }
        if start.elapsed() >= timeout {
            let _ = child.kill();
            let _ = child.wait();
            return Ok(CommandOutput {
                stdout: String::new(),
                stderr: String::new(),
                exit_code: -1,
                timed_out: true,
                truncated: false,
            });
        }
        thread::sleep(Duration::from_millis(50));
    }
}

fn cap_bytes(data: &[u8], max: usize) -> (Vec<u8>, bool) {
    if data.len() > max {
        (data[..max].to_vec(), true)
    } else {
        (data.to_vec(), false)
    }
}

// ─── run_blocking (SharedChild variant) ───────────────────────

#[allow(dead_code)]
pub fn run_blocking(
    cmd: &mut Command,
    cwd: Option<PathBuf>,
    timeout: Duration,
) -> Result<CommandOutput, String> {
    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }
    let child = SharedChild::spawn(cmd).map_err(|e| e.to_string())?;
    let child = Arc::new(child);

    let stdout = child.take_stdout().ok_or("no stdout")?;
    let stderr = child.take_stderr().ok_or("no stderr")?;

    let stdout_buf: Arc<Mutex<Vec<u8>>> = Arc::new(Mutex::new(Vec::new()));
    let stderr_buf: Arc<Mutex<Vec<u8>>> = Arc::new(Mutex::new(Vec::new()));
    let truncated = Arc::new(AtomicBool::new(false));
    let timed_out = Arc::new(AtomicBool::new(false));

    let sb = Arc::clone(&stdout_buf);
    let tf = Arc::clone(&truncated);
    let stdout_handle = thread::spawn(move || drain_reader(stdout, sb, tf));

    let sb = Arc::clone(&stderr_buf);
    let tf = Arc::clone(&truncated);
    let stderr_handle = thread::spawn(move || drain_reader(stderr, sb, tf));

    let to = Arc::clone(&timed_out);
    let kill_child = Arc::clone(&child);
    let kill_handle = thread::spawn(move || {
        thread::sleep(timeout);
        to.store(true, Ordering::Relaxed);
        let _ = kill_child.kill();
    });

    let exit_status = child.wait().ok();
    let _ = kill_handle.join();
    let _ = stdout_handle.join();
    let _ = stderr_handle.join();

    let out = stdout_buf.lock().unwrap();
    let err = stderr_buf.lock().unwrap();

    Ok(CommandOutput {
        stdout: String::from_utf8_lossy(&out).to_string(),
        stderr: String::from_utf8_lossy(&err).to_string(),
        exit_code: exit_status.and_then(|s| s.code()).unwrap_or(-1),
        timed_out: timed_out.load(Ordering::Relaxed),
        truncated: truncated.load(Ordering::Relaxed),
    })
}

#[allow(dead_code)]
fn drain_reader<R: Read + Send + 'static>(
    mut reader: R,
    buf: Arc<Mutex<Vec<u8>>>,
    truncated: Arc<AtomicBool>,
) {
    let mut tmp = [0u8; 4096];
    loop {
        match reader.read(&mut tmp) {
            Ok(0) => break,
            Ok(n) => {
                let mut b = buf.lock().unwrap();
                if b.len() + n > MAX_OUTPUT_BYTES {
                    truncated.store(true, Ordering::Relaxed);
                    let avail = MAX_OUTPUT_BYTES.saturating_sub(b.len());
                    b.extend_from_slice(&tmp[..avail]);
                    break;
                }
                b.extend_from_slice(&tmp[..n]);
            }
            Err(_) => break,
        }
    }
}

// ─── Tool: Path normalization ─────────────────────────────────

#[allow(dead_code)]
pub fn to_canon(path: &str) -> PathBuf {
    let p = PathBuf::from(path);
    std::fs::canonicalize(&p).unwrap_or(p)
}

// ─── Agent Shell Session ──────────────────────────────────────

#[tauri::command]
pub async fn shell_session_open(
    state: tauri::State<'_, ShellState>,
    cwd: Option<String>,
    workspace: Option<WorkspaceEnv>,
    registry: tauri::State<'_, WorkspaceRegistry>,
) -> Result<u32, String> {
    let workspace = WorkspaceEnv::from_option(workspace);
    let cwd = authorize_spawn_cwd(&registry, cwd.as_deref(), &workspace)
        .map_err(|e| format!("cwd authorization failed: {e}"))?;

    let id = state.next_session_id.fetch_add(1, Ordering::SeqCst);
    let session = session::ShellSession::new(cwd, &workspace)?;
    state
        .sessions
        .write()
        .map_err(|e| e.to_string())?
        .insert(id, session);
    Ok(id)
}

#[tauri::command]
pub async fn shell_session_run(
    state: tauri::State<'_, ShellState>,
    session_id: u32,
    command: String,
    cwd: Option<String>,
    timeout_secs: Option<u64>,
) -> Result<session::SessionRunOutput, String> {
    let timeout = Duration::from_secs(
        timeout_secs
            .unwrap_or(DEFAULT_TIMEOUT_SECS)
            .min(MAX_TIMEOUT_SECS),
    );

    let sessions = state.sessions.read().map_err(|e| e.to_string())?;
    let session = sessions.get(&session_id).ok_or("Session not found")?;
    session.run(&command, cwd.as_deref(), timeout)
}

#[tauri::command]
pub async fn shell_session_close(
    state: tauri::State<'_, ShellState>,
    session_id: u32,
) -> Result<(), String> {
    let mut sessions = state.sessions.write().map_err(|e| e.to_string())?;
    sessions.remove(&session_id);
    Ok(())
}

// ─── Background Processes ─────────────────────────────────────

#[tauri::command]
pub async fn shell_bg_spawn(
    state: tauri::State<'_, ShellState>,
    command: String,
    cwd: Option<String>,
    workspace: Option<WorkspaceEnv>,
    registry: tauri::State<'_, WorkspaceRegistry>,
) -> Result<u32, String> {
    let workspace = WorkspaceEnv::from_option(workspace);
    let cwd = authorize_spawn_cwd(&registry, cwd.as_deref(), &workspace)
        .map_err(|e| format!("cwd authorization failed: {e}"))?;

    let id = state.next_bg_id.fetch_add(1, Ordering::SeqCst);
    let proc = background::BackgroundProc::spawn(&command, cwd, &workspace)?;
    state
        .bg
        .write()
        .map_err(|e| e.to_string())?
        .insert(id, proc);
    Ok(id)
}

#[tauri::command]
pub async fn shell_bg_logs(
    state: tauri::State<'_, ShellState>,
    process_id: u32,
    since_offset: Option<u64>,
) -> Result<(Vec<u8>, u64), String> {
    let bg = state.bg.read().map_err(|e| e.to_string())?;
    let proc = bg.get(&process_id).ok_or("Process not found")?;
    Ok(proc.read_logs(since_offset.unwrap_or(0)))
}

#[tauri::command]
pub async fn shell_bg_kill(
    state: tauri::State<'_, ShellState>,
    process_id: u32,
) -> Result<(), String> {
    let mut bg = state.bg.write().map_err(|e| e.to_string())?;
    if let Some(proc) = bg.remove(&process_id) {
        proc.kill()?;
    }
    Ok(())
}

#[tauri::command]
pub async fn shell_bg_list(
    state: tauri::State<'_, ShellState>,
) -> Result<Vec<background::BackgroundProcInfo>, String> {
    let bg = state.bg.read().map_err(|e| e.to_string())?;
    Ok(bg.iter().map(|(id, p)| p.info(*id)).collect())
}

// ─── Tests ────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_shell_state_new() {
        let state = ShellState::new();
        assert!(state.sessions.read().unwrap().is_empty());
        assert!(state.bg.read().unwrap().is_empty());
        assert_eq!(state.next_session_id.load(Ordering::SeqCst), 1);
        assert_eq!(state.next_bg_id.load(Ordering::SeqCst), 1);
    }

    #[test]
    fn test_build_oneshot_command_shell() {
        let cmd = build_oneshot_command("echo hello", &WorkspaceEnv::Local);
        #[cfg(not(windows))]
        {
            let prog = cmd.get_program().to_string_lossy();
            assert!(prog == "/bin/sh", "expected /bin/sh, got {}", prog);
        }
    }

    #[test]
    fn test_command_output_struct() {
        let output = CommandOutput {
            stdout: "hello".to_string(),
            stderr: String::new(),
            exit_code: 0,
            timed_out: false,
            truncated: false,
        };
        assert_eq!(output.stdout, "hello");
        assert_eq!(output.exit_code, 0);
        assert!(!output.timed_out);
    }

    #[test]
    fn test_wait_with_timeout_immediate() {
        let child = Command::new("true")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        let result = wait_with_timeout(child, Duration::from_secs(5)).unwrap();
        assert_eq!(result.exit_code, 0);
        assert!(!result.timed_out);
    }

    #[test]
    fn test_wait_with_timeout_timeout_expires() {
        let child = Command::new("sleep")
            .arg("10")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        let result = wait_with_timeout(child, Duration::from_millis(100)).unwrap();
        assert!(result.timed_out);
    }

    #[test]
    fn test_cap_bytes_no_truncation() {
        let data = b"hello";
        let (capped, truncated) = cap_bytes(data, 10);
        assert_eq!(capped, data);
        assert!(!truncated);
    }

    #[test]
    fn test_cap_bytes_truncates() {
        let data = b"hello world";
        let (capped, truncated) = cap_bytes(data, 5);
        assert_eq!(capped, b"hello");
        assert!(truncated);
    }

    #[test]
    fn test_to_canon_current_dir() {
        let cwd = std::env::current_dir().unwrap();
        let canon = to_canon(cwd.to_string_lossy().as_ref());
        assert!(canon.is_absolute());
    }

    #[test]
    fn test_ring_buffer_read_write() {
        use super::ringbuffer::RingBuffer;
        let rb = RingBuffer::new(100);
        rb.write(b"hello ");
        rb.write(b"world");
        let (data, _) = rb.read_since(0);
        assert_eq!(String::from_utf8_lossy(&data), "hello world");
    }
}
