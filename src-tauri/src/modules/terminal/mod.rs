use serde::Serialize;
use std::process::Command;

#[derive(Debug, Clone, Serialize)]
pub struct TerminalApp {
    pub id: String,
    pub name: String,
    pub path: String,
}

#[tauri::command]
pub fn terminal_list_apps() -> Vec<TerminalApp> {
    let mut apps = Vec::new();

    #[cfg(target_os = "macos")]
    {
        apps.push(TerminalApp {
            id: "terminal".into(),
            name: "Terminal.app".into(),
            path: "/System/Applications/Utilities/Terminal.app".into(),
        });

        let known: [(&str, &str); 7] = [
            ("iterm2", "iTerm2"),
            ("warp", "Warp"),
            ("kitty", "kitty"),
            ("alacritty", "Alacritty"),
            ("hyper", "Hyper"),
            ("ghostty", "Ghostty"),
            ("wezterm", "WezTerm"),
        ];

        for (id, name) in &known {
            let path = format!("/Applications/{}.app", name);
            if std::path::Path::new(&path).exists() {
                apps.push(TerminalApp {
                    id: id.to_string(),
                    name: name.to_string(),
                    path,
                });
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        apps.push(TerminalApp {
            id: "cmd".into(),
            name: "Command Prompt".into(),
            path: "cmd.exe".into(),
        });
        apps.push(TerminalApp {
            id: "pwsh".into(),
            name: "PowerShell".into(),
            path: "pwsh.exe".into(),
        });
        let wt_path =
            std::env::var("LOCALAPPDATA").unwrap_or_default() + "\\Microsoft\\WindowsApps\\wt.exe";
        if std::path::Path::new(&wt_path).exists() {
            apps.push(TerminalApp {
                id: "wt".into(),
                name: "Windows Terminal".into(),
                path: wt_path,
            });
        }
    }

    #[cfg(target_os = "linux")]
    {
        let known: [(&str, &str); 5] = [
            ("gnome-terminal", "gnome-terminal"),
            ("konsole", "konsole"),
            ("xterm", "xterm"),
            ("kitty", "kitty"),
            ("alacritty", "alacritty"),
        ];
        for (id, name) in &known {
            let in_path = Command::new("which")
                .arg(name)
                .output()
                .ok()
                .and_then(|o| o.status.success().then_some(()));
            let at_usr = std::path::Path::new(&format!("/usr/bin/{}", name)).exists();
            if in_path.is_some() || at_usr {
                apps.push(TerminalApp {
                    id: id.to_string(),
                    name: name.to_string(),
                    path: format!("/usr/bin/{}", name),
                });
            }
        }
    }

    apps
}

#[tauri::command]
pub fn terminal_open(cwd: String, terminal_id: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let escaped = cwd.replace('"', "\\\"");
        match terminal_id.as_str() {
            "terminal" => {
                let script = format!(
                    "tell app \"Terminal\" to do script \"cd \\\"{}\\\" && clear\"",
                    escaped
                );
                Command::new("osascript")
                    .args(["-e", &script])
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
            "kitty" => {
                Command::new("open")
                    .args(["-a", "kitty", "--args", "--directory", &cwd])
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
            "warp" => {
                Command::new("open")
                    .args(["-a", "Warp", &cwd])
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
            _ => {
                let app_path = format!("/Applications/{}.app", terminal_id);
                Command::new("open")
                    .args(["-a", &app_path, &cwd])
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        match terminal_id.as_str() {
            "cmd" => {
                Command::new("cmd")
                    .args(["/K", &format!("cd /d {}", cwd)])
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
            "pwsh" => {
                Command::new("pwsh")
                    .args(["-NoExit", "-Command", &format!("cd {}", cwd)])
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
            "wt" => {
                Command::new("wt")
                    .args(["-d", &cwd])
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
            _ => {
                Command::new(&terminal_id)
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        match terminal_id.as_str() {
            "gnome-terminal" => {
                Command::new("gnome-terminal")
                    .args(["--working-directory", &cwd])
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
            "konsole" => {
                Command::new("konsole")
                    .args(["--workdir", &cwd])
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
            "kitty" => {
                Command::new("kitty")
                    .args(["--directory", &cwd])
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
            _ => {
                Command::new(&terminal_id)
                    .arg(&cwd)
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
        }
    }

    Ok(())
}
