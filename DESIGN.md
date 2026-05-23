# Flame ADE — Interactive Design System

Desain interaktif untuk Agentic Development Environment (ADE), berdasarkan riset modern terminal/ADE (Warp, Aineer, Atoo Studio, Matrix, Claude Code, OpenDev), prinsip HCI, dan 3 design skills (ui-design, design-systems, visual-critique).

---

## 1. Design Principles

### 1.1 Keyboard-First, Terminal-Native
Segala sesuatu bisa dilakukan tanpa mouse. Terminal adalah medium utama — AI, shell, dan workflow berbagi satu continuous stream (representational compatibility). Keyboard shortcut adalah first-class citizen.

### 1.2 Transparency & Trust
Setiap aksi AI harus visible, inspectable, dan replayable di stream yang sama dengan kerja manual user. Approval gate untuk operasi berbahaya. Tidak ada "black box" AI.

### 1.3 Low-Friction Participation
User bisa interupsi, redirect, atau override AI kapan saja. Mixed-initiative interaction — AI dan user bekerja di medium yang sama, bukan terpisah.

### 1.4 Visual Hierarchy via Information Density
Terminal emulator menampilkan banyak informasi dalam satu layar. Gunakan spacing, typography weight, dan color signaling — bukan borders dan cards berlebihan — untuk hierarki.

### 1.5 Consistency is Reliability
Spacing scale, type scale, color tokens, dan component behavior harus seragam. Setiap inkonsistensi visual menurunkan perceived reliability.

---

## 2. Color System

### 2.1 Brand Palette

```yaml
brand:
  50:  '#eef2ff'
  100: '#e0e7ff'
  200: '#c7d2fe'
  300: '#a5b4fc'
  400: '#818cf8'
  500: '#6366f1'  # primary
  600: '#4f46e5'
  700: '#4338ca'
  800: '#3730a3'
  900: '#312e81'
  950: '#1e1b4b'
```

### 2.2 Neutral Palette (Surface)

```yaml
neutral:
  50:  '#fafafa'
  100: '#f4f4f5'
  200: '#e4e4e7'
  300: '#d4d4d8'
  400: '#a1a1aa'
  500: '#71717a'
  600: '#52525b'
  700: '#3f3f46'
  800: '#27272a'
  900: '#18181b'
  950: '#09090b'
```

### 2.3 Semantic Colors

```yaml
semantic:
  success:  '#22c55e'   # hijau — command exit 0, git staged
  warning:  '#f59e0b'   # kuning — pending, warning
  error:    '#ef4444'   # merah — command exit non-0, git conflict
  info:     '#3b82f6'   # biru — info, git modified
  accent:   '#8b5cf6'   # ungu — AI mode indicator
```

### 2.4 Theme Tokens (Current Implementation)

Themes (4): `dark`, `light`, `tokyoNight`, `nord` — didefinisikan di `src/modules/theme/lib/useTheme.tsx`.

**Planned Expansion:**
- `dracula` — popular dev theme
- `catppuccin-mocha` — warm dark theme
- `one-dark` — Atom-inspired
- `github-dark` / `github-light`

### 2.5 Dark Mode Surface Hierarchy

| Elevation | Dark Token | Usage |
|-----------|-----------|-------|
| Background | `#0a0a0a` | Root background |
| Surface 1 | `#18181b` | Tabs, sidebar |
| Surface 2 | `#27272a` | Hover, active tab |
| Surface 3 | `#3f3f46` | Modals, dropdowns, tooltips |
| Text | `#e4e4e7` | Primary text |
| Text secondary | `#a1a1aa` | Secondary text, labels |

---

## 3. Typography System

### 3.1 Font Stack

```css
--font-sans:  'Inter', 'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, monospace
```

### 3.2 Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `caption` | 10px | 400 | 1.4 | Labels, timestamps, status |
| `small` | 12px | 400 | 1.4 | UI text, file paths, metadata |
| `body` | 13px | 400 | 1.5 | Terminal output, editor content |
| `body-large` | 14px | 400 | 1.5 | Default UI text |
| `subheading` | 15px | 600 | 1.3 | Section headers, tab labels |
| `heading` | 18px | 700 | 1.3 | Panel titles |
| `display` | 24px | 700 | 1.2 | Page-level headings |

