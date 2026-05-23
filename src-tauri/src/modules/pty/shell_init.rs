use std::fs;
use std::path::PathBuf;

const ZSHENV_ZSH: &str = include_str!("scripts/zshenv.zsh");
const ZSHRC_ZSH: &str = include_str!("scripts/zshrc.zsh");
const BASHRC_BASH: &str = include_str!("scripts/bashrc.bash");

pub fn prepare_zdotdir() -> PathBuf {
    let tmp = std::env::temp_dir().join("flame-ade-zdotdir");
    let _ = fs::create_dir_all(&tmp);

    let write_script = |name: &str, content: &str| {
        let path = tmp.join(name);
        let _ = fs::write(&path, content);
    };

    write_script("zshenv.zsh", ZSHENV_ZSH);
    write_script("zshrc.zsh", ZSHRC_ZSH);
    write_script("bashrc.bash", BASHRC_BASH);
    write_script(".zshenv", ZSHENV_ZSH);
    write_script(".zshrc", ZSHRC_ZSH);

    tmp
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scripts_embedded() {
        assert!(!ZSHENV_ZSH.is_empty(), "zshenv.zsh should be embedded");
        assert!(!ZSHRC_ZSH.is_empty(), "zshrc.zsh should be embedded");
        assert!(!BASHRC_BASH.is_empty(), "bashrc.bash should be embedded");
    }

    #[test]
    fn test_prepare_zdotdir_creates_dir() {
        let dir = prepare_zdotdir();
        assert!(dir.exists());
        assert!(dir.join("zshenv.zsh").exists());
        assert!(dir.join("zshrc.zsh").exists());
        assert!(dir.join("bashrc.bash").exists());
    }
}
