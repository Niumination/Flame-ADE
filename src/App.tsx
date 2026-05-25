import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react'
import { homeDir as getHomeDir } from '@tauri-apps/api/path'
import { isTauri } from '@tauri-apps/api/core'
import { useTabs, TabBar } from './modules/tabs'
import { TerminalStack } from './modules/terminal'
import { EditorStack } from './modules/editor'
import { Header } from './modules/header'
import { StatusBar } from './modules/statusbar'
import { ThemeProvider } from './modules/theme'
import { useTerminalPrefs } from './modules/terminal/lib/useTerminalPrefs'
import { useWorkspace } from './modules/explorer/lib/useWorkspace'
import { registerShortcut, matchBinding } from './modules/shortcuts'
import { SidebarRail, type SidebarViewId, SearchPanel, DebuggerPanel } from './modules/sidebar'
import { useSourceControl, SourceControlPanel } from './modules/source-control'
import { useAiWindowStore, AiFloatingBubble, AiChatPopup } from './modules/ai'
import { loadFromStore } from './modules/ai/store/chatStore'

const AiPanel = lazy(() => import('./modules/ai').then(m => ({ default: m.AiPanel })))
const AiDiffPanel = lazy(() => import('./modules/ai').then(m => ({ default: m.AiDiffPanel })))
const ExplorerPanel = lazy(() => import('./modules/explorer').then(m => ({ default: m.ExplorerPanel })))
const GitPanel = lazy(() => import('./modules/git').then(m => ({ default: m.GitPanel })))
const PreviewPanel = lazy(() => import('./modules/preview').then(m => ({ default: m.PreviewPanel })))
const SettingsPanel = lazy(() => import('./modules/settings').then(m => ({ default: m.SettingsPanel })))
const MarkdownPreviewPane = lazy(() => import('./modules/markdown').then(m => ({ default: m.MarkdownPreviewPane })))
const GitHistoryStack = lazy(() => import('./modules/git-history').then(m => ({ default: m.GitHistoryStack })))


