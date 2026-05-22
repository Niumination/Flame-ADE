use serde::Serialize;
use std::process::Command;

#[derive(Debug, Serialize)]
pub struct GitFileChange {
    pub status: String,
    pub path: String,
}

#[derive(Debug, Serialize)]
pub struct GitStatus {
    pub branch: String,
    pub changes: Vec<GitFileChange>,
}

#[derive(Debug, Serialize)]
pub struct GitCommit {
    pub hash: String,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct GitBranch {
    pub name: String,
    pub current: bool,
}

fn git(args: &[&str], cwd: &str) -> Result<String, String> {
    Command::new("git")
        .args(args)
        .current_dir(cwd)
        .output()
        .map_err(|e| e.to_string())
        .and_then(|out| {
            if out.status.success() {
                Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
            } else {
                let stderr = String::from_utf8_lossy(&out.stderr).trim().to_string();
                Err(if stderr.is_empty() {
                    "git command failed".to_string()
                } else {
                    stderr
                })
            }
        })
}

#[tauri::command]
pub fn git_status(path: String) -> Result<GitStatus, String> {
    let branch = git(&["rev-parse", "--abbrev-ref", "HEAD"], &path)?;

    let output = git(&["status", "--porcelain", "-u"], &path)?;
    let mut changes = Vec::new();
    for line in output.lines() {
        if line.len() >= 3 {
            let status = line[..2].trim().to_string();
            let file_path = line[3..].to_string();
            changes.push(GitFileChange {
                status,
                path: file_path,
            });
        }
    }

    Ok(GitStatus { branch, changes })
}

#[tauri::command]
pub fn git_diff(path: String, file: Option<String>) -> Result<String, String> {
    let mut args = vec!["diff", "--no-color"];
    if let Some(f) = &file {
        args.push(f);
    }
    git(&args, &path)
}

#[tauri::command]
pub fn git_log(path: String, max_count: Option<u32>) -> Result<Vec<GitCommit>, String> {
    let count = max_count.unwrap_or(10);
    let output = git(
        &["log", "--oneline", &format!("--max-count={}", count)],
        &path,
    )?;

    Ok(output
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            if line.is_empty() {
                return None;
            }
            let parts: Vec<&str> = line.splitn(2, ' ').collect();
            Some(GitCommit {
                hash: parts.first()?.to_string(),
                message: parts.get(1).unwrap_or(&"").to_string(),
            })
        })
        .collect())
}

#[tauri::command]
pub fn git_add(path: String, files: Vec<String>) -> Result<(), String> {
    let mut args = vec!["add"];
    args.extend(files.iter().map(|s| s.as_str()));
    git(&args, &path)?;
    Ok(())
}

#[tauri::command]
pub fn git_commit(path: String, message: String) -> Result<(), String> {
    git(&["commit", "-m", &message], &path)?;
    Ok(())
}

#[tauri::command]
pub fn git_branches(path: String) -> Result<Vec<GitBranch>, String> {
    let output = git(&["branch"], &path)?;
    Ok(output
        .lines()
        .map(|line| GitBranch {
            name: line.trim_start_matches("* ").trim().to_string(),
            current: line.starts_with('*'),
        })
        .collect())
}

#[tauri::command]
pub fn git_checkout(path: String, branch: String) -> Result<(), String> {
    git(&["checkout", &branch], &path)?;
    Ok(())
}
