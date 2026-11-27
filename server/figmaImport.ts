import { env } from './env.ts'
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { randomBytes } from 'node:crypto'
import * as actions from './actions.ts'

const DATA_FILE = path.resolve(process.cwd(), 'data', 'figma-oauth.json')

interface FigmaStore {
  clientId?: string
  clientSecret?: string
  /** userId -> OAuth access_token */
  tokens: Record<string, { accessToken: string; refreshToken?: string; updatedAt: number }>
}

function readStore(): FigmaStore {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<FigmaStore>
    return {
      clientId: parsed.clientId,
      clientSecret: parsed.clientSecret,
      tokens: parsed.tokens ?? {},
    }
  } catch {
    return { tokens: {} }
  }
}

function writeStore(next: FigmaStore): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(next, null, 2), 'utf8')
}

const pendingStates = new Map<string, { userId: string; returnTo: string; createdAt: number }>()

function redirectUri(): string {
  return `${env.BETTER_AUTH_URL.replace(/\/$/, '')}/api/figma/callback`
}

function parseFigmaUrl(rawUrl: string): { fileKey: string; nodeId?: string } | null {
  try {
    const u = new URL(rawUrl.trim())
    if (!u.hostname.includes('figma.com')) return null
    const m = u.pathname.match(/\/(?:file|design|proto)\/([a-zA-Z0-9]+)/)
    if (!m) return null
    const fileKey = m[1]!
    const rawNode = u.searchParams.get('node-id')
    const nodeId = rawNode ? rawNode.replaceAll('-', ':') : undefined
    return { fileKey, nodeId }
  } catch {
    return null
  }
}

