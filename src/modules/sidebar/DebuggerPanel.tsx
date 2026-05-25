import { HugeiconsIcon } from '@hugeicons/react'
import { Bug01Icon } from '@hugeicons/core-free-icons'

export function DebuggerPanel() {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <HugeiconsIcon icon={Bug01Icon} size={14} className="text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-foreground">Debugger</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <HugeiconsIcon icon={Bug01Icon} size={24} className="text-muted-foreground/20" />
          <p className="text-[10px] text-muted-foreground/40">No active debug session</p>
        </div>
      </div>
    </div>
  )
}
