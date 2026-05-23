export const DEFAULT_SUBAGENT_MODEL = "claude-sonnet-4-5";

export type SubagentResult = {
  summary: string;
  stepCount: number;
  durationMs: number;
};

export async function runSubagent(_params: unknown): Promise<SubagentResult> {
  throw new Error("Subagent not implemented");
}
