use keyring::Entry;
use serde::{Deserialize, Serialize};
use tauri;

const KEYRING_SERVICE: &str = "flame-ade";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_secret_response_serialize() {
        let response = SecretResponse {
            key: "my-key".to_string(),
            exists: true,
        };
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("my-key"));
        assert!(json.contains("true"));
    }

    #[test]
    fn test_secret_response_not_exists() {
        let response = SecretResponse {
            key: "nonexistent".to_string(),
            exists: false,
        };
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("false"));
    }

    #[test]
    fn test_secret_response_deserialize() {
        let json = r#"{"key":"test-key","exists":true}"#;
        let response: SecretResponse = serde_json::from_str(json).unwrap();
        assert_eq!(response.key, "test-key");
        assert!(response.exists);
    }
}

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
            key: value,
            exists: true,
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
