import { tool } from "ai";
import { z } from "zod";
import type { ToolContext } from "./context";

export function buildSubagentTools(_ctx: ToolContext) {
  return {
    run_subagent: tool({
      description:
        "Spawn an isolated subagent with its own restricted toolset and a fresh message history. Use when you need to delegate a self-contained read-only investigation. Returns a single text summary.",
      inputSchema: z.object({
        type: z.string(),
        prompt: z.string().describe("Self-contained instruction."),
        description: z.string().optional().describe("Short label shown in the chat UI for the spawn card."),
      }),
      execute: async ({ type, prompt, description }) => {
        return {
          type,
          description,
          summary: `Subagent delegation is not yet implemented. The request was:\n\n${prompt}`,
          stepCount: 0,
          durationMs: 0,
        };
      },
    }),
  } as const;
}
