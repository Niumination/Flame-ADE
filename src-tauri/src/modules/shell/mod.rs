use serde::Serialize;
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, ChildStdin, Command as StdCommand, Stdio};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;
use std::time::Duration;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_shell_state_new() {
        let state = ShellState::new();
        assert!(state.sessions.lock().unwrap().is_empty());
        assert!(state.bg_processes.lock().unwrap().is_empty());
    }

    #[test]
    fn test_get_shell_default() {
        std::env::remove_var("SHELL");
        let shell = get_shell();
        assert_eq!(shell, "/bin/bash");
    }

    #[test]
    fn test_get_shell_from_env() {
        std::env::set_var("SHELL", "/bin/zsh");
        let shell = get_shell();
        assert_eq!(shell, "/bin/zsh");
        std::env::set_var("SHELL", "/bin/bash");
    }

    #[test]
    fn test_shell_run_result_struct() {
        let result = ShellRunResult {
            stdout: "hello".to_string(),
            stderr: String::new(),
            exit_code: 0,
        };
        assert_eq!(result.stdout, "hello");
        assert_eq!(result.exit_code, 0);
    }

    #[test]
    fn test_wait_with_timeout_immediate() {
        let child = StdCommand::new("true")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        let result = wait_with_timeout(child, Duration::from_secs(5));
        assert!(result.is_ok());
        let output = result.unwrap();
        assert!(output.status.success());
    }

    #[test]
    fn test_wait_with_timeout_timeout_expires() {
        let child = StdCommand::new("sleep")
            .arg("10")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        let result = wait_with_timeout(child, Duration::from_millis(100));
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "timeout");
    }
}

// ─── Shell Session ───────────────────────────────────────────

pub struct ShellSession {
    child: Child,
    stdin: Arc<Mutex<ChildStdin>>,
    buffer: Arc<Mutex<String>>,
    _stdout_handle: JoinHandle<()>,
    _stderr_handle: JoinHandle<()>,
}

pub struct ShellBgProcess {
    child: Mutex<Child>,
    buffer: Arc<Mutex<String>>,
    _stdout_handle: JoinHandle<()>,
    _stderr_handle: JoinHandle<()>,
}

pub struct ShellState {
    pub sessions: Arc<Mutex<HashMap<String, ShellSession>>>,
    pub bg_processes: Arc<Mutex<HashMap<String, ShellBgProcess>>>,
}

impl ShellState {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
            bg_processes: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

#[derive(Serialize)]
pub struct ShellRunResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

#[tauri::command]
pub async fn shell_run_command(
    command: String,
    cwd: Option<String>,
    timeout_secs: Option<u64>,
) -> Result<ShellRunResult, String> {
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());
    let mut cmd = StdCommand::new(&shell);
    cmd.arg("-c")
        .arg(&command)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    if let Some(dir) = &cwd {
        cmd.current_dir(dir);
    }

    let child = cmd.spawn().map_err(|e| e.to_string())?;
    let timeout = Duration::from_secs(timeout_secs.unwrap_or(30));

    let output = match wait_with_timeout(child, timeout) {
        Ok(output) => output,
        Err(_) => return Err("Command timed out".to_string()),
    };

    Ok(ShellRunResult {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}

fn wait_with_timeout(
    mut child: std::process::Child,
    timeout: Duration,
) -> Result<std::process::Output, String> {
    let start = std::time::Instant::now();
    loop {
        if let Some(status) = child.try_wait().map_err(|e| e.to_string())? {
            let output = child.wait_with_output().map_err(|e| e.to_string())?;
            return Ok(std::process::Output {
                status,
                stdout: output.stdout,
                stderr: output.stderr,
            });
        }
        if start.elapsed() >= timeout {
            let _ = child.kill();
            let _ = child.wait();
            return Err("timeout".to_string());
        }
        std::thread::sleep(Duration::from_millis(50));
    }
}

fn get_shell() -> String {
    std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string())
}

#[tauri::command]
pub async fn shell_session_create(
    state: tauri::State<'_, ShellState>,
    cwd: Option<String>,
) -> Result<String, String> {
    let mut child = StdCommand::new(get_shell())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .current_dir(cwd.unwrap_or_else(|| std::env::current_dir().unwrap().to_string_lossy().to_string()))
        .spawn()
        .map_err(|e| e.to_string())?;

    let stdin = child.stdin.take().ok_or("No stdin")?;
    let stdout = child.stdout.take().ok_or("No stdout")?;
    let stderr = child.stderr.take().ok_or("No stderr")?;

    let buffer: Arc<Mutex<String>> = Arc::new(Mutex::new(String::new()));
    let buf_clone = Arc::clone(&buffer);

    let stdout_handle = std::thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().map_while(Result::ok) {
            let mut b = buf_clone.lock().unwrap();
            b.push_str(&line);
            b.push('\n');
            if b.len() > 1024 * 1024 {
                let trim = b.len() - 512 * 1024;
                let _ = b.drain(..trim);
            }
        }
    });

    let buf_clone2 = Arc::clone(&buffer);
    let stderr_handle = std::thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines().map_while(Result::ok) {
            let mut b = buf_clone2.lock().unwrap();
            b.push_str(&line);
            b.push('\n');
            if b.len() > 1024 * 1024 {
                let trim = b.len() - 512 * 1024;
                let _ = b.drain(..trim);
            }
        }
    });

    let id = uuid::Uuid::new_v4().to_string();
    let session = ShellSession {
        child,
        stdin: Arc::new(Mutex::new(stdin)),
        buffer: Arc::clone(&buffer),
        _stdout_handle: stdout_handle,
        _stderr_handle: stderr_handle,
    };

    state.sessions.lock().map_err(|e| e.to_string())?.insert(id.clone(), session);
    Ok(id)
}

