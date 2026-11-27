import { useEffect, useState } from 'react'
import { AppIcon } from './ui/brand-mark'
import { Button } from './ui/button'
import { Field } from './ui/field'
import { Input } from './ui/input'
import { ImportStepFooter, ImportStepHeader } from './ImportSources'

interface FigmaStatus {
  configured: boolean
  connected: boolean
  clientId: string
  redirectUri: string
}

export function FigmaImportSection({
  canvasId,
  onBack,
  onImported,
}: {
  canvasId: string
  onBack: () => void
  onImported: () => void
}) {
  const [status, setStatus] = useState<FigmaStatus | null>(null)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [figmaUrl, setFigmaUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function loadStatus() {
    const res = await fetch('/api/figma/status', { credentials: 'include' })
    if (res.ok) {
      const data = (await res.json()) as FigmaStatus
      setStatus(data)
      if (data.clientId) setClientId(data.clientId)
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  async function connectFigma() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/figma/config', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
          returnTo: `/c/${canvasId}`,
        }),
      })
      const data = (await res.json()) as { authUrl?: string; error?: string }
      if (!res.ok || !data.authUrl) throw new Error(data.error || 'Không thể kết nối Figma')
      window.location.href = data.authUrl
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối Figma')
      setBusy(false)
    }
  }

  async function disconnect() {
    setBusy(true)
    await fetch('/api/figma/disconnect', { method: 'POST', credentials: 'include' })
    await loadStatus()
    setBusy(false)
  }

  async function runImport() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/canvases/${canvasId}/import-figma`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: figmaUrl.trim() }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) throw new Error(data.error || 'Import Figma thất bại')
      onImported()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import Figma thất bại')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ImportStepHeader
        icon={<AppIcon brand="figma" size={40} />}
        title="Import từ Figma"
        lede="Kết nối Figma bằng Client ID & Client Secret để kéo trực tiếp frame về canvas K17."
      />

      {!status ? (
        <p className="mt-5 text-body text-ink-soft">Đang kiểm tra kết nối Figma…</p>
      ) : !status.connected ? (
        <div className="mt-5 space-y-3.5">
          <div className="rounded-lg border border-line bg-sub px-3.5 py-2.5 text-caption text-ink-soft">
            <div className="font-medium text-ink">Callback URL (dán vào Figma OAuth App):</div>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 truncate font-mono text-ink">{status.redirectUri}</code>
              <Button
                variant="default"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(status.redirectUri)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1800)
                }}
              >
                {copied ? 'Đã copy' : 'Copy'}
              </Button>
            </div>
          </div>

          <Field label="Figma Client ID" labelVariant="form" htmlFor="figma-client-id">
            <Input
              id="figma-client-id"
              variant="well"
              inputSize="lg"
              className="font-mono"
              placeholder="Nhập Client ID từ Figma Developers"
              value={clientId}
              disabled={busy}
              onChange={(e) => setClientId(e.target.value)}
            />
          </Field>

          <Field label="Figma Client Secret" labelVariant="form" htmlFor="figma-client-secret">
            <Input
              id="figma-client-secret"
              type="password"
              variant="well"
              inputSize="lg"
              className="font-mono"
              placeholder={status.configured ? 'Đã lưu (để trống nếu giữ nguyên)' : 'Nhập Client Secret'}
              value={clientSecret}
              disabled={busy}
              onChange={(e) => setClientSecret(e.target.value)}
            />
          </Field>

          {error && <p className="text-caption text-red-600">{error}</p>}

          <ImportStepFooter note="Tạo OAuth app tại figma.com/developers/apps" onBack={onBack} backDisabled={busy}>
            <Button
              variant="primary"
              disabled={busy || (!clientId.trim() && !status.configured)}
              onClick={() => void connectFigma()}
            >
              {busy ? 'Đang chuyển tới Figma…' : 'Kết nối Figma'}
            </Button>
          </ImportStepFooter>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-2 text-caption text-emerald-800">
            <span>Đã kết nối tài khoản Figma</span>
            <button type="button" className="underline hover:opacity-80" onClick={() => void disconnect()}>
              Ngắt kết nối
            </button>
          </div>

          <Field label="Link file hoặc frame Figma" labelVariant="form" htmlFor="figma-file-url">
            <Input
              id="figma-file-url"
              variant="well"
              inputSize="lg"
              className="font-mono"
              autoFocus
              placeholder="https://www.figma.com/design/...?node-id=1-2"
              value={figmaUrl}
              disabled={busy}
              onChange={(e) => {
                setFigmaUrl(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && figmaUrl.trim()) void runImport()
              }}
            />
          </Field>

          {error && <p className="text-caption text-red-600">{error}</p>}

          <ImportStepFooter
            note="Có node-id sẽ kéo đúng frame đó; không có sẽ kéo tối đa 6 frame đầu tiên."
            onBack={onBack}
            backDisabled={busy}
          >
            <Button variant="primary" disabled={busy || !figmaUrl.trim()} onClick={() => void runImport()}>
              {busy ? 'Đang kéo từ Figma…' : 'Import vào Canvas'}
            </Button>
          </ImportStepFooter>
        </div>
      )}
    </>
  )
}
