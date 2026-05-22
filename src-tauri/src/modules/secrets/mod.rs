use keyring::Entry;
use serde::{Deserialize, Serialize};
use tauri;

const KEYRING_SERVICE: &str = "flame-ade";

#[derive(Debug, Serialize, Deserialize)]
pub struct SecretResponse {
    pub key: String,
    pub exists: bool,
}

#[tauri::command]
pub async fn secrets_set(key: String, value: String) -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, &key).map_err(|e| e.to_string())?;
    entry.set_password(&value).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn secrets_get(key: String) -> Result<SecretResponse, String> {
    let entry = Entry::new(KEYRING_SERVICE, &key).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(value) => Ok(SecretResponse {
            key: key.clone(),
            exists: !value.is_empty(),
        }),
        Err(keyring::Error::NoEntry) => Ok(SecretResponse {
            key,
            exists: false,
        }),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn secrets_delete(key: String) -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, &key).map_err(|e| e.to_string())?;
    entry.delete_credential().map_err(|e| e.to_string())?;
    Ok(())
}
