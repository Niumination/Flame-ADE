import { Alert02Icon, Globe02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useEffect, useCallback } from "react";
import { PreviewAddressBar } from "./PreviewAddressBar";

type PreviewPanelProps = {
  url: string;
  onUrlChange?: (url: string) => void;
};

const SUSPEND_AFTER_MS = 30_000;

function isLocalUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h === "[::1]" || h.endsWith(".localhost");
  } catch { return false; }
}

export function PreviewPanel({ url, onUrlChange }: PreviewPanelProps) {
  const [nonce, setNonce] = useState(0);
  const [loaded, setLoaded] = useState(true);
  const [visible, setVisible] = useState(true);
  const showXfoHint = url ? !isLocalUrl(url) : false;

  useEffect(() => {
    if (!url) { setVisible(true); return; }
    const t = setTimeout(() => setVisible(false), SUSPEND_AFTER_MS);
    return () => clearTimeout(t);
  }, [url, nonce]);

  const handleReload = useCallback(() => {
    setLoaded(true);
    setVisible(true);
    setNonce((n) => n + 1);
  }, []);

  const handleUrlSubmit = useCallback((newUrl: string) => {
    onUrlChange?.(newUrl);
  }, [onUrlChange]);

  if (!url) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center bg-background">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-card text-muted-foreground">
          <HugeiconsIcon icon={Globe02Icon} size={20} strokeWidth={1.5} />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">Belum ada yang di-preview</p>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            Ketik URL di atas, atau buka menu <span className="rounded bg-muted px-1 py-0.5 font-mono text-[10.5px]">Ports</span> untuk langsung ke dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <PreviewAddressBar url={url} onSubmit={handleUrlSubmit} onReload={handleReload} />
      {showXfoHint && (
        <div className="flex h-7 shrink-0 items-center gap-1.5 border-b border-border/60 bg-amber-500/8 px-3 text-[11px] text-amber-600 dark:text-amber-400">
          <HugeiconsIcon icon={Alert02Icon} size={12} strokeWidth={1.75} className="shrink-0" />
          <span className="truncate">Banyak situs publik menolak embed (X-Frame-Options). Buka di browser jika halaman kosong.</span>
        </div>
      )}
      <div className="flex-1 relative">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <span className="text-xs animate-pulse">Loading...</span>
          </div>
        )}
        {visible ? (
          <iframe
            key={`${url}#${nonce}`}
            src={url}
            className="w-full h-full border-0"
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
            referrerPolicy="no-referrer"
            allow="clipboard-read; clipboard-write; fullscreen"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-border/60 bg-card text-muted-foreground">
              <HugeiconsIcon icon={Globe02Icon} size={18} strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <p className="text-[12.5px] font-medium text-foreground">Preview dijeda</p>
              <p className="max-w-xs text-[11px] leading-relaxed text-muted-foreground">
                Dibebaskan untuk menghemat memori.
              </p>
            </div>
            <button type="button" onClick={handleReload}
              className="rounded-md border border-border/60 bg-card px-3 py-1 text-[11px] hover:bg-accent/50"
            >
              Muat ulang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
