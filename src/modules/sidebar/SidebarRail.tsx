import { cn } from "@/lib/utils";
import { useChatStore } from "@/modules/ai";
import type { SidebarViewId } from "./types";

const ITEMS: { id: SidebarViewId; label: string; icon: string; badge?: () => number }[] = [
  { id: "explorer",      label: "Explorer",      icon: "📁" },
  { id: "search",        label: "Search",        icon: "🔍" },
  { id: "source-control", label: "Source Control", icon: "⎇", badge: () => 0 },
  { id: "git-history",   label: "Git History",   icon: "🕐" },
  { id: "preview",       label: "Web Preview",   icon: "🌐" },
  { id: "markdown",      label: "Markdown",      icon: "📝" },
];

const BOTTOM_ITEMS: { id: SidebarViewId; label: string; icon: string }[] = [
  { id: "extensions", label: "Extensions", icon: "🧩" },
  { id: "settings",   label: "Settings",   icon: "⚙" },
  { id: "account",    label: "Account",    icon: "👤" },
];

type Props = {
  activeView: SidebarViewId;
  onSelectView: (view: SidebarViewId) => void;
  changedCount: number;
};

export function SidebarRail({ activeView, onSelectView, changedCount }: Props) {
  const isStreaming = useChatStore((s) => s.isStreaming)

  const getBadge = (item: typeof ITEMS[number]): number | null => {
    if (item.id === "source-control") return changedCount;
    return null;
  };

  return (
    <aside className="flex w-[48px] shrink-0 flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar py-2 select-none">
      {ITEMS.map((item) => {
        const isActive = item.id === activeView;
        const badge = getBadge(item);
        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            aria-pressed={isActive}
            onClick={() => onSelectView(item.id)}
            className={cn(
              "relative flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm outline-none transition-all duration-150",
              "hover:bg-sidebar-accent/50",
              isActive && "bg-sidebar-accent",
            )}
            title={item.label}
          >
            {/* Active flame bar */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-gradient-to-b from-[#ff6a00] to-[#ff9f45]" />
            )}
            <span>{item.icon}</span>
            {badge != null && badge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-[#ff6a00] text-[7px] font-bold text-white shadow-[0_0_6px_rgba(255,106,0,0.5)]">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        );
      })}

      {/* Spacer */}
      <div className="mt-auto" />

      {/* AI status indicator */}
      <div className="flex items-center gap-1 mb-0.5">
        <span className={cn('inline-block size-1.5 rounded-full', isStreaming ? 'bg-indigo-500 animate-pulse' : 'bg-green-500')} />
      </div>

      {BOTTOM_ITEMS.map((item) => {
        const isActive = item.id === activeView;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            aria-pressed={isActive}
            onClick={() => onSelectView(item.id)}
            className={cn(
              "relative flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm outline-none transition-all duration-150",
              "hover:bg-sidebar-accent/50",
              isActive && "bg-sidebar-accent",
            )}
            title={item.label}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-gradient-to-b from-[#ff6a00] to-[#ff9f45]" />
            )}
            <span>{item.icon}</span>
          </button>
        );
      })}
    </aside>
  );
}
