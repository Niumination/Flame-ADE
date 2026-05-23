#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod modules;

use modules::fs;
use modules::git;
use modules::pty::{self, PtyState};
use modules::secrets;
use modules::shell::{self, ShellState};
use modules::terminal;
#[cfg(debug_assertions)]
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(PtyState::new())
        .manage(ShellState::new())
        .invoke_handler(tauri::generate_handler![
            pty::pty_create,
            pty::pty_write,
            pty::pty_resize,
            pty::pty_close,
            fs::fs_read_tree,
            fs::fs_read_file,
            fs::fs_write_file,
            fs::fs_create_dir,
            fs::fs_delete,
            fs::fs_rename,
            fs::fs_exists,
            fs::fs_search,
            fs::fs_grep,
            secrets::secrets_set,
            secrets::secrets_get,
            secrets::secrets_delete,
            shell::shell_run_command,
            shell::shell_session_create,
            shell::shell_session_write,
            shell::shell_session_read,
            shell::shell_session_close,
            shell::shell_bg_spawn,
            shell::shell_bg_read,
            shell::shell_bg_kill,
            git::git_status,
            git::git_diff,
            git::git_log,
            git::git_add,
            git::git_commit,
            git::git_branches,
            git::git_checkout,
            terminal::terminal_list_apps,
            terminal::terminal_open,
        ])
        .setup(|_app| {
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
