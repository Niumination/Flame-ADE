export interface Skill {
  name: string
  description: string
  command: string
  prompt: string
}

const BUILTIN_SKILLS: Skill[] = [
  {
    name: 'explain',
    command: '/explain',
    description: 'Explain the selected code',
    prompt: 'Explain the following code in detail, including what it does, how it works, and any potential issues:',
  },
  {
    name: 'refactor',
    command: '/refactor',
    description: 'Suggest refactoring improvements',
    prompt: 'Analyze the following code and suggest refactoring improvements for better readability, maintainability, and performance:',
  },
  {
    name: 'fix',
    command: '/fix',
    description: 'Identify and fix bugs',
    prompt: 'Review the following code for bugs, edge cases, and potential issues. Provide fixes for any problems found:',
  },
  {
    name: 'test',
    command: '/test',
    description: 'Generate unit tests',
    prompt: 'Write comprehensive unit tests for the following code. Include edge cases and error scenarios:',
  },
  {
    name: 'docs',
    command: '/docs',
    description: 'Generate documentation',
    prompt: 'Generate comprehensive documentation for the following code, including JSDoc/TSDoc comments, parameter descriptions, and usage examples:',
  },
]

export function getSkills(): Skill[] {
  return BUILTIN_SKILLS
}

export function findSkill(input: string): { skill: Skill; args: string } | null {
  if (!input.startsWith('/')) return null
  const parts = input.split(' ')
  const cmd = parts[0].toLowerCase()
  const args = parts.slice(1).join(' ')

  const skill = BUILTIN_SKILLS.find((s) => s.command === cmd)
  if (!skill) return null

  return { skill, args }
}
