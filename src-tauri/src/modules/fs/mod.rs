pub mod file;
pub mod grep;
pub mod mutate;
pub mod search;
pub mod tree;

use std::path::Path;

#[allow(dead_code)]
pub fn to_canon(p: impl AsRef<Path>) -> String {
    let s = p.as_ref().to_string_lossy().into_owned();
    #[cfg(windows)]
    {
        s.replace('\\', "/")
    }
    #[cfg(not(windows))]
    {
        s
    }
}
