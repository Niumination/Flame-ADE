use std::sync::Mutex;

use tauri::AppHandle;

#[cfg(target_os = "linux")]
use std::collections::HashMap;
#[cfg(target_os = "linux")]
use std::fs;
#[cfg(target_os = "linux")]
use std::path::PathBuf;
#[cfg(target_os = "linux")]
use tauri::Manager;

#[derive(Default)]
pub struct SecretsState {
    #[cfg(target_os = "linux")]
    cache: Mutex<Option<HashMap<String, String>>>,
    #[cfg(not(target_os = "linux"))]
    _phantom: Mutex<()>,
}

#[cfg(target_os = "linux")]
fn key(service: &str, account: &str) -> String {
    format!("{}::{}", service, account)
}

#[cfg(target_os = "linux")]
fn store_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("secrets.json"))
}

#[cfg(target_os = "linux")]
fn read_store(app: &AppHandle) -> Result<HashMap<String, String>, String> {
    let path = store_path(app)?;
    if !path.exists() {
        return Ok(HashMap::new());
    }
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    serde_json::from_slice::<HashMap<String, String>>(&bytes).map_err(|e| e.to_string())
}

#[cfg(target_os = "linux")]
fn write_store(app: &AppHandle, map: &HashMap<String, String>) -> Result<(), String> {
    use std::io::Write;
    use std::os::unix::fs::OpenOptionsExt;

    let path = store_path(app)?;
    let tmp = path.with_extension("json.tmp");
    let bytes = serde_json::to_vec(map).map_err(|e| e.to_string())?;

    let mut f = fs::OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .mode(0o600)
        .open(&tmp)
        .map_err(|e| e.to_string())?;
    f.write_all(&bytes).map_err(|e| e.to_string())?;
    f.sync_all().map_err(|e| e.to_string())?;
    fs::rename(&tmp, &path).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(target_os = "linux")]
fn with_store<F, R>(app: &AppHandle, state: &SecretsState, f: F) -> Result<R, String>
where
    F: FnOnce(&mut HashMap<String, String>) -> R,
{
    let mut guard = state.cache.lock().map_err(|e| e.to_string())?;
    if guard.is_none() {
        *guard = Some(read_store(app)?);
    }
    let map = guard.as_mut().expect("cache initialized above");
    Ok(f(map))
}

#[cfg(not(target_os = "linux"))]
fn entry(service: &str, account: &str) -> Result<keyring::Entry, String> {
    keyring::Entry::new(service, account).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn secrets_get(
    app: AppHandle,
    state: tauri::State<'_, SecretsState>,
    service: String,
    account: String,
) -> Result<Option<String>, String> {
    #[cfg(target_os = "linux")]
    {
        let _ = state;
        let key = key(&service, &account);
        with_store(&app, &state, |m| m.get(&key).cloned())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (app, state);
        let e = entry(&service, &account)?;
        match e.get_password() {
            Ok(v) => Ok(Some(v)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(err) => Err(err.to_string()),
        }
    }
}

#[tauri::command]
pub async fn secrets_set(
    app: AppHandle,
    state: tauri::State<'_, SecretsState>,
    service: String,
    account: String,
    password: String,
) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let key = key(&service, &account);
        with_store(&app, &state, |m| {
            m.insert(key, password);
        })?;
        let snapshot = {
            let guard = state.cache.lock().map_err(|e| e.to_string())?;
            guard.as_ref().cloned().unwrap_or_default()
        };
        write_store(&app, &snapshot)
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (app, state);
        let e = entry(&service, &account)?;
        e.set_password(&password).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn secrets_delete(
    app: AppHandle,
    state: tauri::State<'_, SecretsState>,
    service: String,
    account: String,
) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let key = key(&service, &account);
        with_store(&app, &state, |m| {
            m.remove(&key);
        })?;
        let snapshot = {
            let guard = state.cache.lock().map_err(|e| e.to_string())?;
            guard.as_ref().cloned().unwrap_or_default()
        };
        write_store(&app, &snapshot)
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (app, state);
        let e = entry(&service, &account)?;
        match e.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(err) => Err(err.to_string()),
        }
    }
}

#[allow(dead_code)]
#[tauri::command]
pub async fn secrets_get_all(
    app: AppHandle,
    state: tauri::State<'_, SecretsState>,
    service: String,
    accounts: Vec<String>,
) -> Result<Vec<Option<String>>, String> {
    #[cfg(target_os = "linux")]
    {
        with_store(&app, &state, |m| {
            accounts
                .iter()
                .map(|a| m.get(&key(&service, a)).cloned())
                .collect()
        })
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (app, state);
        Ok(accounts
            .into_iter()
            .map(|a| {
                keyring::Entry::new(&service, &a)
                    .ok()
                    .and_then(|e| e.get_password().ok())
            })
            .collect())
    }
}

#[cfg(test)]
mod tests {
    use serde::{Deserialize, Serialize};

    #[derive(Serialize, Deserialize)]
    struct SecretResponse {
        key: String,
        exists: bool,
    }

    #[test]
    fn test_secret_response_serialize() {
        let resp = SecretResponse {
            key: "test-value".to_string(),
            exists: true,
        };
        let json = serde_json::to_string(&resp).unwrap();
        assert!(json.contains("test-value"));
        assert!(json.contains("true"));
    }

    #[test]
    fn test_secret_response_deserialize() {
        let json = r#"{"key":"my-api-key","exists":false}"#;
        let resp: SecretResponse = serde_json::from_str(json).unwrap();
        assert_eq!(resp.key, "my-api-key");
        assert!(!resp.exists);
    }
}
