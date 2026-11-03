import { useEffect, useRef } from 'react'
import { LAND } from './landGeo.js'
import { C, catOf } from './theme.js'

const MONO = "'JetBrains Mono', ui-monospace, monospace"
// Map rectangle inside the canvas, kept at a true 2:1 so continents aren't stretched
const R = { x: 0, y: 0, w: 1, h: 1 }
const lx = lon => R.x + ((lon + 180) / 360) * R.w
const ly = lat => R.y + ((90 - lat) / 180) * R.h

export default function MapView2D({ satellites = [], selected, onSelect, isPro = false }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({ hovered: null })
  const animRef   = useRef(null)
  const satsRef   = useRef(satellites)
  const selRef    = useRef(selected)
  const mapRef    = useRef(null) // cached static basemap

  useEffect(() => { satsRef.current = satellites }, [satellites])
  useEffect(() => { selRef.current  = selected   }, [selected])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = 0, H = 0, dpr = 1

    function drawBase() {
      const off = document.createElement('canvas')
      off.width = W * dpr; off.height = H * dpr
      const g = off.getContext('2d')
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.fillStyle = C.bg; g.fillRect(0, 0, W, H)

      // Graticule
      g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1
      for (let lon = -180; lon <= 180; lon += 30) { g.beginPath(); g.moveTo(Math.round(lx(lon)) + .5, R.y); g.lineTo(Math.round(lx(lon)) + .5, R.y + R.h); g.stroke() }
      for (let lat = -90; lat <= 90; lat += 30) { g.beginPath(); g.moveTo(R.x, Math.round(ly(lat)) + .5); g.lineTo(R.x + R.w, Math.round(ly(lat)) + .5); g.stroke() }
      g.strokeStyle = 'rgba(255,255,255,0.14)'
      g.beginPath(); g.moveTo(R.x, Math.round(ly(0)) + .5); g.lineTo(R.x + R.w, Math.round(ly(0)) + .5); g.stroke()
      g.setLineDash([2, 4]); g.strokeStyle = 'rgba(255,255,255,0.06)'
      for (const lat of [23.44, -23.44, 66.56, -66.56]) { g.beginPath(); g.moveTo(R.x, ly(lat)); g.lineTo(R.x + R.w, ly(lat)); g.stroke() }
      g.setLineDash([])

      // Land
      LAND.forEach(ring => {
        g.beginPath()
        ring.forEach(([lon, lat], i) => { const x = lx(lon), y = ly(lat); i ? g.lineTo(x, y) : g.moveTo(x, y) })
        g.closePath()
        g.fillStyle = 'rgba(237,237,234,0.045)'; g.fill()
        g.strokeStyle = 'rgba(237,237,234,0.38)'; g.lineWidth = 0.8; g.stroke()
      })

      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.strokeRect(R.x + .5, R.y + .5, R.w - 1, R.h - 1)

      // Axis labels
      g.font = `9.5px ${MONO}`; g.fillStyle = C.dim
      g.textAlign = 'center'
      for (let lon = -150; lon <= 150; lon += 30) g.fillText(`${Math.abs(lon)}°${lon < 0 ? 'W' : lon > 0 ? 'E' : ''}`, lx(lon), R.y + R.h - 8)
      g.textAlign = 'left'
      for (let lat = -60; lat <= 60; lat += 30) g.fillText(`${Math.abs(lat)}°${lat < 0 ? 'S' : lat > 0 ? 'N' : ''}`, R.x + 6, ly(lat) - 4)
      mapRef.current = off
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = canvas.parentElement.clientWidth; H = canvas.parentElement.clientHeight
      canvas.width = W * dpr; canvas.height = H * dpr
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const bottom = isPro ? 0 : 28
      const avail = H - bottom
      if (W / avail > 2) { R.h = avail; R.w = avail * 2 } else { R.w = W; R.h = W / 2 }
      R.x = (W - R.w) / 2; R.y = Math.max(0, (avail - R.h) / 2)
      drawBase()
    }
    resize()
    window.addEventListener('resize', resize)

    function bracket(x, y, r, col) {
      const L = r * 0.5
      ctx.strokeStyle = col; ctx.lineWidth = 1
      ctx.beginPath()
      ;[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => {
        ctx.moveTo(x + a * r, y + b * (r - L)); ctx.lineTo(x + a * r, y + b * r); ctx.lineTo(x + a * (r - L), y + b * r)
      })
      ctx.stroke()
    }

    function frame() {
      const sats = satsRef.current, sel = selRef.current
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      if (mapRef.current) ctx.drawImage(mapRef.current, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Crosshair through the selected object
      if (sel?.position) {
        const sx = lx(sel.position.lon), sy = ly(sel.position.lat)
        ctx.strokeStyle = 'rgba(125,211,252,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4])
        ctx.beginPath(); ctx.moveTo(R.x, sy); ctx.lineTo(R.x + R.w, sy); ctx.moveTo(sx, R.y); ctx.lineTo(sx, R.y + R.h); ctx.stroke()
        ctx.setLineDash([])
      }

      const hov = stateRef.current.hovered
      let selPt = null, hovPt = null
      const labels = []

      sats.forEach(sat => {
        const p = sat.position
        if (!p || p.lat == null || p.lon == null) { sat._mapX = null; return }
        const sx = lx(p.lon), sy = ly(p.lat)
        sat._mapX = sx; sat._mapY = sy
        const isSel = sel?.id === sat.id, isHov = hov === sat.id, isStn = sat.cat === 'stations'
        const col = sat.risk ? C.sig : catOf(sat.cat).color
        const s = isStn || sat.risk ? 4 : 2
        ctx.fillStyle = col
        ctx.fillRect(sx - s / 2, sy - s / 2, s, s)
        if (isSel) selPt = { sx, sy, sat }
        else if (isHov) hovPt = { sx, sy, sat }
        if (sat.risk && !isSel) bracket(sx, sy, 7, 'rgba(255,90,31,0.9)')
        if ((isStn || sat.risk) && !isSel && !isHov) labels.push({ sx, sy, sat, col: 'rgba(237,237,234,0.7)' })
      })

      ctx.font = `500 10px ${MONO}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
      const label = (sx, sy, text, col) => {
        ctx.fillStyle = 'rgba(5,6,7,0.8)'
        const w = ctx.measureText(text).width
        ctx.fillRect(sx + 12, sy - 8, w + 10, 16)
        ctx.fillStyle = col; ctx.fillText(text, sx + 17, sy)
      }
      labels.forEach(l => label(l.sx, l.sy, l.sat.name.toUpperCase(), l.col))
      if (hovPt) { bracket(hovPt.sx, hovPt.sy, 8, 'rgba(237,237,234,0.8)'); label(hovPt.sx, hovPt.sy, hovPt.sat.name.toUpperCase(), C.fg) }
      if (selPt) {
        ctx.fillStyle = '#fff'; ctx.fillRect(selPt.sx - 2.5, selPt.sy - 2.5, 5, 5)
        bracket(selPt.sx, selPt.sy, 11, C.live)
        label(selPt.sx, selPt.sy, `${selPt.sat.name.toUpperCase()} · ${Math.round(selPt.sat.position.alt).toLocaleString()} KM`, C.live)
      }

      // Ad bar (free tier)
      if (!isPro) {
        ctx.fillStyle = 'rgba(5,6,7,0.92)'; ctx.fillRect(0, H - 28, W, 28)
        ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(0, H - 27.5); ctx.lineTo(W, H - 27.5); ctx.stroke()
        ctx.font = `9.5px ${MONO}`; ctx.fillStyle = C.dim; ctx.textAlign = 'center'
        ctx.fillText('ADVERTISEMENT · UPGRADE TO PRO TO REMOVE ADS', W / 2, H - 14)
      }

      animRef.current = requestAnimationFrame(frame)
    }
    animRef.current = requestAnimationFrame(frame)

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left, my = e.clientY - rect.top
      let closest = null, minD = 14
      satsRef.current.forEach(sat => {
        if (sat._mapX == null) return
        const d = Math.hypot(sat._mapX - mx, sat._mapY - my)
        if (d < minD) { minD = d; closest = sat }
      })
      stateRef.current.hovered = closest?.id ?? null
      canvas.style.cursor = closest ? 'pointer' : 'crosshair'
    }
    const onClick = () => {
      const id = stateRef.current.hovered
      onSelect?.(id ? satsRef.current.find(s => s.id === id) ?? null : null)
    }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('click', onClick)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('click', onClick)
    }
  }, [onSelect, isPro])

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }} />
}
