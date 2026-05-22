use portable_pty::{Child, CommandBuilder, MasterPty, NativePtySystem, PtySize, PtySystem};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{Emitter, State};

const SCRIPTS_DIR: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/src/modules/pty/scripts");

fn prepare_zdotdir() -> PathBuf {
    let tmp = std::env::temp_dir().join("flame-ade-zdotdir");
    let _ = fs::create_dir_all(&tmp);

    // Copy script files from source to temp dir if not already there
    let src = PathBuf::from(SCRIPTS_DIR);
    for entry in ["zshenv.zsh", "zshrc.zsh", "bashrc.bash"] {
        let dst = tmp.join(entry);
        let src_file = src.join(entry);
        if src_file.exists()
            && (!dst.exists()
                || dst.metadata().ok().and_then(|m| m.modified().ok())
                    < src_file.metadata().ok().and_then(|m| m.modified().ok()))
        {
            let _ = fs::copy(&src_file, &dst);
        }
    }

    // Create/update .zshenv
    let zshenv_link = tmp.join(".zshenv");
    let _ = fs::copy(tmp.join("zshenv.zsh"), &zshenv_link);

    // Create/update .zshrc
    let zshrc_link = tmp.join(".zshrc");
    let _ = fs::copy(tmp.join("zshrc.zsh"), &zshrc_link);

    tmp
}

pub struct PtyState {
    pub sessions: Arc<Mutex<HashMap<String, PtySession>>>,
}

impl PtyState {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

pub struct PtySession {
    pub writer: Arc<Mutex<Box<dyn Write + Send>>>,
    pub master: Arc<Mutex<Box<dyn MasterPty + Send>>>,
    pub child: Arc<Mutex<Box<dyn Child + Send + Sync>>>,
}

#[derive(Clone, Serialize)]
pub struct PtyEvent {
    pub session_id: String,
    pub data: String,
}

#[derive(Clone, Serialize)]
pub struct PtyExitEvent {
    pub session_id: String,
    pub exit_code: Option<u32>,
}

#[derive(Deserialize)]
pub struct CreatePtyArgs {
    pub cols: u16,
    pub rows: u16,
    pub cwd: Option<String>,
    pub shell: Option<String>,
}

#[tauri::command]
pub fn pty_create(
    state: State<PtyState>,
    app: tauri::AppHandle,
    args: CreatePtyArgs,
) -> Result<String, String> {
    let pty_system = NativePtySystem::default();

    let pair = pty_system
        .openpty(PtySize {
            rows: args.rows as u16,
            cols: args.cols as u16,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let shell = if let Some(s) = &args.shell {
        s.clone()
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string())
    };

    let mut cmd = if shell.ends_with("zsh") {
        let real_zdotdir = std::env::var("ZDOTDIR").unwrap_or_else(|_| {
            dirs::home_dir()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default()
        });
        let zdotdir = prepare_zdotdir();
        let mut c = CommandBuilder::new(&shell);
        c.env("ZDOTDIR", zdotdir.to_string_lossy().as_ref());
        c.env("FLAME_ADE_REAL_ZDOTDIR", &real_zdotdir);
        c
    } else if shell.ends_with("bash") {
        let mut c = CommandBuilder::new(&shell);
        let bashrc = prepare_zdotdir().join("bashrc.bash");
        c.arg("--rcfile");
        c.arg(bashrc.to_string_lossy().as_ref());
        c.arg("--noprofile");
        c
    } else {
        CommandBuilder::new(&shell)
    };

    if let Some(cwd) = &args.cwd {
        cmd.cwd(cwd);
    }

    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;

    let session_id = uuid::Uuid::new_v4().to_string();

    let writer: Box<dyn Write + Send> = pair.master.take_writer().map_err(|e| e.to_string())?;
    let writer = Arc::new(Mutex::new(writer));
    let master = Arc::new(Mutex::new(pair.master));
    let child = Arc::new(Mutex::new(child));

    let session = PtySession {
        writer: Arc::clone(&writer),
        master: Arc::clone(&master),
        child: Arc::clone(&child),
    };

    state
        .sessions
        .lock()
        .unwrap()
        .insert(session_id.clone(), session);

    let sid = session_id.clone();
    let sessions = Arc::clone(&state.sessions);

    std::thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            let sessions = sessions.lock().unwrap();
            let session = sessions.get(&sid);
            if session.is_none() {
                break;
            }
            let master = Arc::clone(&session.unwrap().master);
            drop(sessions);

            let master_guard = master.lock().unwrap();
            let reader = master_guard.try_clone_reader();
            drop(master_guard);

            if let Ok(mut reader) = reader {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        let data = String::from_utf8_lossy(&buf[..n]).to_string();
                        let _ = app.emit(
                            "pty-data",
                            PtyEvent {
                                session_id: sid.clone(),
                                data,
                            },
                        );
                    }
                    Err(_) => break,
                }
            } else {
                break;
            }
        }

        let sessions = sessions.lock().unwrap();
        if let Some(session) = sessions.get(&sid) {
            let mut child_guard = session.child.lock().unwrap();
            let exit_code = child_guard.try_wait().ok().flatten().map(|s| s.exit_code());
            drop(child_guard);
            drop(sessions);
            let _ = app.emit(
                "pty-exit",
                PtyExitEvent {
                    session_id: sid.clone(),
                    exit_code,
                },
            );
        }
    });

    Ok(session_id)
}

#[tauri::command]
pub fn pty_write(state: State<PtyState>, session_id: String, data: String) -> Result<(), String> {
    let sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    let session = sessions
        .get(&session_id)
        .ok_or_else(|| "Session not found".to_string())?;

    let mut writer = session.writer.lock().map_err(|e| e.to_string())?;
    writer
        .write_all(data.as_bytes())
        .map_err(|e| e.to_string())?;
    writer.flush().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn pty_resize(
    state: State<PtyState>,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    let session = sessions
        .get(&session_id)
        .ok_or_else(|| "Session not found".to_string())?;

    let master = session.master.lock().map_err(|e| e.to_string())?;
    master
        .resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn pty_close(state: State<PtyState>, session_id: String) -> Result<(), String> {
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    if let Some(session) = sessions.remove(&session_id) {
        let mut child = session.child.lock().map_err(|e| e.to_string())?;
        child.kill().map_err(|e| e.to_string())?;
    }
    Ok(())
}
