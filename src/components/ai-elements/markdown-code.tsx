import type { ReactNode } from "react";

import { ChatCodeBlock } from "./chat-code";

export function MarkdownCode({
  className,
  children,
  ...rest
}: {
  className?: string;
  children?: ReactNode;
}) {
  const match = className?.match(/language-(\w+)/);
  if (!match) {
    return (
      <code
        className="rounded bg-muted/70 px-1.5 py-0.5 font-mono text-[11px] text-foreground"
        {...rest}
      >
        {children}
      </code>
    );
  }

  const code = String(children ?? "").replace(/\n$/, "");
  return <ChatCodeBlock code={code} lang={match[1] ?? null} />;
}
