export function parseOsc7(data: string): string | null {
  const match = data.match(/\x1b\]7;file:\/\/[^/]+(\/[^\x07\x1b]+)[\x07\x1b]/)
  return match ? match[1] : null
}

export function parseOsc133(data: string): { type: string; exitCode?: number } | null {
  const matchA = data.match(/\x1b\]133;A[^\x07]*\x07/)
  const matchB = data.match(/\x1b\]133;B[^\x07]*\x07/)
  const matchC = data.match(/\x1b\]133;C[^\x07]*\x07/)
  const matchD = data.match(/\x1b\]133;D;(\d+)[^\x07]*\x07/)

  if (matchA) return { type: 'prompt_start' }
  if (matchB) return { type: 'command_start' }
  if (matchC) return { type: 'command_end' }
  if (matchD) return { type: 'prompt_end', exitCode: parseInt(matchD[1], 10) }

  return null
}
