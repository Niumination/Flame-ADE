# Flame ADE bashrc — injected via --rcfile
# Emits OSC 7 (cwd) and OSC 133 (prompt boundaries)

# OSC 7: Report current working directory
flame_ade_cwd() {
  printf '\e]7;file://%s%s\a' "${HOSTNAME}" "${PWD}"
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
  printf '\e]133;D;$?\a'
}

# Set PROMPT_COMMAND to emit OSC sequences
PROMPT_COMMAND="flame_ade_cwd; flame_ade_prompt_start; ${PROMPT_COMMAND:+$PROMPT_COMMAND; }flame_ade_command_end; flame_ade_prompt_end"

# Trap DEBUG for command start
trap 'flame_ade_command_start' DEBUG

# Source the user's real bashrc if it exists
if [[ -n "$FLAME_ADE_REAL_BASHRC" && -f "$FLAME_ADE_REAL_BASHRC" ]]; then
  source "$FLAME_ADE_REAL_BASHRC"
fi