export function createFigmaRouter(deps: {
  requireCanvas: (req: express.Request, res: express.Response, canvasId: string, level: 'view' | 'edit') => unknown
}): express.Router {
  const router = express.Router()

  router.get('/api/figma/status', (req, res) => {
    if (!req.user?.id) return res.status(401).json({ error: 'sign in required' })
    const s = readStore()
    res.json({
      configured: Boolean(s.clientId && s.clientSecret),
      connected: Boolean(s.tokens[req.user.id]?.accessToken),
      clientId: s.clientId ?? '',
      redirectUri: redirectUri(),
    })
  })

  router.post('/api/figma/config', (req, res) => {
    if (!req.user?.id) return res.status(401).json({ error: 'sign in required' })
    const clientId = String(req.body?.clientId ?? '').trim()
    const clientSecret = String(req.body?.clientSecret ?? '').trim()
    const returnTo = typeof req.body?.returnTo === 'string' && req.body.returnTo.startsWith('/') ? req.body.returnTo : '/'
    const s = readStore()
    const finalId = clientId || s.clientId || ''
    const finalSecret = clientSecret || s.clientSecret || ''
    if (!finalId || !finalSecret) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ Client ID và Client Secret' })
    }
    s.clientId = finalId
    s.clientSecret = finalSecret
    writeStore(s)

    const state = randomBytes(16).toString('hex')
    pendingStates.set(state, { userId: req.user.id, returnTo, createdAt: Date.now() })
    // prune old states (>15m)
    const cutoff = Date.now() - 15 * 60_000
    for (const [k, v] of pendingStates) if (v.createdAt < cutoff) pendingStates.delete(k)

    const params = new URLSearchParams({
      client_id: finalId,
      redirect_uri: redirectUri(),
      scope: 'files:read',
      state,
      response_type: 'code',
    })
    res.json({ ok: true, authUrl: `https://www.figma.com/oauth?${params.toString()}` })
  })

  router.get('/api/figma/callback', async (req, res) => {
    const code = String(req.query.code ?? '')
    const state = String(req.query.state ?? '')
    const pending = pendingStates.get(state)
    pendingStates.delete(state)
    if (!code || !pending) return res.status(400).send('Phiên kết nối Figma không hợp lệ hoặc đã hết hạn.')

    const s = readStore()
    if (!s.clientId || !s.clientSecret) return res.status(400).send('Chưa cấu hình Figma Client ID / Secret.')

    try {
      const body = new URLSearchParams({
        client_id: s.clientId,
        client_secret: s.clientSecret,
        redirect_uri: redirectUri(),
        code,
        grant_type: 'authorization_code',
      })
      const tokenRes = await fetch('https://api.figma.com/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
      const data = (await tokenRes.json()) as { access_token?: string; refresh_token?: string; message?: string }
      if (!tokenRes.ok || !data.access_token) {
        return res.status(400).send(`Không lấy được token Figma: ${data.message || tokenRes.statusText}`)
      }
      s.tokens[pending.userId] = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        updatedAt: Date.now(),
      }
      writeStore(s)
      const sep = pending.returnTo.includes('?') ? '&' : '?'
      return res.redirect(`${pending.returnTo}${sep}import=figma`)
    } catch (e) {
      return res.status(500).send(e instanceof Error ? e.message : 'Lỗi kết nối Figma OAuth')
    }
  })

  router.post('/api/figma/disconnect', (req, res) => {
    if (!req.user?.id) return res.status(401).json({ error: 'sign in required' })
    const s = readStore()
    delete s.tokens[req.user.id]
    writeStore(s)
    res.json({ ok: true })
  })

  router.post('/api/canvases/:id/import-figma', async (req, res) => {
    if (!deps.requireCanvas(req, res, req.params.id, 'edit')) return
    const s = readStore()
    const accessToken = s.tokens[req.user!.id]?.accessToken
    if (!accessToken) return res.status(401).json({ error: 'Chưa kết nối tài khoản Figma' })

    const parsed = parseFigmaUrl(String(req.body?.url ?? ''))
    if (!parsed) return res.status(400).json({ error: 'Link Figma không hợp lệ (cần dạng figma.com/design/... hoặc figma.com/file/...)' })

    const headers = { Authorization: `Bearer ${accessToken}` }
    try {
      const targets: Array<{ id: string; name: string; width: number; height: number }> = []
      if (parsed.nodeId) {
        const nr = await fetch(
          `https://api.figma.com/v1/files/${parsed.fileKey}/nodes?ids=${encodeURIComponent(parsed.nodeId)}`,
          { headers },
        )
        if (!nr.ok) return res.status(400).json({ error: `Figma API lỗi (${nr.status}) — kiểm tra quyền truy cập file` })
        const nj = (await nr.json()) as {
          nodes?: Record<string, { document?: { id: string; name: string; absoluteBoundingBox?: { width: number; height: number } } }>
        }
        const doc = nj.nodes?.[parsed.nodeId]?.document
        if (!doc) return res.status(404).json({ error: 'Không tìm thấy frame/node trong file Figma này' })
        targets.push({
          id: doc.id,
          name: doc.name || 'Figma Frame',
          width: Math.max(320, Math.min(2400, Math.round(doc.absoluteBoundingBox?.width ?? 1440))),
          height: Math.max(320, Math.min(3200, Math.round(doc.absoluteBoundingBox?.height ?? 900))),
        })
      } else {
        const fr = await fetch(`https://api.figma.com/v1/files/${parsed.fileKey}?depth=2`, { headers })
        if (!fr.ok) return res.status(400).json({ error: `Figma API lỗi (${fr.status})` })
        const fj = (await fr.json()) as {
          document?: { children?: Array<{ children?: Array<{ id: string; name: string; type: string; absoluteBoundingBox?: { width: number; height: number } }> }> }
        }
        const children = fj.document?.children?.[0]?.children ?? []
        const frames = children.filter((c) => c.type === 'FRAME' || c.type === 'COMPONENT' || c.type === 'SECTION').slice(0, 6)
        if (!frames.length) return res.status(404).json({ error: 'Không tìm thấy frame nào ở trang đầu tiên của file Figma' })
        for (const f of frames) {
          targets.push({
            id: f.id,
            name: f.name || 'Figma Frame',
            width: Math.max(320, Math.min(2400, Math.round(f.absoluteBoundingBox?.width ?? 1440))),
            height: Math.max(320, Math.min(3200, Math.round(f.absoluteBoundingBox?.height ?? 900))),
          })
        }
      }

      const idsParam = targets.map((t) => t.id).join(',')
      const ir = await fetch(
        `https://api.figma.com/v1/images/${parsed.fileKey}?ids=${encodeURIComponent(idsParam)}&format=svg`,
        { headers },
      )
      const ij = (await ir.json()) as { images?: Record<string, string | null> }
      const created: string[] = []
      for (const item of targets) {
        const svgUrl = ij.images?.[item.id]
        if (!svgUrl) continue
        const svg = await (await fetch(svgUrl)).text()
        const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><style>*{margin:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:#fff}svg{width:100%;height:100%;display:block}</style></head><body>${svg}</body></html>`
        const frame = actions.createFrame(
          req.params.id,
          { name: item.name, width: item.width, height: item.height, html },
          { kind: 'human', name: req.user!.name, id: req.user!.id },
        )
        if (frame) created.push(frame.id)
      }
      if (!created.length) return res.status(400).json({ error: 'Không thể xuất SVG từ Figma cho frame đã chọn' })
      return res.json({ ok: true, frameIds: created })
    } catch (e) {
      return res.status(500).json({ error: e instanceof Error ? e.message : 'Import Figma thất bại' })
    }
  })

  return router
}
