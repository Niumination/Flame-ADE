use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

use serde::Deserialize;

#[allow(dead_code)]
const CANONICAL_TTL: Duration = Duration::from_secs(1);
#[allow(dead_code)]
const CANONICAL_CACHE_CAP: usize = 256;

#[allow(dead_code)]
struct CanonicalEntry {
    canonical: PathBuf,
    inserted_at: Instant,
}

#[derive(Default)]
pub struct WorkspaceRegistry {
    roots: Mutex<HashSet<PathBuf>>,
    #[allow(dead_code)]
    canonical_cache: Mutex<HashMap<PathBuf, CanonicalEntry>>,
}

impl WorkspaceRegistry {
    #[allow(dead_code)]
    pub fn authorize<P: AsRef<Path>>(&self, path: P) -> std::io::Result<PathBuf> {
        let canonical = std::fs::canonicalize(path.as_ref())?;
        let mut set = self.roots.lock().expect("workspace registry poisoned");
        set.insert(canonical.clone());
        Ok(canonical)
    }

    pub fn is_authorized(&self, target: &Path) -> bool {
        let set = self.roots.lock().expect("workspace registry poisoned");
        set.iter().any(|root| target.starts_with(root))
    }

    #[allow(dead_code)]
    pub fn canonicalize_cached<P: AsRef<Path>>(&self, path: P) -> std::io::Result<PathBuf> {
        let key = path.as_ref().to_path_buf();
        {
            let cache = self
                .canonical_cache
                .lock()
                .expect("canonical cache poisoned");
            if let Some(entry) = cache.get(&key) {
                if entry.inserted_at.elapsed() < CANONICAL_TTL {
                    return Ok(entry.canonical.clone());
                }
            }
        }
        let canonical = std::fs::canonicalize(&key)?;
        let mut cache = self
            .canonical_cache
            .lock()
            .expect("canonical cache poisoned");
        if cache.len() >= CANONICAL_CACHE_CAP {
            cache.retain(|_, entry| entry.inserted_at.elapsed() < CANONICAL_TTL);
            if cache.len() >= CANONICAL_CACHE_CAP {
                cache.clear();
            }
        }
        cache.insert(
            key,
            CanonicalEntry {
                canonical: canonical.clone(),
                inserted_at: Instant::now(),
            },
        );
        Ok(canonical)
    }
}

pub fn authorize_spawn_cwd(
    registry: &WorkspaceRegistry,
    cwd: Option<&str>,
    workspace: &WorkspaceEnv,
) -> Result<Option<PathBuf>, String> {
    let Some(cwd) = cwd.map(str::trim).filter(|s| !s.is_empty()) else {
        return Ok(None);
    };
    let resolved = resolve_path(cwd, workspace);
    let canonical =
        std::fs::canonicalize(&resolved).map_err(|e| format!("cwd not accessible: {e}"))?;
    if !canonical.is_dir() {
        return Err(format!("cwd is not a directory: {}", canonical.display()));
    }
    if !registry.is_authorized(&canonical) {
        return Err(format!(
            "cwd is outside the authorized workspace: {}",
            canonical.display()
        ));
    }
    Ok(Some(canonical))
}

#[allow(dead_code)]
pub fn bootstrap_registry(registry: &WorkspaceRegistry) {
    let _ = registry.authorize(resolve_launch_dir());
    if let Some(home) = dirs::home_dir() {
        let _ = registry.authorize(home);
    }
}

#[allow(dead_code)]
#[tauri::command]
pub async fn workspace_authorize(
    path: String,
    workspace: Option<WorkspaceEnv>,
    registry: tauri::State<'_, WorkspaceRegistry>,
) -> Result<String, String> {
    let workspace = WorkspaceEnv::from_option(workspace);
    let resolved = resolve_path(&path, &workspace);
    let canonical = registry.authorize(&resolved).map_err(|e| e.to_string())?;
    Ok(canonical.to_string_lossy().replace('\\', "/"))
}

#[allow(dead_code)]
#[tauri::command]
pub async fn workspace_current_dir(
    registry: tauri::State<'_, WorkspaceRegistry>,
) -> Result<String, String> {
    let launch = resolve_launch_dir();
    let canonical = registry.authorize(&launch).map_err(|e| e.to_string())?;
    Ok(canonical.to_string_lossy().replace('\\', "/"))
}

#[allow(dead_code)]
static LAUNCH_CWD: OnceLock<Option<PathBuf>> = OnceLock::new();

#[allow(dead_code)]
pub fn init_launch_cwd() {
    LAUNCH_CWD.get_or_init(|| {
        std::env::current_dir()
            .ok()
            .filter(|p| is_usable_launch_dir(p))
    });
}

#[allow(dead_code)]
pub fn launch_cwd_snapshot() -> Option<PathBuf> {
    LAUNCH_CWD.get().and_then(|o| o.clone())
}

#[allow(dead_code)]
fn resolve_launch_dir() -> PathBuf {
    if let Some(cwd) = launch_cwd_snapshot() {
        return cwd;
    }
    if let Some(cwd) = std::env::current_dir()
        .ok()
        .filter(|p| is_usable_launch_dir(p))
    {
        return cwd;
    }
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("/"))
}

