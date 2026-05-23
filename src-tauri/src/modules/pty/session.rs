use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::Write;
use std::sync::{Arc, Mutex};

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

impl Default for PtyState {
    fn default() -> Self {
        Self::new()
    }
}

pub struct PtySession {
    pub writer: Arc<Mutex<Box<dyn Write + Send>>>,
    pub master: Arc<Mutex<Box<dyn portable_pty::MasterPty + Send>>>,
    pub child: Arc<Mutex<Box<dyn portable_pty::Child + Send + Sync>>>,
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pty_state_new() {
        let state = PtyState::new();
        assert!(state.sessions.lock().unwrap().is_empty());
    }

    #[test]
    fn test_create_pty_args_deserialize() {
        let json = r#"{"cols": 80, "rows": 24, "cwd": "/tmp", "shell": "/bin/zsh"}"#;
        let args: CreatePtyArgs = serde_json::from_str(json).unwrap();
        assert_eq!(args.cols, 80);
        assert_eq!(args.rows, 24);
        assert_eq!(args.cwd, Some("/tmp".to_string()));
        assert_eq!(args.shell, Some("/bin/zsh".to_string()));
    }

    #[test]
    fn test_create_pty_args_minimal() {
        let json = r#"{"cols": 80, "rows": 24}"#;
        let args: CreatePtyArgs = serde_json::from_str(json).unwrap();
        assert_eq!(args.cols, 80);
        assert_eq!(args.rows, 24);
        assert!(args.cwd.is_none());
        assert!(args.shell.is_none());
    }

    #[test]
    fn test_pty_event_serialize() {
        let event = PtyEvent {
            session_id: "abc-123".to_string(),
            data: "hello".to_string(),
        };
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("abc-123"));
        assert!(json.contains("hello"));
    }

    #[test]
    fn test_pty_exit_event_serialize() {
        let event = PtyExitEvent {
            session_id: "abc-123".to_string(),
            exit_code: Some(0),
        };
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("abc-123"));
        assert!(json.contains("0"));
    }

    #[test]
    fn test_pty_exit_event_none_code() {
        let event = PtyExitEvent {
            session_id: "abc-123".to_string(),
            exit_code: None,
        };
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("null"));
    }
}
