use std::fs;
use tauri;

use super::tree::sanitize_path;

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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::modules::fs::file::{fs_read_file, fs_write_file};
    use std::fs as fs_std;

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
}
