use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri;
use walkdir::WalkDir;

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs as fs_std;

    #[test]
    fn test_sanitize_path_denies_env() {
        let result = sanitize_path("/tmp/.env");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Access denied"));
    }

    #[test]
    fn test_sanitize_path_denies_ssh() {
        let result = sanitize_path("/home/user/.ssh/id_rsa");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Access denied"));
    }

    #[test]
    fn test_sanitize_path_denies_pem() {
        let result = sanitize_path("/home/user/cert.pem");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Access denied"));
    }

    #[test]
    fn test_sanitize_path_denies_key() {
        let result = sanitize_path("/home/user/secret.key");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Access denied"));
    }

    #[test]
    fn test_sanitize_path_denies_credentials() {
        let result = sanitize_path("/home/user/credentials.txt");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Access denied"));
    }

    #[test]
    fn test_sanitize_path_case_insensitive_deny() {
        let result = sanitize_path("/home/user/.SSH/config");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Access denied"));
    }

    #[test]
    fn test_sanitize_path_allows_safe_path() {
        let result = sanitize_path("/tmp");
        assert!(result.is_ok());
    }

    #[test]
    fn test_sanitize_path_allows_src_dir() {
        let manifest = Path::new(env!("CARGO_MANIFEST_DIR"));
        let src_path = manifest.join("src").to_string_lossy().to_string();
        let result = sanitize_path(&src_path);
        assert!(result.is_ok());
    }

    #[test]
    fn test_sanitize_path_nonexistent_parent_allowed() {
        let result = sanitize_path("/nonexistent_dir_abc123/test.txt");
        assert!(result.is_ok());
    }

    #[test]
    fn test_sort_directories_first() {
        let mut entries = vec![
            FileEntry {
                name: "b_file.txt".to_string(),
                path: "/tmp/b_file.txt".to_string(),
                kind: "file".to_string(),
                size: None,
                children: None,
            },
            FileEntry {
                name: "a_dir".to_string(),
                path: "/tmp/a_dir".to_string(),
                kind: "directory".to_string(),
                size: None,
                children: None,
            },
        ];

        entries.sort_by(|a, b| {
            let kind_order = |k: &str| -> u8 {
                match k {
                    "directory" => 0,
                    "symlink" => 1,
                    _ => 2,
                }
            };
            let a_order = kind_order(&a.kind);
            let b_order = kind_order(&b.kind);
            if a_order != b_order {
                return a_order.cmp(&b_order);
            }
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        });

        assert_eq!(entries[0].kind, "directory");
        assert_eq!(entries[0].name, "a_dir");
        assert_eq!(entries[1].kind, "file");
    }

    #[test]
    fn test_sort_symlink_middle() {
        let mut entries = vec![
            FileEntry {
                name: "z_file.txt".to_string(),
                path: "/tmp/z_file.txt".to_string(),
                kind: "file".to_string(),
                size: None,
                children: None,
            },
            FileEntry {
                name: "b_symlink".to_string(),
                path: "/tmp/b_symlink".to_string(),
                kind: "symlink".to_string(),
                size: None,
                children: None,
            },
            FileEntry {
                name: "a_dir".to_string(),
                path: "/tmp/a_dir".to_string(),
                kind: "directory".to_string(),
                size: None,
                children: None,
            },
        ];

        entries.sort_by(|a, b| {
            let kind_order = |k: &str| -> u8 {
                match k {
                    "directory" => 0,
                    "symlink" => 1,
                    _ => 2,
                }
            };
            let a_order = kind_order(&a.kind);
            let b_order = kind_order(&b.kind);
            if a_order != b_order {
                return a_order.cmp(&b_order);
            }
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        });

        assert_eq!(entries[0].kind, "directory");
        assert_eq!(entries[1].kind, "symlink");
        assert_eq!(entries[2].kind, "file");
    }

    #[test]
    fn test_denied_path_components_list() {
        assert!(DENIED_PATH_COMPONENTS.contains(&".env"));
        assert!(DENIED_PATH_COMPONENTS.contains(&".ssh"));
        assert!(DENIED_PATH_COMPONENTS.contains(&"id_rsa"));
        assert!(DENIED_PATH_COMPONENTS.contains(&".pem"));
        assert!(DENIED_PATH_COMPONENTS.contains(&".key"));
        assert!(DENIED_PATH_COMPONENTS.contains(&"credentials"));
        assert_eq!(DENIED_PATH_COMPONENTS.len(), 6);
    }

    #[test]
    fn test_fs_exists_safe_path() {
        let manifest = Path::new(env!("CARGO_MANIFEST_DIR"));
        let cargo_toml = manifest.join("Cargo.toml").to_string_lossy().to_string();
        let result = fs_exists(cargo_toml.clone());
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_fs_exists_nonexistent() {
        let result = fs_exists("/nonexistent_path_xyz_987654/bogus.txt".to_string());
        assert!(result.is_ok());
        assert!(!result.unwrap());
    }

    #[test]
    fn test_fs_read_file_denied_path() {
        let result = fs_read_file("/tmp/.env".to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Access denied"));
    }

    #[test]
    fn test_fs_read_file_nonexistent() {
        let result = fs_read_file("/nonexistent_xyz_98765/file.txt".to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("File not found"));
    }

    #[test]
    fn test_fs_read_file_is_directory() {
        let manifest = Path::new(env!("CARGO_MANIFEST_DIR"));
        let src_path = manifest.join("src").to_string_lossy().to_string();
        let result = fs_read_file(src_path);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Is a directory"));
    }

    #[test]
    fn test_fs_search_empty_pattern() {
        let manifest = Path::new(env!("CARGO_MANIFEST_DIR"));
        let root = manifest.join("src").to_string_lossy().to_string();
        let result = fs_search(String::new(), Some(root));
        assert!(result.is_ok());
    }

    #[test]
    fn test_fs_search_nonexistent_pattern() {
        let manifest = Path::new(env!("CARGO_MANIFEST_DIR"));
        let root = manifest.join("src").to_string_lossy().to_string();
        let result = fs_search("XYZZYX_NOT_EXISTS_999".to_string(), Some(root));
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[test]
    fn test_fs_grep_simple_pattern() {
        let manifest = Path::new(env!("CARGO_MANIFEST_DIR"));
        let root = manifest.join("src").to_string_lossy().to_string();
        let result = fs_grep("fn main".to_string(), Some(root));
        assert!(result.is_ok());
    }

    #[test]
    fn test_fs_write_and_delete_roundtrip() {
        let tmp = std::env::temp_dir().join("flame_ade_test_write_delete.txt");
        let tmp_str = tmp.to_string_lossy().to_string();

        let write_result = fs_write_file(tmp_str.clone(), "hello world".to_string());
        assert!(write_result.is_ok());

        let read_result = fs_read_file(tmp_str.clone());
        assert!(read_result.is_ok());
        assert_eq!(read_result.unwrap(), "hello world");

        let delete_result = fs_delete(tmp_str.clone());
        assert!(delete_result.is_ok());
        assert!(!tmp.exists());
    }

    #[test]
    fn test_fs_create_dir_and_delete() {
        let tmp = std::env::temp_dir().join("flame_ade_test_dir");
        let tmp_str = tmp.to_string_lossy().to_string();

        let create_result = fs_create_dir(tmp_str.clone());
        assert!(create_result.is_ok());
        assert!(tmp.exists());
        assert!(tmp.is_dir());

        let delete_result = fs_delete(tmp_str.clone());
        assert!(delete_result.is_ok());
        assert!(!tmp.exists());
    }

    #[test]
    fn test_fs_rename_roundtrip() {
        let tmp = std::env::temp_dir();
        let old = tmp.join("flame_ade_rename_old.txt");
        let new = tmp.join("flame_ade_rename_new.txt");
        let old_str = old.to_string_lossy().to_string();
        let new_str = new.to_string_lossy().to_string();

        fs_std::write(&old, "rename me").unwrap();

        let rename_result = fs_rename(old_str.clone(), new_str.clone());
        assert!(rename_result.is_ok());
        assert!(!old.exists());
        assert!(new.exists());

        let _ = fs_std::remove_file(&new);
    }

    #[test]
    fn test_fs_rename_denied_path() {
        let result = fs_rename("/tmp/.env".to_string(), "/tmp/safe.txt".to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Access denied"));
    }

    #[test]
    fn test_read_tree_nonexistent() {
        let result = fs_read_tree("/nonexistent_xyz_98765".to_string(), None);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Path does not exist"));
    }

    #[test]
    fn test_read_tree_denied_path() {
        let result = fs_read_tree("/tmp/.env".to_string(), None);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Access denied"));
    }
}

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

    // Sort: directories first, then symlinks, then files, alphabetically
    entries.sort_by(|a, b| {
        let kind_order = |k: &str| -> u8 {
            match k {
                "directory" => 0,
                "symlink" => 1,
                _ => 2,
            }
        };
        let a_order = kind_order(&a.kind);
        let b_order = kind_order(&b.kind);
        if a_order != b_order {
            return a_order.cmp(&b_order);
        }
        a.name.to_lowercase().cmp(&b.name.to_lowercase())
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
        let kind_order = |k: &str| -> u8 {
            match k {
                "directory" => 0,
                "symlink" => 1,
                _ => 2,
            }
        };
        let a_order = kind_order(&a.kind);
        let b_order = kind_order(&b.kind);
        if a_order != b_order {
            return a_order.cmp(&b_order);
        }
        a.name.to_lowercase().cmp(&b.name.to_lowercase())
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
        .flatten()
    {
        let name = entry.file_name().to_string_lossy().to_lowercase();
        if name.contains(&pattern_lower) {
            results.push(entry.path().to_string_lossy().to_string());
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
                let is_text = path.extension().is_none_or(|ext| {
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
