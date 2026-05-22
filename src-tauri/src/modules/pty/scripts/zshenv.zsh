# Flame ADE zshenv — injected via ZDOTDIR
# Sets up shell integration helpers (minimal — hooks in zshrc)

# OSC 7: Report current working directory
flame_ade_cwd() {
  printf '\e]7;file://%s%s\a' "${HOST}" "${PWD}"
}

# OSC 133 A: Prompt start
flame_ade_prompt_start() {
  printf '\e]133;A\a'
}

# OSC 133 B: Command start
flame_ade_command_start() {
  printf '\e]133;B\a'
}

# OSC 133 C: Command end
flame_ade_command_end() {
  printf '\e]133;C\a'
}

# OSC 133 D: Prompt end with exit code
flame_ade_prompt_end() {
  local exit_code=$?
  printf '\e]133;D;%d\a' "${exit_code}"
}
