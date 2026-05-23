import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react'
import { homeDir as getHomeDir } from '@tauri-apps/api/path'
import { useTabs, TabBar } from './modules/tabs'
import { TerminalStack } from './modules/terminal'
import { EditorStack } from './modules/editor'
import { Header } from './modules/header'
import { StatusBar } from './modules/statusbar'
import { ThemeProvider } from './modules/theme'
import { loadAllApiKeys } from './modules/ai'

const AiPanel = lazy(() => import('./modules/ai').then(m => ({ default: m.AiPanel })))
const AiDiffPanel = lazy(() => import('./modules/ai').then(m => ({ default: m.AiDiffPanel })))
const ExplorerPanel = lazy(() => import('./modules/explorer').then(m => ({ default: m.ExplorerPanel })))
const GitPanel = lazy(() => import('./modules/git').then(m => ({ default: m.GitPanel })))
const PreviewPanel = lazy(() => import('./modules/preview').then(m => ({ default: m.PreviewPanel })))

function AppContent() {
  const tabs = useTabs((s) => s.tabs)
  const activeTabId = useTabs((s) => s.activeTabId)
  const addTab = useTabs((s) => s.addTab)
  const [homeDir, setHomeDir] = useState('')
  const [showExplorer, setShowExplorer] = useState(true)
  const [showAi, setShowAi] = useState(false)
  const fileContents = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    addTab({ kind: 'terminal', label: 'Terminal 1' })
    getHomeDir().then(setHomeDir).catch(() => setHomeDir('/'))
    loadAllApiKeys()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'i') {
        e.preventDefault()
        setShowAi((p) => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
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
        {showExplorer && homeDir && (
          <div className="w-56 flex-shrink-0">
            <Suspense fallback={<div className="w-56 flex-shrink-0" />}>
              <ExplorerPanel rootPath={homeDir} onFileSelect={handleFileSelect} />
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
              {tab.kind === 'terminal' && <TerminalStack cwd={tab.cwd} />}
              {tab.kind === 'editor' && (
                <EditorStack
                  path={tab.cwd || ''}
                  initialContent={fileContents.current.get(tab.cwd || '') || ''}
                />
              )}
              {tab.kind === 'preview' && (
                <Suspense fallback={<div />}>
                  <PreviewPanel url={tab.cwd || 'http://localhost:3000'} />
                </Suspense>
              )}
              {tab.kind === 'ai-diff' && (
                <Suspense fallback={<div />}>
                  <AiDiffPanel />
                </Suspense>
              )}
              {tab.kind === 'git' && (
                <Suspense fallback={<div />}>
                  <GitPanel repoPath={tab.cwd || homeDir} />
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