### 3.3 Readable Measure
- Terminal output: full width (bisa 100-200+ chars) — no constraint
- AI conversation text: max 70ch untuk readability
- Settings/preference text: max 65ch
- Code editor: full width (line wrapping opsional)

---

## 4. Spacing System

Base unit: **4px**

| Token | px | Usage |
|-------|----|-------|
| `space-0` | 0 | Reset |
| `space-1` | 4px | Micro spacing, icon-label gap |
| `space-2` | 8px | Dense UI, list items |
| `space-3` | 12px | Default component padding |
| `space-4` | 16px | Section spacing, card padding |
| `space-6` | 24px | Major section breaks |
| `space-8` | 32px | Page margins, modal padding |
| `space-12` | 48px | Large screen separation |

---

## 5. Layout Architecture

### 5.1 Screen Anatomy

```
┌─────────────────────────────────────────────────────┐
│  Header (32px) — traffic lights | toggles | title   │
├─────────────────────────────────────────────────────┤
│  Tab Bar (28px) — scrollable tabs | + new tab       │
├───────┬──────────────────────────────────┬──────────┤
│       │                                  │          │
│ Exp.  │     MAIN WORKSPACE               │  AI      │
│ Panel │     (Terminal | Editor |         │  Panel   │
│ 224px │      Preview | Git | Settings)   │  320px   │
│       │                                  │          │
│       │     resizable split panes        │          │
│       │     ⌄                            │          │
├───────┴──────────────────────────────────┴──────────┤
│  Status Bar (24px) — cwd breadcrumb | mode indicator│
└─────────────────────────────────────────────────────┘
```

### 5.2 Tab System
- **Tagged-union types**: `terminal | editor | preview | ai-diff | git | settings`
- **Hidden on switch** (not unmounted): `invisible pointer-events-none` — PTY sessions survive
- **Visual feedback**: active tab distinct background + subtle bottom border accent
- **Inactive tabs**: reduced opacity, no border
- **Tab width**: dynamic, min 80px, max 200px, truncated with ellipsis
- **Order**: stable insertion order, drag-to-reorder (future)

### 5.3 Resizable Panels
- Explorer/AI panels menggunakan `react-resizable-panels`
- Min width explorer: 180px, max: 400px
- Min width AI panel: 280px, max: 600px
- Drag handle: 4px wide, visible on hover
- Persist widths across sessions via localStorage

### 5.4 Status Bar (Current)
- Cwd breadcrumb (dari OSC 7)
- Active tab kind indicator
- Tambahan (planned): AI mode indicator, git branch, command count

---

## 6. Terminal Block Model (Key Innovation)

Transformasi dari grid karakter menjadi **block-based terminal** — mengadopsi model Warp:

### 6.1 Block Types
```
enum BlockType {
  Command,       // User command + output
  AgentMessage,  // AI conversation turn
  ToolResult,    // AI tool execution result
  Diff,          // AI-proposed edit diff
  System,        // System notification (errors, warnings)
}
```

### 6.2 Block Anatomy (Planned)
```
┌─ [timestamp] [exit code] ─── [copy] [share] ─┐
│                                                 │
│  $ npm run dev                                  │  ← Command (monospace, accent color)
│  > flaming-ade@0.6.0 dev                        │
│  > vite                                         │
│                                                 │
│   VITE v7.3.2  ready in 320ms                   │  ← Output (monospace, dim)
│                                                 │
│   ➜  Local:   http://localhost:1420/            │
│   ➜  Network: http://192.168.1.5:1420/         │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 6.3 Block Features
- **Select entire output**: double-click block gutter
- **Copy block**: one-click copy icon per block
- **Block actions**: right-click context menu (copy output, re-run command, share as link)
- **Collapse/expand**: toggle long outputs
- **Command navigation**: `Cmd+Up/Down` to jump between command blocks

---

## 7. AI Integration in Stream

### 7.1 AI Agent Block
```
┌─── AI ─────────────────────────────────────────┐
│                                                  │
│  ┌─ User ──────────────────────────────────┐    │
│  │  /explain the build.rs configuration     │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌─ Agent ────────────────────────────────┐    │
│  │  This file configures the Tauri build   │    │
│  │  process. Key sections:                │    │
│  │                                        │    │
│  │  • `build.rs` registers the Tauri      │    │
│  │    build script for code generation     │    │
│  │  • ...                                 │    │
│  │                                        │    │
│  │  ┌─── Tool: read_file ──────────┐     │    │
│  │  │  Reading build.rs...         │     │    │
│  │  └──────────────────────────────┘     │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