function AppContent() {
  const tabs = useTabs((s) => s.tabs)
  const activeTabId = useTabs((s) => s.activeTabId)
  const addTab = useTabs((s) => s.addTab)
  const [homeDir, setHomeDir] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const workspacePath = useWorkspace((s) => s.workspacePath)
  const pickAndSetWorkspace = useWorkspace((s) => s.pickAndSetWorkspace)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const fileContents = useRef<Map<string, string>>(new Map())
  const loadTerminalApps = useTerminalPrefs((s) => s.loadApps)
  const [sidebarView, setSidebarViewState] = useState<SidebarViewId>('explorer')
  const setSidebarView = useCallback((view: SidebarViewId) => {
    if (view === 'git-history') {
      addTab({ kind: 'git-history', label: 'Git History', cwd: workspacePath || homeDir })
      return
    }
    if (view === 'preview') {
      addTab({ kind: 'preview', label: 'Preview', cwd: 'http://localhost:3000' })
      return
    }
    if (view === 'markdown') {
      addTab({ kind: 'markdown', label: 'Markdown' })
      return
    }
    if (view === 'settings') {
      addTab({ kind: 'settings', label: 'Settings' })
      return
    }
    setSidebarViewState(view)
  }, [workspacePath, homeDir, addTab])
  const scm = useSourceControl(workspacePath || homeDir)
  const aiMode = useAiWindowStore((s) => s.mode)
  const setAiMode = useAiWindowStore((s) => s.setMode)
  useEffect(() => {
    addTab({ kind: 'terminal', label: 'Terminal 1' })
    getHomeDir().then(setHomeDir).catch(() => setHomeDir('/'))
    loadTerminalApps()
  }, [])

  useEffect(() => {
    const unregisters: (() => void)[] = []

    unregisters.push(registerShortcut({
      key: 'i', meta: true, description: 'Toggle AI panel',
      handler: () => setAiMode(aiMode === 'hidden' ? 'floating' : 'hidden'),
    }))

    unregisters.push(registerShortcut({
      key: 'e', meta: true, description: 'Toggle sidebar',
      handler: () => setSidebarOpen((p) => !p),
    }))

    unregisters.push(registerShortcut({
      key: 't', meta: true, description: 'New terminal tab',
      handler: () => addTab({ kind: 'terminal', label: `Terminal ${tabs.length + 1}` }),
    }))

    unregisters.push(registerShortcut({
      key: 'w', meta: true, description: 'Close tab',
      handler: () => { if (activeTabId) useTabs.getState().removeTab(activeTabId) },
    }))

    for (let i = 1; i <= 9; i++) {
      const idx = i - 1
      unregisters.push(registerShortcut({
        key: String(i), meta: true, description: `Switch to tab ${i}`,
        handler: () => {
          const t = useTabs.getState().tabs
          if (t[idx]) useTabs.getState().setActiveTab(t[idx].id)
        },
      }))
    }

    unregisters.push(registerShortcut({
      key: ']', meta: true, shift: true, description: 'Next tab',
      handler: () => {
        const s = useTabs.getState()
        const idx = s.tabs.findIndex((t) => t.id === s.activeTabId)
        if (idx >= 0 && idx < s.tabs.length - 1) s.setActiveTab(s.tabs[idx + 1].id)
      },
    }))

    unregisters.push(registerShortcut({
      key: '[', meta: true, shift: true, description: 'Previous tab',
      handler: () => {
        const s = useTabs.getState()
        const idx = s.tabs.findIndex((t) => t.id === s.activeTabId)
        if (idx > 0) s.setActiveTab(s.tabs[idx - 1].id)
      },
    }))

    unregisters.push(registerShortcut({
      key: 'o', meta: true, shift: true, description: 'Open folder',
      handler: () => pickAndSetWorkspace(),
    }))

    const handler = (e: KeyboardEvent) => {
      const binding = matchBinding(e)
      if (binding) {
        e.preventDefault()
        binding.handler()
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      unregisters.forEach((u) => u())
    }
  }, [aiMode])

  const handleFileSelect = useCallback(async (path: string) => {
    const fileName = path.split(/[\\/]/).pop() || path
    const existing = tabs.find((t) => t.kind === 'editor' && t.cwd === path)
    if (existing) {
      useTabs.getState().setActiveTab(existing.id)
      return
    }
    try {
      const { readFile } = await import('./modules/explorer/lib/fs-bridge')
      const content = await readFile(path)
      fileContents.current.set(path, content)
      addTab({ kind: 'editor', label: fileName, cwd: path })
    } catch {
      addTab({ kind: 'editor', label: fileName, cwd: path })
    }
  }, [tabs, addTab])

  // Re-attach listener for detached window
  const unlistenRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    if (aiMode === 'detached' && isTauri()) {
      import('@tauri-apps/api/event').then(({ listen }) => {
        listen('re-attach-ai', async () => {
          await loadFromStore()
          setAiMode('floating')
        }).then((fn) => { unlistenRef.current = fn })
      })
      return () => {
        unlistenRef.current?.()
        unlistenRef.current = null
      }
    }
  }, [aiMode])

  return (
    <main className="app-shell flex h-screen w-screen flex-col bg-background text-foreground relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/15 via-transparent to-transparent pointer-events-none" />
      <Header
        showExplorer={sidebarOpen}
        onToggleExplorer={() => setSidebarOpen((p) => !p)}
        showAi={aiMode !== 'hidden'}
        onToggleAi={() => setAiMode(aiMode === 'hidden' ? 'floating' : 'hidden')}
      />
      <TabBar />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <>
            {/* Vertical sidebar rail */}
            <SidebarRail
              activeView={sidebarView}
              onSelectView={setSidebarView}
              changedCount={scm.changedCount}
            />
            {/* Panel content */}
            <div className="flex w-56 flex-shrink-0 flex-col border-r border-white/[0.06]">
              <div className="min-h-0 flex-1 overflow-hidden">
                {sidebarView === 'explorer' ? (
                  <ExplorerPanel onFileSelect={handleFileSelect} />
                ) : sidebarView === 'search' ? (
                  <SearchPanel onFileSelect={handleFileSelect} />
                ) : sidebarView === 'debugger' ? (
                  <DebuggerPanel />
                ) : sidebarView === 'preview' ? (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--color-text-secondary)]">
                    Open preview via tab
                  </div>
                ) : sidebarView === 'markdown' ? (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--color-text-secondary)]">
                    Open markdown via tab
                  </div>
                ) : sidebarView === 'git-history' ? (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--color-text-secondary)]">
                    Git History — open via sidebar
                  </div>
                ) : sidebarView === 'extensions' ? (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--color-text-secondary)]">
                    Extensions — coming soon
                  </div>
                ) : sidebarView === 'account' ? (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--color-text-secondary)]">
                    Account — coming soon
                  </div>
                ) : (
                  <SourceControlPanel
                    open={true}
                    sourceControl={scm}
                    onOpenDiff={(input) => handleFileSelect(input.path)}
                    onOpenGitGraph={() => {
                      addTab({
                        kind: 'git-history',
                        label: 'Git History',
                        cwd: workspacePath || homeDir,
                      })
                    }}
                  />
                )}
              </div>
            </div>
          </>
        )}
        <div className="flex-1 overflow-hidden relative">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={
                tab.id === activeTabId
                  ? 'absolute inset-0'
                  : 'absolute inset-0 invisible pointer-events-none'
              }
            >
              {tab.kind === 'terminal' && <TerminalStack cwd={tab.cwd} tabId={tab.id} />}
              {tab.kind === 'editor' && (
                <EditorStack
                  path={tab.cwd || ''}
                  initialContent={fileContents.current.get(tab.cwd || '') || ''}
                />
              )}
              {tab.kind === 'preview' && (
                <Suspense fallback={<div />}>
                  <PreviewPanel
                    url={previewUrls[tab.id] || tab.cwd || 'http://localhost:3000'}
                    onUrlChange={(url) => setPreviewUrls((p) => ({ ...p, [tab.id]: url }))}
                  />
                </Suspense>
              )}
              {tab.kind === 'ai-diff' && (
                <Suspense fallback={<div />}>
                  <AiDiffPanel />
                </Suspense>
              )}
              {tab.kind === 'git' && (
                <Suspense fallback={<div />}>
                  <GitPanel repoPath={tab.cwd || workspacePath || homeDir} />
                </Suspense>
              )}
              {tab.kind === 'git-history' && (
                <Suspense fallback={<div />}>
                  <GitHistoryStack
                    repoRoot={tab.cwd || workspacePath || homeDir}
                    onOpenCommitFile={(input) => handleFileSelect(input.path)}
                  />
                </Suspense>
              )}
              {tab.kind === 'markdown' && (
                <Suspense fallback={<div />}>
                  <MarkdownPreviewPane path={(tab as any).path || ''} visible={tab.id === activeTabId} />
                </Suspense>
              )}
              {tab.kind === 'settings' && (
                <Suspense fallback={<div />}>
                  <SettingsPanel />
                </Suspense>
              )}
            </div>
          ))}
          {tabs.length === 0 && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-sm">Tidak ada tab. Klik + untuk membuat.</span>
            </div>
          )}
        </div>
        {aiMode === 'side-panel' && (
          <div className="w-80 flex-shrink-0">
            <Suspense fallback={<div className="w-80 flex-shrink-0" />}>
              <AiPanel />
            </Suspense>
          </div>
        )}
      </div>
      <StatusBar />

      {/* Floating UI */}
      {(aiMode === 'hidden' || aiMode === 'detached') && <AiFloatingBubble />}
      {aiMode === 'floating' && <AiChatPopup />}
    </main>
  )
}

