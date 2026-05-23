import { MarkdownCode } from "@/components/ai-elements/markdown-code";
import { cn } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Streamdown } from "streamdown";

type Status =
  | { kind: "loading" }
  | { kind: "ready"; content: string }
  | { kind: "error"; message: string };

type Props = {
  path: string;
  visible: boolean;
};

const components = { code: MarkdownCode };

export function MarkdownPreviewPane({ path, visible }: Props) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setStatus({ kind: "loading" });
    invoke<string>("fs_read_file", { path })
      .then((content) => {
        if (!cancelled) setStatus({ kind: "ready", content });
      })
      .catch((e) => {
        if (!cancelled) setStatus({ kind: "error", message: String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md border border-border/60 bg-background",
        !visible && "pointer-events-none",
      )}
    >
      <div className="flex-1 overflow-auto px-6 py-4">
        {status.kind === "loading" && (
          <p className="text-[12px] text-muted-foreground">Loading…</p>
        )}
        {status.kind === "error" && (
          <p className="text-[12px] text-destructive">
            Failed to read file: {status.message}
          </p>
        )}
        {status.kind === "ready" && (
          <Streamdown
            className="select-text [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={components}
          >
            {status.content}
          </Streamdown>
        )}
      </div>
    </div>
  );
}