#[allow(dead_code)]
fn is_usable_launch_dir(path: &Path) -> bool {
    if !path.is_dir() || path == Path::new("/") {
        return false;
    }
    if is_executable_dir(path) {
        return false;
    }
    let s = path.to_string_lossy();
    if s.contains(".app/Contents/") {
        return false;
    }
    if cfg!(debug_assertions) && path.file_name().and_then(|s| s.to_str()) == Some("src-tauri") {
        return false;
    }
    true
}

#[allow(dead_code)]
fn is_executable_dir(path: &Path) -> bool {
    let Ok(exe) = std::env::current_exe() else {
        return false;
    };
    let Some(exe_dir) = exe.parent() else {
        return false;
    };
    match (std::fs::canonicalize(path), std::fs::canonicalize(exe_dir)) {
        (Ok(a), Ok(b)) => a == b,
        _ => false,
    }
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum WorkspaceEnv {
    #[default]
    Local,
    Wsl {
        distro: String,
    },
}

impl WorkspaceEnv {
    pub fn from_option(workspace: Option<Self>) -> Self {
        workspace.unwrap_or_default()
    }

    pub fn is_wsl(&self) -> bool {
        matches!(self, Self::Wsl { .. })
    }
}

pub fn resolve_path(path: &str, _workspace: &WorkspaceEnv) -> PathBuf {
    PathBuf::from(path)
}

#[cfg(test)]
mod auth_tests {
    use super::*;
    use std::env;
    use std::fs;

    fn tempdir(label: &str) -> PathBuf {
        let mut p = env::temp_dir();
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        p.push(format!(
            "flame-auth-{label}-{nanos}-{}",
            std::process::id()
        ));
        fs::create_dir_all(&p).expect("create tempdir");
        fs::canonicalize(&p).expect("canonicalize tempdir")
    }

    #[test]
    fn authorize_spawn_cwd_accepts_none() {
        let reg = WorkspaceRegistry::default();
        assert!(authorize_spawn_cwd(&reg, None, &WorkspaceEnv::Local)
            .unwrap()
            .is_none());
    }

    #[test]
    fn authorize_spawn_cwd_accepts_empty_string() {
        let reg = WorkspaceRegistry::default();
        assert!(authorize_spawn_cwd(&reg, Some("   "), &WorkspaceEnv::Local)
            .unwrap()
            .is_none());
    }

    #[test]
    fn authorize_spawn_cwd_accepts_authorized_path() {
        let dir = tempdir("ok");
        let reg = WorkspaceRegistry::default();
        reg.authorize(&dir).expect("authorize root");
        let s = dir.to_string_lossy().into_owned();
        let resolved = authorize_spawn_cwd(&reg, Some(&s), &WorkspaceEnv::Local)
            .expect("authorized")
            .expect("returned canonical");
        assert_eq!(resolved, dir);
    }

    #[test]
    fn authorize_spawn_cwd_accepts_subdir_of_authorized_root() {
        let root = tempdir("subroot");
        let sub = root.join("inside");
        fs::create_dir_all(&sub).expect("subdir");
        let canonical_sub = fs::canonicalize(&sub).expect("canon sub");
        let reg = WorkspaceRegistry::default();
        reg.authorize(&root).expect("authorize root");
        let s = canonical_sub.to_string_lossy().into_owned();
        let resolved = authorize_spawn_cwd(&reg, Some(&s), &WorkspaceEnv::Local)
            .expect("subdir authorized")
            .expect("returned canonical");
        assert_eq!(resolved, canonical_sub);
    }

    #[test]
    fn authorize_spawn_cwd_rejects_unauthorized_path() {
        let allowed = tempdir("allowed");
        let foreign = tempdir("foreign");
        let reg = WorkspaceRegistry::default();
        reg.authorize(&allowed).expect("authorize root");
        let s = foreign.to_string_lossy().into_owned();
        let err = authorize_spawn_cwd(&reg, Some(&s), &WorkspaceEnv::Local)
            .expect_err("should reject unauthorized cwd");
        assert!(err.contains("outside"), "got: {err}");
    }

    #[test]
    fn authorize_spawn_cwd_rejects_missing_path() {
        let mut missing = env::temp_dir();
        missing.push(format!(
            "flame-missing-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_nanos())
                .unwrap_or(0)
        ));
        let reg = WorkspaceRegistry::default();
        let s = missing.to_string_lossy().into_owned();
        let err = authorize_spawn_cwd(&reg, Some(&s), &WorkspaceEnv::Local)
            .expect_err("should reject missing path");
        assert!(err.contains("cwd not accessible"), "got: {err}");
    }

    #[test]
    fn authorize_spawn_cwd_blocks_symlink_escape() {
        let allowed = tempdir("symroot");
        let outside = tempdir("symtarget");
        let link = allowed.join("escape");
        #[cfg(unix)]
        std::os::unix::fs::symlink(&outside, &link).expect("symlink");
        let reg = WorkspaceRegistry::default();
        reg.authorize(&allowed).expect("authorize root");
        let s = link.to_string_lossy().into_owned();
        let err = authorize_spawn_cwd(&reg, Some(&s), &WorkspaceEnv::Local)
            .expect_err("symlink-escape must be rejected");
        assert!(err.contains("outside"), "got: {err}");
    }
}
