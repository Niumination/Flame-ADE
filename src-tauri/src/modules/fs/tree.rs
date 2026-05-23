use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri;

const MAX_TREE_DEPTH: usize = 3;
const MAX_TREE_ENTRIES: usize = 5000;

pub const DENIED_PATH_COMPONENTS: &[&str] =
    &[".env", ".ssh", "id_rsa", ".pem", ".key", "credentials"];

pub fn sanitize_path(path: &str) -> Result<PathBuf, String> {
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

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
