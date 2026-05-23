use std::path::Path;

#[test]
fn test_git_mod_exists() {
    let git_mod = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("src")
        .join("modules")
        .join("git")
        .join("mod.rs");
    assert!(git_mod.exists(), "Git module should exist at {:?}", git_mod);
}

#[test]
fn test_fs_mod_exists() {
    let fs_mod = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("src")
        .join("modules")
        .join("fs")
        .join("mod.rs");
    assert!(fs_mod.exists(), "FS module should exist");
}

#[test]
fn test_secrets_mod_exists() {
    let secrets_mod = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("src")
        .join("modules")
        .join("secrets")
        .join("mod.rs");
    assert!(secrets_mod.exists(), "Secrets module should exist");
}

#[test]
fn test_shell_mod_exists() {
    let shell_mod = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("src")
        .join("modules")
        .join("shell")
        .join("mod.rs");
    assert!(shell_mod.exists(), "Shell module should exist");
}

#[test]
fn test_pty_scripts_exist() {
    let scripts_dir = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("src")
        .join("modules")
        .join("pty")
        .join("scripts");
    assert!(
        scripts_dir.join("zshenv.zsh").exists(),
        "zshenv.zsh should exist"
    );
    assert!(
        scripts_dir.join("zshrc.zsh").exists(),
        "zshrc.zsh should exist"
    );
    assert!(
        scripts_dir.join("bashrc.bash").exists(),
        "bashrc.bash should exist"
    );
}

#[test]
fn test_lib_rs_exists() {
    let lib_rs = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("src")
        .join("lib.rs");
    assert!(lib_rs.exists(), "lib.rs should exist");
}

#[test]
fn test_main_rs_exists() {
    let main_rs = Path::new(env!("CARGO_MANIFEST_DIR")).join("main.rs");
    assert!(main_rs.exists(), "main.rs should exist at {:?}", main_rs);
}

#[test]
fn test_build_rs_exists() {
    let build_rs = Path::new(env!("CARGO_MANIFEST_DIR")).join("build.rs");
    assert!(build_rs.exists(), "build.rs should exist");
}

#[test]
fn test_cargo_toml_exists() {
    let cargo_toml = Path::new(env!("CARGO_MANIFEST_DIR")).join("Cargo.toml");
    assert!(cargo_toml.exists(), "Cargo.toml should exist");
}

#[test]
fn test_capabilities_exist() {
    let capabilities = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("capabilities")
        .join("default.json");
    assert!(
        capabilities.exists(),
        "capabilities/default.json should exist"
    );
}

#[test]
fn test_tauri_config_exists() {
    let config = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("src-tauri")
        .join("tauri.conf.json");
    assert!(
        config.exists()
            || Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("tauri.conf.json")
                .exists(),
        "tauri.conf.json should exist"
    );
}

#[test]
fn test_pty_zshrc_contains_hooks() {
    let zshrc = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("src")
        .join("modules")
        .join("pty")
        .join("scripts")
        .join("zshrc.zsh");
    let content = std::fs::read_to_string(zshrc).expect("Should read zshrc.zsh");
    assert!(
        content.contains("add-zsh-hook"),
        "Should contain zsh hook registrations"
    );
    assert!(content.contains("precmd"), "Should contain precmd hooks");
    assert!(content.contains("preexec"), "Should contain preexec hooks");
}

#[test]
fn test_pty_bashrc_contains_osc() {
    let bashrc = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("src")
        .join("modules")
        .join("pty")
        .join("scripts")
        .join("bashrc.bash");
    let content = std::fs::read_to_string(bashrc).expect("Should read bashrc.bash");
    assert!(
        content.contains("OSC 133"),
        "Should contain OSC 133 markers"
    );
}

#[test]
fn test_frontend_app_entry_exists() {
    let app = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("src")
        .join("App.tsx");
    assert!(app.exists(), "App.tsx should exist");
}

#[test]
fn test_frontend_main_entry_exists() {
    let main = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("src")
        .join("main.tsx");
    assert!(main.exists(), "main.tsx should exist");
}

#[test]
fn test_package_json_exists() {
    let pkg = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("package.json");
    assert!(pkg.exists(), "package.json should exist");
}

#[test]
fn test_vitest_config_exists() {
    let config = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("vitest.config.ts");
    assert!(config.exists(), "vitest.config.ts should exist");
}