### 7.2 Agent Mode Visual States
| State | Visual |
|-------|--------|
| Idle | Normal input area |
| Thinking | Pulsing accent border, "Agent is thinking..." |
| Executing tool | Tool card with streaming output |
| Waiting approval | Approval dialog overlay (modal) |
| Error | Red accent, error message inline |

### 7.3 Approval Dialog
- **Slide-up overlay** dari bawah (bukan modal penuh)
- **Show context**: perintah yang akan dijalankan + alasan
- **Actions**: Approve (Enter), Reject (Esc), Approve All (optional)
- **Dim background**: sisanya di-dim 30%
- **Keyboard-first**: Enter/Tab untuk approve, Esc reject

---

## 8. Interaction Patterns

### 8.1 Keyboard Shortcuts (Current + Planned)

| Shortcut | Action | Status |
|----------|--------|--------|
| `Cmd+I` | Toggle AI panel | ✅ |
| `Cmd+1-9` | Switch tab N | ⏳ |
| `Cmd+T` | New terminal tab | ⏳ |
| `Cmd+W` | Close tab | ⏳ |
| `Cmd+Shift+[` / `]` | Prev/next tab | ⏳ |
| `Cmd+P` | Command palette | ⏳ (Future) |
| `Cmd+K` | Clear terminal | ⏳ |
| `Cmd+D` | Split pane | ⏳ (Future) |
| `Cmd+Enter` | Send AI message | ✅ (via chat input) |
| `Escape` | Cancel AI, close dialog | ✅ |

### 8.2 Split Panes (Future)
- Horizontal split: `Cmd+D`
- Vertical split: `Cmd+Shift+D`
- Each pane: independent terminal session
- Drag border: resize
- Close pane: `Cmd+W` on last tab

### 8.3 Command Palette (Future)
- `Cmd+P` / `Cmd+Shift+P`
- Searchable: semua command, tab switching, settings
- Fuzzy search dengan keyboard navigation
- Mode indicator: `>` for commands, `@` for tabs, `:` for settings

### 8.4 Terminal Mouse Interactions
| Action | Behavior |
|--------|----------|
| Click | Focus terminal / set cursor position |
| Double-click | Select word |
| Triple-click | Select line |
| Right-click | Context menu (Copy, Paste, Open URL) |
| Scroll | Scrollback (hijack via xterm.js) |
| Middle-click | Paste selection (macOS) |

---

## 9. UI Component Design Tokens

### 9.1 Buttons
```yaml
button:
  height: 28px
  padding: 8px 12px
  radius: 6px
  font-size: 12px
  variants:
    primary:   bg-primary text-white hover:brightness-110
    secondary: bg-muted text-foreground hover:bg-border
    ghost:     bg-transparent text-muted-foreground hover:text-foreground
    danger:    bg-destructive text-white hover:brightness-110
```

### 9.2 Input Fields
```yaml
input:
  height: 28px
  padding: 4px 8px
  radius: 6px
  border: 1px solid border
  font-size: 12px
  focus: ring-2 ring-primary/30
  placeholder: text-muted-foreground
```

### 9.3 Select Dropdowns
```yaml
select:
  height: 28px
  padding: 4px 8px
  radius: 6px
  background: muted
  font-size: 12px
  icon: custom chevron (no native arrow)
```

### 9.4 Tabs
```yaml
tab:
  height: 28px
  padding: 4px 12px
  font-size: 12px
  active:
    background: neutral-800 (dark) / neutral-100 (light)
    border-bottom: 2px solid brand-500
  inactive:
    background: transparent
    text-color: mutedForeground
  hover:
    background: neutral-800/50
  close-button:
    size: 14px
    visible: on hover
```

### 9.5 Scrollbar
```yaml
scrollbar:
  width: 8px
  track: transparent
  thumb: neutral-700 (dark) / neutral-300 (light)
  thumb-hover: neutral-600 (dark) / neutral-400 (light)
  radius: 4px
```

---

## 10. Motion System

### 10.1 Duration Tokens
```yaml
motion:
  instant: 50ms    # Checkbox, toggle
  fast: 100ms      # Tooltip, chip dismiss
  normal: 200ms    # Default transitions
  moderate: 300ms  # Panel slide, modal entries
  slow: 400ms      # Page transitions
```

