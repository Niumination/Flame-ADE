import { useState } from 'react'

interface PreviewPanelProps {
  url: string
  onUrlChange?: (url: string) => void
}

export function PreviewPanel({ url, onUrlChange }: PreviewPanelProps) {
  const [inputUrl, setInputUrl] = useState(url)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const handleNav = () => {
    const u = inputUrl.startsWith('http') ? inputUrl : `http://${inputUrl}`
    onUrlChange?.(u)
    setError(false)
    setLoaded(false)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border">
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleNav()}
          placeholder="http://localhost:3000"
          className="flex-1 bg-muted text-foreground text-xs rounded px-2 py-1 border border-border outline-none"
        />
        <button
          onClick={handleNav}
          className="text-xs bg-muted text-foreground rounded px-2 py-1 hover:bg-border"
        >
          Go
        </button>
      </div>

      <div className="flex-1 relative">
        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <span className="text-xs animate-pulse">Loading...</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <span className="text-xs">Failed to load preview</span>
          </div>
        )}
        <iframe
          src={url}
          className="w-full h-full border-0"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  )
}
