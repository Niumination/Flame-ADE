# Flame ADE zshrc — hooks + user config bridge
# Placed in ZDOTDIR; sources user's real zshrc

# Load hook helpers
autoload -Uz add-zsh-hook
add-zsh-hook precmd flame_ade_cwd
add-zsh-hook precmd flame_ade_prompt_start
add-zsh-hook precmd flame_ade_command_end
add-zsh-hook precmd flame_ade_prompt_end
add-zsh-hook preexec flame_ade_command_start

# Source user's real zshenv if different from ours
if [[ -n "$FLAME_ADE_REAL_ZDOTDIR" && "$FLAME_ADE_REAL_ZDOTDIR" != "${ZDOTDIR}" ]]; then
  [[ -f "${FLAME_ADE_REAL_ZDOTDIR}/.zshenv" ]] && source "${FLAME_ADE_REAL_ZDOTDIR}/.zshenv"
fi

# Source user's real zshrc
if [[ -n "$FLAME_ADE_REAL_ZDOTDIR" && -f "${FLAME_ADE_REAL_ZDOTDIR}/.zshrc" ]]; then
  source "${FLAME_ADE_REAL_ZDOTDIR}/.zshrc"
fi
