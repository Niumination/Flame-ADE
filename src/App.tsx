import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react'
import { homeDir as getHomeDir } from '@tauri-apps/api/path'
import { useTabs, TabBar } from './modules/tabs'
import { TerminalStack } from './modules/terminal'
import { EditorStack } from './modules/editor'
import { Header } from './modules/header'
import { StatusBar } from './modules/statusbar'
import { ThemeProvider } from './modules/theme'
import { useTerminalPrefs } from './modules/terminal/lib/useTerminalPrefs'
import { useWorkspace } from './modules/explorer/lib/useWorkspace'
import { registerShortcut, matchBinding } from './modules/shortcuts'

const AiPanel = lazy(() => import('./modules/ai').then(m => ({ default: m.AiPanel })))
const AiDiffPanel = lazy(() => import('./modules/ai').then(m => ({ default: m.AiDiffPanel })))
const ExplorerPanel = lazy(() => import('./modules/explorer').then(m => ({ default: m.ExplorerPanel })))
const GitPanel = lazy(() => import('./modules/git').then(m => ({ default: m.GitPanel })))
const PreviewPanel = lazy(() => import('./modules/preview').then(m => ({ default: m.PreviewPanel })))
const SettingsPanel = lazy(() => import('./modules/settings').then(m => ({ default: m.SettingsPanel })))

function AppContent() {
  const tabs = useTabs((s) => s.tabs)
  const activeTabId = useTabs((s) => s.activeTabId)
  const addTab = useTabs((s) => s.addTab)
  const [homeDir, setHomeDir] = useState('')
  const [showExplorer, setShowExplorer] = useState(true)
  const [showAi, setShowAi] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const fileContents = useRef<Map<string, string>>(new Map())
  const loadTerminalApps = useTerminalPrefs((s) => s.loadApps)
  const workspacePath = useWorkspace((s) => s.workspacePath)
  const pickAndSetWorkspace = useWorkspace((s) => s.pickAndSetWorkspace)

  useEffect(() => {
    addTab({ kind: 'terminal', label: 'Terminal 1' })
    getHomeDir().then(setHomeDir).catch(() => setHomeDir('/'))
    loadTerminalApps()
  }, [])

  useEffect(() => {
    const unregisters: (() => void)[] = []

    unregisters.push(registerShortcut({
      key: 'i', meta: true, description: 'Toggle AI panel',
      handler: () => setShowAi((p) => !p),
    }))

    unregisters.push(registerShortcut({
      key: 'e', meta: true, description: 'Toggle explorer',
      handler: () => setShowExplorer((p) => !p),
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
  }, [])

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

  return (
    <main className="flex h-screen w-screen flex-col bg-background text-foreground">
      <Header
        showExplorer={showExplorer}
        onToggleExplorer={() => setShowExplorer((p) => !p)}
        showAi={showAi}
        onToggleAi={() => setShowAi((p) => !p)}
      />
      <TabBar />
      <div className="flex flex-1 overflow-hidden">
        {showExplorer && (
          <div className="w-56 flex-shrink-0">
            <Suspense fallback={<div className="w-56 flex-shrink-0" />}>
              <ExplorerPanel onFileSelect={handleFileSelect} />
            </Suspense>
          </div>
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
              {tab.kind === 'settings' && (
                <Suspense fallback={<div />}>
                  <SettingsPanel />
                </Suspense>
              )}
            </div>
          ))}
          {tabs.length === 0 && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-sm">No tabs open. Click + to create one.</span>
            </div>
          )}
        </div>
        {showAi && (
          <div className="w-80 flex-shrink-0">
            <Suspense fallback={<div className="w-80 flex-shrink-0" />}>
              <AiPanel />
            </Suspense>
          </div>
        )}
      </div>
      <StatusBar />
    </main>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
