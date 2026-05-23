#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod modules;

use modules::fs;
use modules::git;
use modules::net;
use modules::pty::{pty_close, pty_create, pty_resize, pty_write, PtyState};
use modules::secrets::{self, SecretsState};
use modules::shell::{self, ShellState};
use modules::workspace::{self, WorkspaceRegistry};
use std::env;
#[cfg(debug_assertions)]
use tauri::Manager;

#[tauri::command]
fn get_launch_dir() -> Option<String> {
    let cwd = env::current_dir().ok()?;
    let s = cwd.to_string_lossy().replace('\\', "/");
    if s.is_empty() || s == "/" {
        return None;
    }
    Some(s)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(
            tauri_plugin_window_state::Builder::new()
                .build(),
        )
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(PtyState::new())
        .manage(ShellState::new())
        .manage(SecretsState::default())
        .manage(WorkspaceRegistry::default())
        .invoke_handler(tauri::generate_handler![
            pty_create,
            pty_write,
            pty_resize,
            pty_close,
            fs::tree::fs_read_tree,
            fs::file::fs_read_file,
            fs::file::fs_write_file,
            fs::mutate::fs_create_dir,
            fs::mutate::fs_delete,
            fs::mutate::fs_rename,
            fs::file::fs_exists,
            fs::search::fs_search,
            fs::grep::fs_grep,
            secrets::secrets_set,
            secrets::secrets_get,
            secrets::secrets_delete,
            secrets::secrets_get_all,
            shell::shell_run_command,
            shell::shell_session_open,
            shell::shell_session_run,
            shell::shell_session_close,
            shell::shell_bg_spawn,
            shell::shell_bg_logs,
            shell::shell_bg_kill,
            shell::shell_bg_list,
            git::git_status,
            git::git_diff,
            git::git_log,
            git::git_add,
            git::git_commit,
            git::git_branches,
            git::git_checkout,
            git::git_log_detail,
            git::git_commit_files,
            git::git_remote_url,
            net::ai_http_request,
            net::ai_http_stream,
            workspace::workspace_authorize,
            workspace::workspace_current_dir,
            get_launch_dir,
        ])
        .setup(|_app| {
            workspace::init_launch_cwd();
            #[cfg(debug_assertions)]
            {
                let window = _app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Flame ADE");
}
