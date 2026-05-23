use std::io::Read;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;
use std::time::Instant;

use serde::Serialize;

use crate::modules::proc::hide_console;
use crate::modules::shell::ringbuffer::RingBuffer;
use crate::modules::workspace::WorkspaceEnv;

pub struct BackgroundProc {
    child: Mutex<Child>,
    ringbuffer: Arc<RingBuffer>,
    command: String,
    cwd: Option<PathBuf>,
    spawned_at: Instant,
    _stdout_handle: JoinHandle<()>,
    _stderr_handle: JoinHandle<()>,
}

#[derive(Serialize, Clone)]
pub struct BackgroundProcInfo {
    pub id: u32,
    pub command: String,
    pub cwd: Option<String>,
    pub running: bool,
    pub uptime_secs: u64,
}

impl BackgroundProc {
    pub fn spawn(
        command: &str,
        cwd: Option<PathBuf>,
        _workspace: &WorkspaceEnv,
    ) -> Result<Self, String> {
        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());
        let mut cmd = Command::new(&shell);
        cmd.arg("-c")
            .arg(command)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        if let Some(ref dir) = cwd {
            cmd.current_dir(dir);
        }
        hide_console(&mut cmd);

        let mut child = cmd.spawn().map_err(|e| e.to_string())?;

        let stdout = child.stdout.take().ok_or("failed to open stdout")?;
        let stderr = child.stderr.take().ok_or("failed to open stderr")?;

        let ringbuffer = Arc::new(RingBuffer::new(256 * 1024));

        let rb_out = Arc::clone(&ringbuffer);
        let stdout_handle = std::thread::spawn(move || {
            let mut buf = [0u8; 4096];
            let mut reader = stdout;
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => rb_out.write(&buf[..n]),
                    Err(_) => break,
                }
            }
        });

        let rb_err = Arc::clone(&ringbuffer);
        let stderr_handle = std::thread::spawn(move || {
            let mut buf = [0u8; 4096];
            let mut reader = stderr;
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => rb_err.write(&buf[..n]),
                    Err(_) => break,
                }
            }
        });

        Ok(Self {
            child: Mutex::new(child),
            ringbuffer,
            command: command.to_string(),
            cwd,
            spawned_at: Instant::now(),
            _stdout_handle: stdout_handle,
            _stderr_handle: stderr_handle,
        })
    }

    pub fn read_logs(&self, since_offset: u64) -> (Vec<u8>, u64) {
        self.ringbuffer.read_since(since_offset)
    }

    pub fn kill(&self) -> Result<(), String> {
        let mut child = self.child.lock().map_err(|e| e.to_string())?;
        let _ = child.kill();
        let _ = child.wait();
        Ok(())
    }

    pub fn running(&self) -> bool {
        self.child
            .lock()
            .ok()
            .and_then(|mut c| c.try_wait().ok())
            .flatten()
            .is_none()
    }

    pub fn info(&self, id: u32) -> BackgroundProcInfo {
        BackgroundProcInfo {
            id,
            command: self.command.clone(),
            cwd: self.cwd.as_ref().map(|p| p.to_string_lossy().to_string()),
            running: self.running(),
            uptime_secs: self.spawned_at.elapsed().as_secs(),
        }
    }
}
