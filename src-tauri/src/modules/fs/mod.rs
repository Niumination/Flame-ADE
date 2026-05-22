use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri;
use walkdir::WalkDir;

const MAX_TREE_DEPTH: usize = 3;
const MAX_TREE_ENTRIES: usize = 5000;

const DENIED_PATH_COMPONENTS: &[&str] = &[".env", ".ssh", "id_rsa", ".pem", ".key", "credentials"];

fn sanitize_path(path: &str) -> Result<PathBuf, String> {
    let p = PathBuf::from(path);

    for component in p.components() {
        if let Some(s) = component.as_os_str().to_str() {
            if DENIED_PATH_COMPONENTS
                .iter()
                .any(|d| s.to_lowercase().contains(d))
            {
                return Err(format!(
                    "Access denied: path contains sensitive component: {}",
                    s
                ));
            }
        }
    }

    if p.exists() {
        std::fs::canonicalize(&p).map_err(|e| e.to_string())
    } else if let Some(parent) = p.parent() {
        if !parent.as_os_str().is_empty() && parent.exists() {
            let canonical_parent = std::fs::canonicalize(parent).map_err(|e| e.to_string())?;
            let file_name = p.file_name().ok_or("Invalid path")?;
            Ok(canonical_parent.join(file_name))
        } else {
            Ok(p)
        }
    } else {
        Ok(p)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub kind: String,
    pub size: Option<u64>,
    pub children: Option<Vec<FileEntry>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GrepMatch {
    pub path: String,
    pub line: usize,
    pub content: String,
}

#[tauri::command]
pub fn fs_read_tree(path: String, depth: Option<usize>) -> Result<Vec<FileEntry>, String> {
    let max_depth = depth.unwrap_or(2).min(MAX_TREE_DEPTH);
    let root = sanitize_path(&path)?;
    if !root.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    let mut entries = Vec::new();
    let mut count = 0;

    if root.is_dir() {
        let read_dir = fs::read_dir(&root).map_err(|e| e.to_string())?;
        for entry in read_dir {
            if count >= MAX_TREE_ENTRIES {
                break;
            }
            let entry = entry.map_err(|e| e.to_string())?;
            let file_type = entry.file_type().map_err(|e| e.to_string())?;
            let name = entry.file_name().to_string_lossy().to_string();

            if name.starts_with('.') {
                continue;
            }

            let entry_path = entry.path();
            let kind = if file_type.is_dir() {
                "directory".to_string()
            } else if file_type.is_symlink() {
                "symlink".to_string()
            } else {
                "file".to_string()
            };

            let children = if file_type.is_dir() && max_depth > 0 {
                Some(read_children(&entry_path, max_depth - 1, &mut count)?)
            } else {
                None
            };

            let size = if file_type.is_file() {
                Some(entry.metadata().map_err(|e| e.to_string())?.len())
            } else {
                None
            };

            entries.push(FileEntry {
                name,
                path: entry_path.to_string_lossy().to_string(),
                kind,
                size,
                children,
            });
            count += 1;
        }
    }

    // Sort: directories first, then files, alphabetically
    entries.sort_by(|a, b| {
        if a.kind != b.kind {
            if a.kind == "directory" {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            }
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(entries)
}

fn read_children(dir: &Path, depth: usize, count: &mut usize) -> Result<Vec<FileEntry>, String> {
    let mut entries = Vec::new();
    if depth == 0 || *count >= MAX_TREE_ENTRIES {
        return Ok(entries);
    }

    let read_dir = fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in read_dir {
        if *count >= MAX_TREE_ENTRIES {
            break;
        }
        let entry = entry.map_err(|e| e.to_string())?;
        let file_type = entry.file_type().map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();

        if name.starts_with('.') {
            continue;
        }

        let entry_path = entry.path();
        let kind = if file_type.is_dir() {
            "directory".to_string()
        } else if file_type.is_symlink() {
            "symlink".to_string()
        } else {
            "file".to_string()
        };

        let children = if file_type.is_dir() && depth > 0 {
            Some(read_children(&entry_path, depth - 1, count)?)
        } else {
            None
        };

        let size = if file_type.is_file() {
            Some(entry.metadata().map_err(|e| e.to_string())?.len())
        } else {
            None
        };

        entries.push(FileEntry {
            name,
            path: entry_path.to_string_lossy().to_string(),
            kind,
            size,
            children,
        });
        *count += 1;
    }

    entries.sort_by(|a, b| {
        if a.kind != b.kind {
            if a.kind == "directory" {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            }
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(entries)
}

#[tauri::command]
pub fn fs_read_file(path: String) -> Result<String, String> {
    let p = sanitize_path(&path)?;
    if !p.exists() {
        return Err(format!("File not found: {}", path));
    }
    if p.is_dir() {
        return Err(format!("Is a directory: {}", path));
    }
    fs::read_to_string(&p).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fs_write_file(path: String, content: String) -> Result<(), String> {
    let p = sanitize_path(&path)?;
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&p, &content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fs_create_dir(path: String) -> Result<(), String> {
    let p = sanitize_path(&path)?;
    fs::create_dir_all(&p).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fs_delete(path: String) -> Result<(), String> {
    let p = sanitize_path(&path)?;
    if p.is_dir() {
        fs::remove_dir_all(&p).map_err(|e| e.to_string())
    } else {
        fs::remove_file(&p).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn fs_rename(old_path: String, new_path: String) -> Result<(), String> {
    let old_p = sanitize_path(&old_path)?;
    let new_p = sanitize_path(&new_path)?;
    fs::rename(&old_p, &new_p).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fs_exists(path: String) -> Result<bool, String> {
    let p = sanitize_path(&path)?;
    Ok(p.exists())
}

#[tauri::command]
pub fn fs_search(pattern: String, root_path: Option<String>) -> Result<Vec<String>, String> {
    let root = match root_path {
        Some(p) => sanitize_path(&p)?,
        None => PathBuf::from("."),
    };
    let pattern_lower = pattern.to_lowercase();
    let mut results = Vec::new();

    for entry in WalkDir::new(&root)
        .max_depth(10)
        .into_iter()
        .filter_entry(|e| !e.file_name().to_string_lossy().starts_with('.'))
    {
        if let Ok(entry) = entry {
            let name = entry.file_name().to_string_lossy().to_lowercase();
            if name.contains(&pattern_lower) {
                results.push(entry.path().to_string_lossy().to_string());
            }
        }
    }

    results.sort();
    results.truncate(100);
    Ok(results)
}

#[tauri::command]
pub fn fs_grep(pattern: String, root_path: Option<String>) -> Result<Vec<GrepMatch>, String> {
    let root = match root_path {
        Some(p) => sanitize_path(&p)?,
        None => PathBuf::from("."),
    };
    let regex = regex::Regex::new(&pattern).map_err(|e| e.to_string())?;
    let mut results = Vec::new();
    let mut count = 0;

    for entry in WalkDir::new(&root)
        .max_depth(10)
        .into_iter()
        .filter_entry(|e| !e.file_name().to_string_lossy().starts_with('.'))
    {
        if count >= 100 {
            break;
        }
        if let Ok(entry) = entry {
            if entry.file_type().is_file() {
                let path = entry.path();
                let is_text = path.extension().map_or(true, |ext| {
                    matches!(
                        ext.to_string_lossy().as_ref(),
                        "rs" | "ts"
                            | "tsx"
                            | "js"
                            | "jsx"
                            | "py"
                            | "json"
                            | "md"
                            | "css"
                            | "html"
                            | "toml"
                            | "yaml"
                            | "yml"
                            | "sh"
                            | "zsh"
                            | "bash"
                            | "go"
                            | "java"
                            | "c"
                            | "cpp"
                            | "h"
                            | "hpp"
                            | "txt"
                            | "xml"
                            | "svg"
                            | "env"
                            | "conf"
                            | "ini"
                            | "lock"
                    )
                });
                if !is_text {
                    continue;
                }

                if let Ok(content) = fs::read_to_string(path) {
                    for (i, line) in content.lines().enumerate() {
                        if regex.is_match(line) {
                            results.push(GrepMatch {
                                path: path.to_string_lossy().to_string(),
                                line: i + 1,
                                content: line.to_string(),
                            });
                            count += 1;
                            if count >= 100 {
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(results)
}
