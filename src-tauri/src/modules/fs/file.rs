use std::fs;
use tauri;

use super::tree::sanitize_path;

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
pub fn fs_exists(path: String) -> Result<bool, String> {
    let p = sanitize_path(&path)?;
    Ok(p.exists())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

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
}
