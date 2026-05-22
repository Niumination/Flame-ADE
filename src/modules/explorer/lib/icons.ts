function getFileIcon(kind: string, name: string): string {
  if (kind === 'directory') return '📁'
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'ts':
    case 'tsx':
      return '🔷'
    case 'js':
    case 'jsx':
      return '📜'
    case 'rs':
      return '🦀'
    case 'py':
      return '🐍'
    case 'json':
      return '📋'
    case 'md':
      return '📝'
    case 'css':
      return '🎨'
    case 'html':
      return '🌐'
    case 'toml':
    case 'yaml':
    case 'yml':
      return '⚙️'
    case 'gitignore':
      return '🚫'
    default:
      return '📄'
  }
}

export { getFileIcon }
