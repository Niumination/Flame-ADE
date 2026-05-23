export type SubagentType = string;

export interface SubagentDef {
  description: string;
  tools: string[];
  systemPrompt: string;
  model?: string;
}

export const SUBAGENTS: Record<string, SubagentDef> = {};

export const SUBAGENT_DESCRIPTIONS: string[] = [];
