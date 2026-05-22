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
