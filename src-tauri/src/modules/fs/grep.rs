use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri;
use walkdir::WalkDir;

use super::tree::sanitize_path;

#[derive(Debug, Serialize, Deserialize)]
pub struct GrepMatch {
    pub path: String,
    pub line: usize,
    pub content: String,
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn test_fs_grep_simple_pattern() {
        let manifest = Path::new(env!("CARGO_MANIFEST_DIR"));
        let root = manifest.join("src").to_string_lossy().to_string();
        let result = fs_grep("fn main".to_string(), Some(root));
        assert!(result.is_ok());
    }
}