function AiDetachedWindow() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadFromStore().then(() => setLoaded(true))

    import('@tauri-apps/api/webviewWindow').then(({ getCurrentWebviewWindow }) => {
      getCurrentWebviewWindow().listen('re-attach-ai', async () => {
        const { emitTo } = await import('@tauri-apps/api/event')
        await emitTo('main', 're-attach-ai', {})
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        await getCurrentWindow().close()
      })
    })
  }, [])

  if (!loaded) return null

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-1.5 select-none" data-tauri-drag-region>
        <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ background: 'linear-gradient(90deg, #ff9f45, #6c7cff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🔥 Flame AI
        </span>
        <button
          onClick={async () => {
            const { saveToStore } = await import('./modules/ai/store/chatStore')
            await saveToStore()
            const { emitTo } = await import('@tauri-apps/api/event')
            await emitTo('main', 're-attach-ai', {})
            const { getCurrentWindow } = await import('@tauri-apps/api/window')
            await getCurrentWindow().close()
          }}
          className="rounded border border-[var(--color-border)] bg-[var(--color-raised)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)] transition-colors hover:border-[rgba(255,106,0,0.3)] hover:text-[#ff9f45]"
        >
          ← Attach to main
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
          <Suspense fallback={null}>
          <AiPanel detached />
        </Suspense>
      </div>
    </div>
  )
}

function App() {
  const [isAiWindow, setIsAiWindow] = useState<boolean | null>(null)

  useEffect(() => {
    if (isTauri()) {
      import('@tauri-apps/api/webviewWindow').then(({ getCurrentWebviewWindow }) => {
        setIsAiWindow(getCurrentWebviewWindow().label === 'ai-chat')
      })
    } else {
      setIsAiWindow(false)
    }
  }, [])

  if (isAiWindow === null) return null

  return (
    <ThemeProvider>
      {isAiWindow ? <AiDetachedWindow /> : <AppContent />}
    </ThemeProvider>
  )
}

export default App
