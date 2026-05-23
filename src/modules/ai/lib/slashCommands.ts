export interface SlashCommand {
  id: string
  label: string
  description: string
  icon?: string
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { id: 'explain', label: '/explain', description: 'Explain the selected code', icon: '💡' },
  { id: 'fix', label: '/fix', description: 'Fix the selected code', icon: '🔧' },
  { id: 'test', label: '/test', description: 'Write tests for the selected code', icon: '🧪' },
  { id: 'refactor', label: '/refactor', description: 'Refactor the selected code', icon: '♻️' },
  { id: 'docs', label: '/docs', description: 'Generate documentation', icon: '📝' },
]

export function getMatchingCommands(input: string): SlashCommand[] {
  if (!input.startsWith('/')) return []
  const query = input.slice(1).toLowerCase()
  return SLASH_COMMANDS.filter((c) => c.id.includes(query))
}
