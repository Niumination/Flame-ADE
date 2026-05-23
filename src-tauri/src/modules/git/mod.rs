use serde::Serialize;
use std::process::Command;

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_git_file_change_serialize() {
        let change = GitFileChange {
            status: "M".to_string(),
            path: "src/main.rs".to_string(),
        };
        let json = serde_json::to_string(&change).unwrap();
        assert!(json.contains("M"));
        assert!(json.contains("src/main.rs"));
    }

    #[test]
    fn test_git_status_serialize() {
        let status = GitStatus {
            branch: "main".to_string(),
            changes: vec![GitFileChange {
                status: "M".to_string(),
                path: "file1.rs".to_string(),
            }],
        };
        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("main"));
        assert!(json.contains("file1.rs"));
        assert!(json.contains("M"));
    }

    #[test]
    fn test_git_commit_serialize() {
        let commit = GitCommit {
            hash: "abc123".to_string(),
            message: "fix bug".to_string(),
        };
        let json = serde_json::to_string(&commit).unwrap();
        assert!(json.contains("abc123"));
        assert!(json.contains("fix bug"));
    }

    #[test]
    fn test_git_branch_serialize() {
        let branch = GitBranch {
            name: "main".to_string(),
            current: true,
        };
        let json = serde_json::to_string(&branch).unwrap();
        assert!(json.contains("main"));
        assert!(json.contains("true"));
    }

    #[test]
    fn test_git_branch_not_current() {
        let branch = GitBranch {
            name: "develop".to_string(),
            current: false,
        };
        let json = serde_json::to_string(&branch).unwrap();
        assert!(json.contains("false"));
    }

    #[test]
    fn test_git_commands_in_this_repo() {
        let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let repo_root = manifest.parent().unwrap().to_string_lossy().to_string();

        let status = git_status(repo_root.clone());
        assert!(status.is_ok());
        let status = status.unwrap();
        assert!(!status.branch.is_empty());

        let branches = git_branches(repo_root.clone());
        assert!(branches.is_ok());
        let branches = branches.unwrap();
        assert!(!branches.is_empty());
        assert!(branches.iter().any(|b| b.current));

        let log = git_log(repo_root.clone(), Some(3));
        assert!(log.is_ok());
        let log = log.unwrap();
        assert!(!log.is_empty());
        assert!(log.len() <= 3);
        assert!(!log[0].hash.is_empty());
        assert!(!log[0].message.is_empty());
    }

    #[test]
    fn test_git_commands_outside_repo() {
        let result = git_status("/tmp".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn test_git_diff_empty() {
        let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let repo_root = manifest.parent().unwrap().to_string_lossy().to_string();
        let diff = git_diff(repo_root, None);
        // diff may be empty (no uncommitted changes) — that's fine
        assert!(diff.is_ok());
    }
}

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