#[tauri::command]
pub async fn shell_session_write(
    state: tauri::State<'_, ShellState>,
    session_id: String,
    input: String,
) -> Result<(), String> {
    let sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    let session = sessions.get(&session_id).ok_or("Session not found")?;
    let mut stdin = session.stdin.lock().map_err(|e| e.to_string())?;
    writeln!(stdin, "{}", input).map_err(|e| e.to_string())?;
    stdin.flush().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn shell_session_read(
    state: tauri::State<'_, ShellState>,
    session_id: String,
) -> Result<String, String> {
    let sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    let session = sessions.get(&session_id).ok_or("Session not found")?;
    let buf = session.buffer.lock().map_err(|e| e.to_string())?;
    Ok(buf.clone())
}

#[tauri::command]
pub async fn shell_session_close(
    state: tauri::State<'_, ShellState>,
    session_id: String,
) -> Result<String, String> {
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    if let Some(mut session) = sessions.remove(&session_id) {
        let _ = session.child.kill();
        let _ = session.child.wait();
        let buf = session.buffer.lock().map_err(|e| e.to_string())?;
        Ok(buf.clone())
    } else {
        Err("Session not found".to_string())
    }
}

// ─── Background Processes ────────────────────────────────────

#[tauri::command]
pub async fn shell_bg_spawn(
    state: tauri::State<'_, ShellState>,
    command: String,
    cwd: Option<String>,
) -> Result<String, String> {
    let mut child = StdCommand::new(get_shell())
        .arg("-c")
        .arg(&command)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .current_dir(cwd.unwrap_or_else(|| std::env::current_dir().unwrap().to_string_lossy().to_string()))
        .spawn()
        .map_err(|e| e.to_string())?;

    let stdout = child.stdout.take().ok_or("No stdout")?;
    let stderr = child.stderr.take().ok_or("No stderr")?;

    let buffer: Arc<Mutex<String>> = Arc::new(Mutex::new(String::new()));
    let buf1 = Arc::clone(&buffer);
    let stdout_handle = std::thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().map_while(Result::ok) {
            let mut b = buf1.lock().unwrap();
            b.push_str(&line);
            b.push('\n');
            let lines: Vec<_> = b.lines().collect();
            if lines.len() > 1024 {
                let trim: String = lines[lines.len() - 1024..].join("\n");
                *b = trim;
                b.push('\n');
            }
        }
    });

    let buf2 = Arc::clone(&buffer);
    let stderr_handle = std::thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines().map_while(Result::ok) {
            let mut b = buf2.lock().unwrap();
            b.push_str(&line);
            b.push('\n');
            let lines: Vec<_> = b.lines().collect();
            if lines.len() > 1024 {
                let trim: String = lines[lines.len() - 1024..].join("\n");
                *b = trim;
                b.push('\n');
            }
        }
    });

    let id = uuid::Uuid::new_v4().to_string();
    let bg = ShellBgProcess {
        child: Mutex::new(child),
        buffer: Arc::clone(&buffer),
        _stdout_handle: stdout_handle,
        _stderr_handle: stderr_handle,
    };

    state.bg_processes.lock().map_err(|e| e.to_string())?.insert(id.clone(), bg);
    Ok(id)
}

#[tauri::command]
pub async fn shell_bg_read(
    state: tauri::State<'_, ShellState>,
    session_id: String,
) -> Result<String, String> {
    let processes = state.bg_processes.lock().map_err(|e| e.to_string())?;
    let process = processes.get(&session_id).ok_or("Process not found")?;
    let buf = process.buffer.lock().map_err(|e| e.to_string())?;
    Ok(buf.clone())
}

#[tauri::command]
pub async fn shell_bg_kill(
    state: tauri::State<'_, ShellState>,
    session_id: String,
) -> Result<(), String> {
    let mut processes = state.bg_processes.lock().map_err(|e| e.to_string())?;
    if let Some(process) = processes.remove(&session_id) {
        let mut child = process.child.lock().map_err(|e| e.to_string())?;
        let _ = child.kill();
        let _ = child.wait();
        Ok(())
    } else {
        Err("Process not found".to_string())
    }
}
