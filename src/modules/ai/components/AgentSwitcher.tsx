import { useAgentsStore } from '../store/agentsStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserIcon } from '@hugeicons/core-free-icons'

type AgentSwitcherProps = {
  className?: string
}

export function AgentSwitcher({ className }: AgentSwitcherProps) {
  const agents = useAgentsStore((s) => s.agents)
  const activeAgentId = useAgentsStore((s) => s.activeAgentId)
  const setActiveAgent = useAgentsStore((s) => s.setActiveAgent)
  const active = agents.find((a) => a.id === activeAgentId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('gap-1 text-xs', className)}>
          <HugeiconsIcon icon={UserIcon} size={14} strokeWidth={1.75} />
          <span>{active?.label || 'Auto'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {agents.map((agent) => (
          <DropdownMenuItem
            key={agent.id}
            onSelect={() => setActiveAgent(agent.id)}
            className={cn(agent.id === activeAgentId && 'bg-accent')}
          >
            <span className="flex-1">{agent.label}</span>
            <span className="text-[10px] text-muted-foreground">{agent.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
