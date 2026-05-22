# AI Integration Skill

Use this skill when implementing AI features in Flame ADE.

## Overview

Flame ADE uses Vercel AI SDK v6 for multi-provider AI support with BYOK (Bring Your Own Key) model.

## Providers

### Supported Providers
- OpenAI
- Anthropic
- Google
- Groq
- xAI
- Cerebras
- OpenAI-compatible (custom endpoint)
- LM Studio (local/offline)

### Provider Configuration
```typescript
// src/modules/ai/config.ts
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createXai } from '@ai-sdk/xai';
import { createCerebras } from '@ai-sdk/cerebras';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const PROVIDERS = {
  openai: { name: 'OpenAI', create: createOpenAI },
  anthropic: { name: 'Anthropic', create: createAnthropic },
  google: { name: 'Google', create: createGoogleGenerativeAI },
  groq: { name: 'Groq', create: createGroq },
  xai: { name: 'xAI', create: createXai },
  cerebras: { name: 'Cerebras', create: createCerebras },
  'openai-compatible': { name: 'OpenAI Compatible', create: createOpenAICompatible },
};
```

## Agent Setup

### Main Agent
```typescript
// src/modules/ai/lib/agent.ts
import { experimental_createAgent } from 'ai';
import { stepCountIs } from 'ai';

const MAX_AGENT_STEPS = 50;

export const agent = experimental_createAgent({
  model: getModel(),
  system: getSystemPrompt(),
  stopWhen: stepCountIs(MAX_AGENT_STEPS),
  tools: {
    read_file: readFileTool,
    list_directory: listDirectoryTool,
    fs_search: fsSearchTool,
    fs_grep: fsGrepTool,
    write_file: writeFileTool,
    run_command: runCommandTool,
    // ... more tools
  },
});
```

### Sub-agents
```typescript
// src/modules/ai/agents/registry.ts
export const subAgents = {
  'code-reviewer': {
    name: 'Code Reviewer',
    system: 'You are a code reviewer...',
    tools: ['read_file', 'fs_grep'],
  },
  'test-writer': {
    name: 'Test Writer',
    system: 'You are a test writer...',
    tools: ['read_file', 'write_file', 'run_command'],
  },
};
```

## Tools

### Tool Definition
```typescript
// src/modules/ai/tools/tools.ts
import { tool } from 'ai';
import { z } from 'zod';

export const readFileTool = tool({
  description: 'Read the contents of a file',
  parameters: z.object({
    path: z.string().describe('File path to read'),
  }),
  execute: async ({ path }) => {
    // Check security deny-list
    if (isSecretPath(path)) {
      throw new Error(`Access denied: ${path}`);
    }
    return await invoke('fs_file_read', { path });
  },
});

export const writeFileTool = tool({
  description: 'Write content to a file',
  parameters: z.object({
    path: z.string().describe('File path to write'),
    content: z.string().describe('File content'),
  }),
  needsApproval: true,
  execute: async ({ path, content }) => {
    if (isSecretPath(path)) {
      throw new Error(`Access denied: ${path}`);
    }
    return await invoke('fs_file_write', { path, content });
  },
});
```

### Security Deny-list
```typescript
// src/modules/ai/lib/security.ts
const SECRET_PATHS = [
  '.env',
  '.env.*',
  '.ssh/',
  'credentials',
  'keychain',
  '.git/',
  '.aws/',
  '.gcp/',
];

export function isSecretPath(path: string): boolean {
  const normalized = path.toLowerCase();
  return SECRET_PATHS.some(pattern => {
    if (pattern.endsWith('/')) {
      return normalized.startsWith(pattern);
    }
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(normalized);
    }
    return normalized === pattern || normalized.startsWith(pattern);
  });
}
```

## Session Management

### Session Store
```typescript
// src/modules/ai/lib/sessions.ts
import { Store } from '@tauri-apps/plugin-store';

const STORE_PATH = 'flame-ade-sessions.json';

export async function createSession(name: string): Promise<string> {
  const store = await Store.load(STORE_PATH);
  const id = crypto.randomUUID();
  
  const sessions = await store.get<Session[]>('sessions') || [];
  sessions.push({ id, name, createdAt: Date.now() });
  await store.set('sessions', sessions);
  await store.save();
  
  return id;
}

export async function saveMessages(sessionId: string, messages: Message[]) {
  const store = await Store.load(STORE_PATH);
  await store.set(`messages:${sessionId}`, messages);
  await store.save();
}
```

## Key Storage

### OS Keychain (Rust)
```rust
// src-tauri/src/modules/secrets.rs
use keyring::Entry;

const KEYRING_SERVICE: &str = "flame-ade";

#[tauri::command]
pub fn secrets_set(provider: String, key: String) -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, &provider)
        .map_err(|e| e.to_string())?;
    entry.set_password(&key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn secrets_get(provider: String) -> Result<String, String> {
    let entry = Entry::new(KEYRING_SERVICE, &provider)
        .map_err(|e| e.to_string())?;
    entry.get_password()
        .map_err(|e| e.to_string())
}
```

## Live Context Bridge

```typescript
// App.tsx
const [live, setLive] = useState<LiveContext | null>(null);

setLive({
  getCwd: () => activeTab?.cwd,
  getTerminalContext: () => {
    const terminal = getTerminal(activeTab?.id);
    return terminal?.buffer?.getLastNLines(300);
  },
});
```

## Voice Input

```typescript
// src/modules/ai/lib/voice.ts
export async function startVoiceInput(): Promise<string> {
  // Use Web Speech API or external transcription
  const recognition = new SpeechRecognition();
  
  return new Promise((resolve, reject) => {
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };
    recognition.onerror = reject;
    recognition.start();
  });
}
```

## Edit Diffs

```typescript
// src/modules/ai/lib/diffs.ts
import { createPatch } from 'diff';

export function createEditDiff(original: string, modified: string): Diff {
  return {
    hunks: parsePatch(createPatch('file', original, modified)),
    status: 'pending',
  };
}

export function applyDiffHunk(original: string, hunk: Hunk): string {
  // Apply single hunk to original content
  return applyPatch(original, formatHunk(hunk));
}
```

## macOS Tahoe Notes

- Test AI provider API calls on macOS Tahoe 26.5
- Verify keychain integration works with Tahoe's security model
- Ensure voice input works with macOS microphone permissions
- Test LM Studio local model integration
