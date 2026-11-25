import { useEffect, useMemo, useRef, useState } from 'react'
import type { ElementComment, Frame } from '../../shared/types'
import { api } from '../lib/api'
import { useStore } from '../lib/store'
import type { ScreenLayout } from '../lib/prototypePlayer'

interface ElementHit {
  selector: string
  elementId?: string
  tag: string
  text: string
  snippet: string
  rect: { x: number; y: number; width: number; height: number }
}

function formatTime(at: number): string {
  try {
    return new Date(at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function hitLabel(hit: ElementHit): string {
  const cleanText = hit.text?.trim()
  if (cleanText) {
    const short = cleanText.length > 32 ? `${cleanText.slice(0, 32)}…` : cleanText
    return `<${hit.tag}> ${short}`
  }
  return `<${hit.tag}>`
}

function snippetLabel(snippet: string): string | null {
  if (!snippet || !snippet.trim().startsWith('<')) return null
  const tagMatch = snippet.match(/^<([a-zA-Z0-9-]+)/)
  const tag = tagMatch?.[1]?.toLowerCase()
  const text = snippet.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!tag) return null
  if (text) return `<${tag}> ${text.length > 36 ? `${text.slice(0, 36)}…` : text}`
  return `<${tag}>`
}

function findActiveProtoIframe(frameId: string): Window | null {
  const overlayFrames = document.querySelectorAll<HTMLIFrameElement>(
    `[data-prototype-player] [data-proto-overlay="${frameId}"] iframe`,
  )
  const el =
    overlayFrames[overlayFrames.length - 1] ??
    document.querySelector<HTMLIFrameElement>(
      `[data-prototype-player] [data-proto-screen="${frameId}"]:not([data-proto-role="from"]) iframe`,
    )
  return el?.contentWindow ?? null
}

export function ProtoComments({
  frame,
  layout,
  open,
  guest,
  onClose,
  onSignIn,
}: {
  frame: Frame
  layout: ScreenLayout | undefined
  open: boolean
  guest: boolean
  onClose: () => void
  onSignIn?: () => void
}) {
  const comments = useStore((s) => s.comments)
  const [pinMode, setPinMode] = useState(true)
  const [hoverHit, setHoverHit] = useState<ElementHit | null>(null)
  const [selectedHits, setSelectedHits] = useState<ElementHit[]>([])
  const [draftPin, setDraftPin] = useState<{ x: number; y: number } | null>(null)
  const [draftText, setDraftText] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [guestName, setGuestName] = useState(() => {
    try {
      return localStorage.getItem('doop:guestName') ?? ''
    } catch {
      return ''
    }
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hoverReqRef = useRef(0)
  const lastProbeAtRef = useRef(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setHoverHit(null)
    setSelectedHits([])
    setDraftPin(null)
  }, [frame.id, open])

  useEffect(() => {
    if (!open || !pinMode) {
      setHoverHit(null)
      return
    }
    function onMessage(ev: MessageEvent) {
      const data = ev.data as { type?: string; reqId?: string; hit?: ElementHit | null } | null
      if (data?.type !== 'doop:hover-result') return
      if (data.reqId !== `proto-hover-${hoverReqRef.current}`) return
      setHoverHit(data.hit ?? null)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [open, pinMode])

  const { roots, repliesByRoot } = useMemo(() => {
    const frameComments = comments.filter((c) => c.frameId === frame.id)
    const rootList = frameComments
      .filter((c) => !c.parentId && !c.resolvedAt)
      .sort((a, b) => a.at - b.at)
    const map = new Map<string, ElementComment[]>()
    for (const c of frameComments) {
      if (!c.parentId) continue
      const list = map.get(c.parentId) ?? []
      list.push(c)
      map.set(c.parentId, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.at - b.at)
    return { roots: rootList, repliesByRoot: map }
  }, [comments, frame.id])

  if (!open) return null

  const scale = layout?.scale ?? 1
  const scaledW = Math.round(frame.width * scale)
  const scaledH = Math.round(frame.height * scale)

  function probeAt(designX: number, designY: number) {
    const now = performance.now()
    if (now - lastProbeAtRef.current < 35) return
    lastProbeAtRef.current = now
    const win = findActiveProtoIframe(frame.id)
    if (!win) return
    const reqId = `proto-hover-${++hoverReqRef.current}`
    win.postMessage({ type: 'doop:hover', x: designX, y: designY, reqId }, '*')
  }

  async function submitNewComment() {
    const rawText = draftText.trim()
    if (!rawText || busy) return
    setBusy(true)
    setError(null)
    try {
      const primary = selectedHits[0]
      const x = Math.round(
        primary ? primary.rect.x + primary.rect.width / 2 : (draftPin?.x ?? frame.width / 2),
      )
      const y = Math.round(
        primary ? primary.rect.y + primary.rect.height / 2 : (draftPin?.y ?? 48),
      )
      const text =
        selectedHits.length > 1
          ? `[Chọn ${selectedHits.length} phần: ${selectedHits
              .map((h, i) => `${i + 1}. ${hitLabel(h)}`)
              .join(' | ')}]\n${rawText}`
          : rawText

      const payload = {
        ...(primary
          ? {
              selector: primary.selector,
              elementId: primary.elementId,
              snippet: primary.snippet || frame.name,
              elementOrigin: { x: primary.rect.x, y: primary.rect.y },
            }
          : { snippet: frame.name }),
        text,
        x,
        y,
      }
      const created = guest
        ? await api.addGuestComment(frame.id, { ...payload, guestName: guestName.trim() || 'Khách' })
        : await api.addComment(frame.id, payload)
      useStore.getState().upsertComment(created)
      setDraftText('')
      setDraftPin(null)
      setSelectedHits([])
      setActiveId(created.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được góp ý')
    } finally {
      setBusy(false)
    }
  }

  async function submitReply(rootId: string) {
    const text = (replyText[rootId] ?? '').trim()
    if (!text || busy) return
    setBusy(true)
    setError(null)
    try {
      if (guest) {
        const reply = await api.replyGuestComment(rootId, text, guestName.trim() || 'Khách')
        useStore.getState().upsertComment(reply)
      } else {
        await api.replyComment(rootId, text)
      }
      setReplyText((prev) => ({ ...prev, [rootId]: '' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được trả lời')
    } finally {
      setBusy(false)
    }
  }

  async function handleResolve(rootId: string) {
    if (busy) return
    setBusy(true)
    try {
      await api.resolveComment(rootId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đánh dấu đã xong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Component highlight + pin overlay aligned with the active prototype screen */}
      <div className="pointer-events-none fixed inset-0 z-[85] grid place-items-center">
        <div
          className={`relative ${pinMode ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
          style={{ width: scaledW, height: scaledH }}
          onMouseMove={(e) => {
            if (!pinMode) return
            const rect = e.currentTarget.getBoundingClientRect()
            const x = Math.max(0, Math.min(frame.width, (e.clientX - rect.left) / scale))
            const y = Math.max(0, Math.min(frame.height, (e.clientY - rect.top) / scale))
            probeAt(x, y)
          }}
          onMouseLeave={() => setHoverHit(null)}
          onClick={(e) => {
            if (!pinMode) return
            const rect = e.currentTarget.getBoundingClientRect()
            const x = Math.max(8, Math.min(frame.width - 8, (e.clientX - rect.left) / scale))
            const y = Math.max(8, Math.min(frame.height - 8, (e.clientY - rect.top) / scale))
            setDraftPin({ x, y })
            if (hoverHit) {
              setSelectedHits((prev) =>
                prev.some((h) => h.selector === hoverHit.selector)
                  ? prev.filter((h) => h.selector !== hoverHit.selector)
                  : [...prev, hoverHit],
              )
            }
            setActiveId(null)
            setTimeout(() => inputRef.current?.focus(), 20)
          }}
        >
          {/* Hover highlight box around the hovered component */}
          {pinMode && hoverHit && !selectedHits.some((h) => h.selector === hoverHit.selector) && (
            <div
              style={{
                left: hoverHit.rect.x * scale,
                top: hoverHit.rect.y * scale,
                width: hoverHit.rect.width * scale,
                height: hoverHit.rect.height * scale,
              }}
              className="pointer-events-none absolute rounded-[4px] border-2 border-blue-500 bg-blue-500/10"
            >
              <span className="absolute -top-5 left-0 max-w-[260px] truncate rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                {hitLabel(hoverHit)}
              </span>
            </div>
          )}

          {/* Selected components highlight boxes (multi-select) */}
          {selectedHits.map((hit, idx) => (
            <div
              key={hit.selector}
              style={{
                left: hit.rect.x * scale,
                top: hit.rect.y * scale,
                width: hit.rect.width * scale,
                height: hit.rect.height * scale,
              }}
              className="pointer-events-none absolute rounded-[4px] border-2 border-amber-500 bg-amber-500/15 shadow-[0_0_0_2px_rgba(245,158,11,0.25)]"
            >
              <span className="absolute -top-5 left-0 max-w-[260px] truncate rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-950 shadow">
                {idx + 1}. {hitLabel(hit)}
              </span>
            </div>
          ))}

          {/* Existing comment pins */}
          {roots.map((c, idx) => {
            if (typeof c.x !== 'number' || typeof c.y !== 'number') return null
            const isSelected = activeId === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveId(c.id)
                  setDraftPin(null)
                  setSelectedHits([])
                }}
                style={{ left: c.x * scale, top: c.y * scale }}
                title={`${c.from}: ${c.text}`}
                className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow-lg transition-transform ${
                  isSelected ? 'scale-125 bg-blue-600 text-white' : 'bg-blue-500 text-white hover:scale-110'
                }`}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* Right-hand comment drawer */}
      <aside
        className="fixed top-14 right-3 bottom-3 z-[90] flex w-[340px] max-w-[92vw] flex-col overflow-hidden rounded-2xl border border-white/15 bg-neutral-950/95 text-white shadow-2xl backdrop-blur-md"
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">Góp ý trực tiếp ({roots.length})</div>
            <div className="truncate text-[11px] text-white/60">{frame.name}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPinMode((v) => !v)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                pinMode ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/75 hover:bg-white/15'
              }`}
              title="Bật để di chuột chọn đúng component cần góp ý"
            >
              {pinMode ? 'Chọn component' : 'Tương tác'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {pinMode && (
          <div className="shrink-0 border-b border-white/10 bg-blue-500/15 px-4 py-2 text-[11px] text-blue-200">
            Di chuột lên màn hình demo để chọn đúng component muốn góp ý, rồi click để ghim.
          </div>
        )}

        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
          {roots.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-xs text-white/55">
              Chưa có góp ý nào cho màn hình này. Di chuột & click vào bất kỳ component nào để ghim góp ý!
            </div>
          )}

          {roots.map((c, idx) => {
            const replies = repliesByRoot.get(c.id) ?? []
            const isSelected = activeId === c.id
            const compTag = snippetLabel(c.snippet)
            return (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`rounded-xl border p-3 transition-colors ${
                  isSelected ? 'border-blue-500 bg-white/10' : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold">{c.from}</span>
                    <span className="text-[10px] text-white/45">{formatTime(c.at)}</span>
                  </div>
                  {!guest && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleResolve(c.id)
                      }}
                      className="rounded px-1.5 py-0.5 text-[10px] text-emerald-300 hover:bg-emerald-500/20"
                    >
                      Đã xong
                    </button>
                  )}
                </div>
                {compTag && (
                  <div className="mt-1.5 inline-block max-w-full truncate rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-[10px] text-blue-200">
                    {compTag}
                  </div>
                )}
                <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-white/90">{c.text}</p>

                {replies.length > 0 && (
                  <div className="mt-2 space-y-1.5 border-l-2 border-white/15 pl-2.5">
                    {replies.map((r) => (
                      <div key={r.id} className="text-[11px]">
                        <span className="font-semibold text-white/85">{r.from}</span>{' '}
                        <span className="text-[10px] text-white/40">{formatTime(r.at)}</span>
                        <div className="text-white/80">{r.text}</div>
                      </div>
                    ))}
                  </div>
                )}

                {isSelected && (
                  <div className="mt-2.5 flex gap-1.5">
                    <input
                      value={replyText[c.id] ?? ''}
                      onChange={(e) => setReplyText((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          submitReply(c.id)
                        }
                      }}
                      placeholder="Trả lời..."
                      className="flex-1 rounded-lg border border-white/15 bg-black/40 px-2.5 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={busy || !(replyText[c.id] ?? '').trim()}
                      onClick={() => submitReply(c.id)}
                      className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40"
                    >
                      Gửi
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="shrink-0 border-t border-white/10 p-3">
          {error && <div className="mb-2 rounded-lg bg-red-500/20 px-2.5 py-1.5 text-[11px] text-red-200">{error}</div>}
          <div className="space-y-2">
            {guest && (
              <div className="flex items-center gap-1.5">
                <input
                  value={guestName}
                  onChange={(e) => {
                    const v = e.target.value
                    setGuestName(v)
                    try {
                      localStorage.setItem('doop:guestName', v)
                    } catch {}
                  }}
                  placeholder="Tên của bạn (không cần đăng nhập)..."
                  className="flex-1 rounded-lg border border-white/15 bg-black/40 px-2.5 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-500 focus:outline-none"
                />
                {onSignIn && (
                  <button
                    type="button"
                    onClick={onSignIn}
                    className="shrink-0 rounded-lg bg-white/10 px-2 py-1.5 text-[11px] text-white/75 hover:bg-white/20 hover:text-white"
                  >
                    Đăng nhập
                  </button>
                )}
              </div>
            )}
            {selectedHits.length > 0 ? (
              <div className="space-y-1.5 rounded-lg bg-amber-500/15 p-2">
                <div className="flex items-center justify-between text-[11px] font-medium text-amber-200">
                  <span>Đã chọn {selectedHits.length} phần (click thêm để chọn nhiều):</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHits([])
                      setDraftPin(null)
                    }}
                    className="text-white/65 hover:text-white"
                  >
                    Xóa hết
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedHits.map((h, i) => (
                    <span
                      key={h.selector}
                      className="inline-flex max-w-full items-center gap-1 rounded bg-amber-500/25 px-1.5 py-0.5 font-mono text-[10px] text-amber-100"
                    >
                      <span className="truncate">
                        {i + 1}. {hitLabel(h)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedHits((prev) => prev.filter((x) => x.selector !== h.selector))}
                        className="text-amber-200 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : draftPin ? (
              <div className="flex items-center justify-between text-[11px] text-amber-300">
                <span>
                  Đã ghim tại ({Math.round(draftPin.x)}, {Math.round(draftPin.y)})
                </span>
                <button type="button" onClick={() => setDraftPin(null)} className="text-white/60 hover:text-white">
                  Bỏ ghim
                </button>
              </div>
            ) : null}
            <textarea
              ref={inputRef}
              rows={2}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  submitNewComment()
                }
              }}
              placeholder="Nhập góp ý cho component đang chọn..."
              className="w-full resize-none rounded-xl border border-white/15 bg-black/40 p-2.5 text-xs text-white placeholder:text-white/40 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              disabled={busy || !draftText.trim()}
              onClick={submitNewComment}
              className="w-full rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-40"
            >
              {busy ? 'Đang gửi...' : 'Gửi góp ý'}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
