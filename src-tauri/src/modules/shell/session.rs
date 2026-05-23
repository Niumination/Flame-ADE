use std::io::{Read, Write};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;
use std::time::{Duration, Instant};

use serde::Serialize;
use shared_child::SharedChild;

use crate::modules::proc::hide_console;
use crate::modules::shell::ringbuffer::RingBuffer;
use crate::modules::workspace::WorkspaceEnv;

#[derive(Serialize)]
pub struct SessionRunOutput {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub timed_out: bool,
}

pub struct ShellSession {
    #[allow(dead_code)]
    pub child: Arc<SharedChild>,
    pub stdin: Arc<Mutex<std::process::ChildStdin>>,
    stdout_rb: Arc<RingBuffer>,
    stderr_rb: Arc<RingBuffer>,
    stdout_offset: AtomicU64,
    stderr_offset: AtomicU64,
    _stdout_handle: JoinHandle<()>,
    _stderr_handle: JoinHandle<()>,
}

impl ShellSession {
    pub fn new(initial_cwd: Option<PathBuf>, _workspace: &WorkspaceEnv) -> Result<Self, String> {
        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());
        let mut cmd = Command::new(&shell);
        cmd.stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        if let Some(dir) = initial_cwd {
            cmd.current_dir(dir);
        }
        hide_console(&mut cmd);

        let child = SharedChild::spawn(&mut cmd).map_err(|e| e.to_string())?;

        let stdin = child.take_stdin().ok_or("failed to open stdin")?;
        let mut stdout = child.take_stdout().ok_or("failed to open stdout")?;
        let mut stderr = child.take_stderr().ok_or("failed to open stderr")?;

        let stdout_rb = Arc::new(RingBuffer::new(1024 * 1024));
        let stderr_rb = Arc::new(RingBuffer::new(1024 * 1024));

        let rb_out = Arc::clone(&stdout_rb);
        let stdout_handle = std::thread::spawn(move || {
            let mut buf = [0u8; 4096];
            loop {
                match stdout.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => rb_out.write(&buf[..n]),
                    Err(_) => break,
                }
            }
        });

        let rb_err = Arc::clone(&stderr_rb);
        let stderr_handle = std::thread::spawn(move || {
            let mut buf = [0u8; 4096];
            loop {
                match stderr.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => rb_err.write(&buf[..n]),
                    Err(_) => break,
                }
            }
        });

        Ok(Self {
            child: Arc::new(child),
            stdin: Arc::new(Mutex::new(stdin)),
            stdout_rb,
            stderr_rb,
            stdout_offset: AtomicU64::new(0),
            stderr_offset: AtomicU64::new(0),
            _stdout_handle: stdout_handle,
            _stderr_handle: stderr_handle,
        })
    }

    pub fn run(
        &self,
        command: &str,
        cwd: Option<&str>,
        timeout: Duration,
    ) -> Result<SessionRunOutput, String> {
        let marker = uuid::Uuid::new_v4().to_string();
        let search = format!("__FLAME_EXIT_{}__", marker);

        let full_cmd = if let Some(dir) = cwd {
            format!("cd {} && ({}); echo \"{}$?\"\n", dir, command, search)
        } else {
            format!("({}); echo \"{}$?\"\n", command, search)
        };

        {
            let mut stdin = self.stdin.lock().map_err(|e| e.to_string())?;
            stdin
                .write_all(full_cmd.as_bytes())
                .map_err(|e| e.to_string())?;
            stdin.flush().map_err(|e| e.to_string())?;
        }

        let start = Instant::now();

        loop {
            if start.elapsed() >= timeout {
                return Ok(SessionRunOutput {
                    stdout: String::new(),
                    stderr: String::new(),
                    exit_code: -1,
                    timed_out: true,
                });
            }

            let (stdout_data, new_stdout_off) = self
                .stdout_rb
                .read_since(self.stdout_offset.load(Ordering::Relaxed));
            let (stderr_data, new_stderr_off) = self
                .stderr_rb
                .read_since(self.stderr_offset.load(Ordering::Relaxed));

            let out_str = String::from_utf8_lossy(&stdout_data);
            if let Some(pos) = out_str.find(&search) {
                let rest = &out_str[pos + search.len()..];
                let exit_code: i32 = rest
                    .split_whitespace()
                    .next()
                    .and_then(|s| s.parse().ok())
                    .unwrap_or(-1);

                let marker_line_end =
                    pos + search.len() + rest.find('\n').unwrap_or(rest.len()) + 1;
                let absolute_marker_end =
                    self.stdout_offset.load(Ordering::Relaxed) + marker_line_end as u64;
                self.stdout_offset
                    .store(absolute_marker_end, Ordering::Relaxed);

                let output_before_marker = &out_str[..pos];

                return Ok(SessionRunOutput {
                    stdout: output_before_marker.to_string(),
                    stderr: String::from_utf8_lossy(&stderr_data).to_string(),
                    exit_code,
                    timed_out: false,
                });
            }

            self.stdout_offset.store(new_stdout_off, Ordering::Relaxed);
            self.stderr_offset.store(new_stderr_off, Ordering::Relaxed);

            std::thread::sleep(Duration::from_millis(10));
        }
    }
}
