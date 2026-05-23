use std::path::PathBuf;
use tauri;
use walkdir::WalkDir;

use super::tree::sanitize_path;

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

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

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
}