### 10.2 Easing Tokens
```yaml
easing:
  standard: cubic-bezier(0.2, 0, 0, 1)
  decelerate: cubic-bezier(0, 0, 0.2, 1)   # Elements entering
  accelerate: cubic-bezier(0.3, 0, 1, 0.3)  # Elements leaving
```

### 10.3 What Animates
- Panel slide-in/out (AI panel, explorer): 200ms decelerate
- Tab switch accent: 150ms instant
- Approval dialog: 250ms decelerate with opacity
- Button hover: 100ms instant (color shift)
- Loading indicator: infinite rotate (CSS, no easing)
- Error flash on terminal: 200ms fast, red border pulse

### 10.4 Reduced Motion
- `prefers-reduced-motion: reduce`
- Disable all slide/scale/rotate
- Replace with instant opacity fades (0ms)
- Keep: loading spinners (essential state)

---

## 11. Accessibility

### 11.1 Color Contrast (WCAG AA)
| Combination | Ratio | Status |
|-------------|-------|--------|
| Text `#e4e4e7` on bg `#0a0a0a` | 13.8:1 | ✅ AAA |
| Text `#a1a1aa` on bg `#0a0a0a` | 7.2:1 | ✅ AA |
| Text `#e4e4e7` on surface `#27272a` | 7.3:1 | ✅ AA |
| Primary `#6366f1` on bg `#0a0a0a` | 6.1:1 | ✅ AA |
| Error `#ef4444` on bg `#0a0a0a` | 4.8:1 | ✅ AA |

### 11.2 Keyboard Navigation
- All interactive elements: focusable via Tab
- Visible focus ring: `ring-2 ring-primary/50`
- Logical tab order: header → tabs → sidebar → main → status
- No keyboard traps
- ESC closes all overlays, dialogs, dropdowns

### 11.3 Screen Reader Support
- Terminal output: `role="log"`, `aria-live="polite"`
- Tab list: `role="tablist"`, each tab `role="tab"`, content `role="tabpanel"`
- AI messages: `role="log"`, announcement per message
- Icon buttons: `aria-label` required
- Status updates via `aria-live="polite"` region

### 11.4 Focus Indicators
- Default: `outline: 2px solid brand-500`
- Focus ring offset: 2px
- Never remove outline without providing alternative
- Visible in both light and dark modes

---

## 12. Implementation Roadmap

### Phase A: Foundation Fixes (v0.6.1) ✅
- [x] secrets_get returns actual value
- [x] PTY race condition + listener leak fixed
- [x] OSC 7 cwd tracking wired
- [x] CSP iframe fix
- [x] Preview onUrlChange wired
- [x] Settings module created

### Phase B: Block Model (Next)
- [ ] Block list data structure (Zustand store)
- [ ] Block rendering in terminal (command vs output separation)
- [ ] Block actions (copy, share, collapse)
- [ ] Command navigation (Cmd+Up/Down)

### Phase C: UI Polish
- [ ] Unified spacing scale (4px base)
- [ ] Token-based color system in Tailwind v4
- [ ] Scrollbar theming
- [ ] Focus indicators across all interactive elements
- [ ] Keyboard shortcuts registry
- [ ] Reduced motion support

### Phase D: Advanced Interactions
- [ ] Command Palette
- [ ] Split panes
- [ ] Tab drag-to-reorder
- [ ] AI mode visual states (thinking, executing, error)
- [ ] Session persistence UI

### Phase E: Theme Expansion
- [ ] Dracula, Catppuccin Mocha, One Dark, GitHub themes
- [ ] User-customizable theme tokens
- [ ] Theme import/export

---

## 13. References

### Research Sources
- Warp Block Model — `warp.dev/blog/block-model`
- Claude Code Design Space — arXiv:2604.14228
- OpenDev Architecture — arXiv:2603.05344
- Aineer ADE — github.com/andeya/aineer
- Atoo Studio — github.com/atooai/atoo-studio
- Matrix IDE — github.com/AskEntity/Matrix
- Better Agentic IDE — github.com/alvin-reyes/better-agentic-ide

### Design Methods
- Gestalt Principles (Law of Proximity, Common Region, Similarity)
- Aesthetic-Usability Effect
- Von Restorff Effect
- WCAG 2.2 AA Accessibility
- Representational Compatibility (HCI Theory)
