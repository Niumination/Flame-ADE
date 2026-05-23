use serde::Serialize;
use std::collections::HashMap;
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

// ── Extended git commands for git-history module ──────────────

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitLogDetail {
    pub sha: String,
    pub short_sha: String,
    pub subject: String,
    pub author: String,
    pub author_email: String,
    pub timestamp_secs: i64,
    pub parents: Vec<String>,
    pub insertions: i32,
    pub deletions: i32,
    pub files_changed: i32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitCommitFileChange {
    pub path: String,
    pub original_path: Option<String>,
    pub status: String,
    pub status_label: String,
    pub added: i32,
    pub removed: i32,
    pub is_binary: bool,
}

fn parse_shortstat(line: &str) -> (i32, i32, i32) {
    let parts: Vec<&str> = line.split(',').map(|s| s.trim()).collect();
    let mut files_changed = 0i32;
    let mut insertions = 0i32;
    let mut deletions = 0i32;
    for part in &parts {
        if part.contains("file") {
            files_changed = part
                .split_whitespace()
                .next()
                .and_then(|s| s.parse().ok())
                .unwrap_or(0);
        } else if part.contains("insertion") {
            insertions = part
                .split_whitespace()
                .next()
                .and_then(|s| s.parse().ok())
                .unwrap_or(0);
        } else if part.contains("deletion") {
            deletions = part
                .split_whitespace()
                .next()
                .and_then(|s| s.parse().ok())
                .unwrap_or(0);
        }
    }
    (files_changed, insertions, deletions)
}

#[tauri::command]
pub fn git_log_detail(
    path: String,
    max_count: Option<u32>,
    before_sha: Option<String>,
) -> Result<Vec<GitLogDetail>, String> {
    let count = max_count.unwrap_or(30);
    let mut args: Vec<String> = vec!["log".to_string()];
    if let Some(sha) = &before_sha {
        args.push(sha.clone());
    }
    args.push(format!("--max-count={}", count));
    args.push("---|||%H|||%h|||%s|||%an|||%ae|||%at|||%P".to_string());
    args.push("--shortstat".to_string());
    let str_args: Vec<&str> = args.iter().map(|s| s.as_str()).collect();
    let output = git(&str_args, &path)?;

    let mut commits = Vec::new();
    let mut lines = output.lines().peekable();

    while lines.peek().is_some() {
        let line = lines.next().unwrap();
        if !line.starts_with("---") {
            continue;
        }
        let rest = if line.len() > 3 { &line[3..] } else { continue };
        let fields: Vec<&str> = rest.split("|||").collect();
        if fields.len() < 7 {
            continue;
        }
        let sha = fields[0].to_string();
        let short_sha = fields[1].to_string();
        let subject = fields[2].to_string();
        let author = fields[3].to_string();
        let author_email = fields[4].to_string();
        let timestamp_secs: i64 = fields[5].parse().unwrap_or(0);
        let parents: Vec<String> = fields[6]
            .split_whitespace()
            .map(|s| s.to_string())
            .collect();

        let mut files_changed = 0i32;
        let mut insertions = 0i32;
        let mut deletions = 0i32;

        if let Some(stat_line) = lines.peek() {
            let trimmed = stat_line.trim();
            if !trimmed.is_empty() && trimmed.contains("changed") {
                lines.next();
                let (fc, ins, del) = parse_shortstat(trimmed);
                files_changed = fc;
                insertions = ins;
                deletions = del;
            }
        }

        commits.push(GitLogDetail {
            sha,
            short_sha,
            subject,
            author,
            author_email,
            timestamp_secs,
            parents,
            insertions,
            deletions,
            files_changed,
        });
    }

    Ok(commits)
}

#[tauri::command]
pub fn git_commit_files(path: String, sha: String) -> Result<Vec<GitCommitFileChange>, String> {
    let name_status = git(&["show", "--name-status", "--format=", &sha], &path)?;
    let numstat = git(
        &["diff-tree", "--no-commit-id", "-r", "-c", "--numstat", &sha],
        &path,
    )?;

    let mut numstat_map: HashMap<String, (i32, i32, bool)> = HashMap::new();
    for line in numstat.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let parts: Vec<&str> = trimmed.splitn(3, '\t').collect();
        if parts.len() >= 3 {
            let added_str = parts[0].trim();
            let removed_str = parts[1].trim();
            let is_binary = added_str == "-" && removed_str == "-";
            let added: i32 = if is_binary {
                0
            } else {
                added_str.parse().unwrap_or(0)
            };
            let removed: i32 = if is_binary {
                0
            } else {
                removed_str.parse().unwrap_or(0)
            };
            numstat_map.insert(parts[2].to_string(), (added, removed, is_binary));
        }
    }

    let mut files = Vec::new();
    for line in name_status.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        let first_char = trimmed.chars().next().unwrap_or(' ');
        if first_char == ' ' || first_char == '\t' {
            continue;
        }

        let (status, path, original_path) = if trimmed.starts_with('R') || trimmed.starts_with('C')
        {
            let parts: Vec<&str> = trimmed.splitn(3, '\t').collect();
            if parts.len() >= 3 {
                (
                    parts[0].to_string(),
                    parts[2].to_string(),
                    Some(parts[1].to_string()),
                )
            } else if parts.len() >= 2 {
                (parts[0].to_string(), parts[1].to_string(), None)
            } else {
                continue;
            }
        } else {
            let parts: Vec<&str> = trimmed.splitn(2, '\t').collect();
            if parts.len() >= 2 {
                (parts[0].to_string(), parts[1].to_string(), None)
            } else {
                continue;
            }
        };

        let status_upper = status.chars().next().unwrap_or(' ').to_string();
        let status_label = match status_upper.as_str() {
            "A" => "Added",
            "M" => "Modified",
            "D" => "Deleted",
            "R" => "Renamed",
            "C" => "Copied",
            _ => &status,
        }
        .to_string();

        let file_path = path.clone();
        let (added, removed, is_binary) = match numstat_map.get(&file_path) {
            Some(&(a, r, b)) => (a, r, b),
            None => (0, 0, false),
        };

        files.push(GitCommitFileChange {
            path: file_path,
            original_path,
            status: status_upper,
            status_label,
            added,
            removed,
            is_binary,
        });
    }

    Ok(files)
}

#[tauri::command]
pub fn git_remote_url(path: String) -> Result<String, String> {
    let url = git(&["remote", "get-url", "origin"], &path)?;
    Ok(url)
}
