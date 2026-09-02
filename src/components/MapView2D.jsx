import { useEffect, useRef } from 'react'

const CAT_COLORS = {
  stations:'#34d399', starlink:'#94a3b8', weather:'#38bdf8',
  science:'#a78bfa', nav:'#fbbf24', debris:'#f87171', comms:'#fb923c',
}
const lx = (lon, W) => ((lon + 180) / 360) * W
const ly = (lat, H) => ((90 - lat) / 180) * H

// Detailed world coastlines
const LAND = [
  // North America
  { name:'N America', pts:[[-168,72],[-140,70],[-125,68],[-110,70],[-95,72],[-85,73],[-80,72],[-75,68],[-64,47],[-66,44],[-70,43],[-71,42],[-74,39],[-75,38],[-76,35],[-80,31],[-82,29],[-85,29],[-87,30],[-90,29],[-94,29],[-97,26],[-97,28],[-104,19],[-105,22],[-109,23],[-110,24],[-116,31],[-117,32],[-118,34],[-120,34],[-122,37],[-124,40],[-124,47],[-123,49],[-126,50],[-130,54],[-135,57],[-140,58],[-145,59],[-148,60],[-152,58],[-155,57],[-158,56],[-162,60],[-165,62],[-168,66],[-168,72]] },
  // Greenland
  { name:'Greenland', pts:[[-73,76],[-68,76],[-55,77],[-42,83],[-25,83],[-18,77],[-22,70],[-28,68],[-34,65],[-44,60],[-52,67],[-58,68],[-62,72],[-68,75],[-73,76]] },
  // Cuba
  { name:'Cuba', pts:[[-85,22],[-82,22],[-80,22],[-78,22],[-76,20],[-74,20],[-76,22],[-82,23],[-85,22]] },
  // South America
  { name:'S America', pts:[[-80,10],[-77,8],[-76,2],[-77,-1],[-78,-3],[-78,-5],[-76,-10],[-70,-18],[-70,-30],[-70,-35],[-68,-42],[-65,-45],[-66,-50],[-68,-54],[-70,-55],[-65,-55],[-58,-52],[-60,-51],[-62,-50],[-65,-45],[-68,-42],[-70,-38],[-70,-35],[-70,-30],[-70,-18],[-76,-10],[-78,-5],[-74,-52],[-70,-52],[-66,-52],[-64,-48],[-60,-52],[-56,-51],[-53,-33],[-52,-32],[-50,-29],[-48,-26],[-46,-24],[-44,-23],[-43,-23],[-40,-22],[-40,-19],[-38,-13],[-35,-10],[-35,-8],[-37,-5],[-44,-2],[-49,-1],[-50,1],[-52,4],[-60,8],[-63,10],[-62,11],[-60,8],[-75,10],[-80,10]] },
  // Europe west
  { name:'W Europe', pts:[[-9,39],[-9,37],[-8,37],[-6,37],[-5,36],[-2,35],[0,35],[2,37],[3,40],[1,41],[0,43],[-1,44],[-2,44],[-1,46],[1,47],[2,48],[2,51],[1,51],[0,52],[-1,53],[-3,54],[-5,54],[-6,54],[-5,56],[-4,57],[-3,58],[-1,60],[0,61],[5,62],[5,58],[8,57],[10,55],[12,55],[14,57],[18,58],[20,59],[22,59],[24,60],[26,62],[28,65],[30,66],[28,70],[24,70],[20,70],[16,69],[14,68],[12,66],[8,63],[5,62],[5,58],[8,55],[10,55],[12,54],[14,54],[18,54],[20,54],[22,54],[24,56],[24,58],[22,57],[20,55],[18,54],[14,54],[12,52],[14,50],[16,48],[16,47],[14,46],[12,44],[14,43],[16,40],[18,40],[20,38],[22,37],[24,36],[26,36],[28,36],[26,40],[24,42],[22,42],[20,44],[18,44],[16,44],[14,43],[12,44],[10,44],[8,44],[6,44],[4,43],[2,43],[0,43],[-2,44],[-5,44],[-8,44],[-9,39]] },
  // UK
  { name:'UK', pts:[[-6,50],[-4,50],[-2,50],[0,51],[1,52],[0,53],[-1,54],[-2,54],[-4,54],[-5,54],[-6,54],[-6,52],[-4,52],[-3,51],[-4,50],[-6,50]] },
  // Ireland
  { name:'Ireland', pts:[[-10,52],[-8,52],[-6,54],[-8,56],[-10,54],[-10,52]] },
  // Scandinavia
  { name:'Scandinavia', pts:[[5,58],[8,58],[12,56],[14,57],[18,58],[20,60],[22,64],[24,66],[26,68],[28,70],[26,71],[22,71],[18,70],[14,68],[12,65],[8,63],[5,62],[5,58]] },
  // Iceland
  { name:'Iceland', pts:[[-24,64],[-20,64],[-14,64],[-12,66],[-16,66],[-20,66],[-24,65],[-24,64]] },
  // Africa
  { name:'Africa', pts:[[-6,35],[-5,36],[-2,35],[0,35],[2,37],[5,37],[8,37],[10,37],[12,33],[14,32],[16,30],[18,28],[20,22],[20,18],[16,12],[14,10],[12,8],[8,4],[4,4],[2,5],[0,5],[-2,5],[-4,5],[-5,5],[-5,3],[-2,2],[0,1],[2,1],[8,-2],[10,-4],[12,-5],[14,-6],[16,-8],[18,-8],[20,-10],[22,-12],[24,-12],[26,-14],[28,-16],[30,-18],[32,-20],[34,-22],[34,-26],[32,-28],[30,-30],[28,-33],[26,-34],[24,-34],[22,-34],[20,-35],[18,-34],[16,-32],[14,-30],[12,-24],[10,-20],[8,-15],[6,-10],[4,-5],[2,-1],[0,2],[-2,5],[-6,5],[-8,5],[-10,6],[-12,8],[-14,10],[-16,12],[-16,14],[-14,16],[-12,18],[-12,20],[-12,22],[-10,24],[-8,26],[-8,28],[-8,30],[-10,32],[-8,34],[-6,35]] },
  // Madagascar
  { name:'Madagascar', pts:[[44,-12],[46,-14],[48,-16],[50,-18],[50,-20],[48,-22],[46,-24],[44,-22],[44,-18],[44,-14],[44,-12]] },
  // Middle East & Arabia
  { name:'Arabia', pts:[[26,40],[28,42],[30,42],[32,44],[36,37],[38,37],[40,36],[42,37],[44,38],[46,38],[48,36],[52,30],[56,24],[58,22],[56,22],[58,20],[60,18],[56,16],[52,12],[48,12],[44,12],[42,14],[42,16],[38,16],[36,14],[34,14],[32,16],[30,16],[28,20],[26,24],[26,30],[26,34],[26,40]] },
  // South Asia
  { name:'S Asia', pts:[[62,24],[66,24],[68,22],[70,20],[72,20],[74,20],[76,10],[78,8],[80,8],[80,10],[82,12],[80,14],[80,16],[78,18],[76,16],[74,18],[72,20],[70,20],[68,24],[66,28],[64,28],[62,24]] },
  // SE Asia mainland
  { name:'SE Asia', pts:[[94,22],[96,22],[98,18],[100,14],[100,6],[102,4],[104,2],[104,0],[106,4],[108,10],[108,14],[106,18],[104,20],[100,22],[98,22],[96,20],[94,22]] },
  // China & East Asia
  { name:'E Asia', pts:[[120,52],[128,52],[134,48],[136,46],[136,44],[132,42],[128,42],[124,40],[122,38],[120,36],[122,34],[122,30],[120,26],[118,24],[116,22],[114,22],[112,22],[110,20],[110,18],[108,14],[108,16],[110,18],[112,22],[114,22],[116,24],[118,24],[120,28],[122,32],[122,34],[122,38],[124,40],[128,42],[132,44],[136,46],[138,46],[140,40],[140,38],[138,36],[136,34],[134,32],[132,30],[130,32],[132,34],[134,36],[136,36],[138,38],[140,40],[142,42],[140,44],[138,46],[136,48],[132,48],[128,50],[124,50],[120,52]] },
  // Japan
  { name:'Japan', pts:[[130,32],[132,34],[134,34],[136,36],[138,38],[140,40],[140,42],[138,44],[136,44],[134,42],[132,38],[130,34],[130,32]] },
  // Korea
  { name:'Korea', pts:[[124,34],[126,34],[128,36],[130,36],[130,38],[128,38],[126,36],[124,34]] },
  // Russia far east (simplified)
  { name:'Russia', pts:[[30,66],[32,68],[36,70],[40,70],[44,68],[50,68],[56,70],[60,68],[66,68],[72,72],[80,74],[88,72],[96,70],[104,72],[108,70],[112,70],[116,68],[120,68],[124,70],[128,68],[132,68],[136,66],[140,64],[144,62],[148,60],[152,60],[156,58],[160,56],[164,54],[168,52],[168,56],[164,58],[160,60],[156,60],[152,62],[148,64],[144,62],[140,64],[136,66],[132,66],[128,68],[124,68],[120,66],[116,66],[112,68],[108,68],[104,70],[100,70],[96,68],[92,68],[88,70],[84,70],[80,72],[76,72],[72,70],[68,68],[64,66],[60,66],[56,68],[52,68],[48,66],[44,66],[40,68],[36,68],[32,66],[30,66]] },
  // Australia
  { name:'Australia', pts:[[114,-22],[116,-20],[118,-18],[120,-16],[122,-14],[124,-14],[126,-14],[128,-14],[130,-12],[132,-12],[134,-12],[136,-12],[138,-14],[140,-16],[142,-18],[144,-20],[146,-22],[148,-22],[150,-22],[152,-24],[152,-26],[150,-28],[150,-30],[152,-32],[152,-34],[150,-36],[148,-38],[146,-38],[144,-38],[142,-38],[140,-36],[138,-35],[136,-34],[134,-32],[132,-32],[130,-32],[128,-34],[126,-34],[124,-34],[122,-34],[120,-34],[118,-32],[116,-30],[114,-28],[112,-26],[112,-24],[114,-22]] },
  // New Zealand
  { name:'NZ', pts:[[166,-46],[168,-44],[170,-42],[172,-40],[174,-38],[174,-36],[172,-36],[170,-36],[168,-38],[166,-40],[166,-42],[166,-46]] },
  // Indonesia (Sumatra + Java)
  { name:'Indonesia', pts:[[96,2],[98,2],[100,0],[102,-2],[104,-4],[106,-6],[108,-8],[110,-8],[112,-8],[114,-8],[116,-8],[110,-8],[108,-6],[106,-6],[104,-4],[102,-2],[100,0],[98,2],[96,2]] },
  // Philippines
  { name:'Philippines', pts:[[118,8],[120,10],[122,12],[124,12],[124,10],[122,8],[120,6],[118,6],[118,8]] },
  // Sri Lanka
  { name:'Sri Lanka', pts:[[80,10],[82,10],[82,8],[80,6],[80,8],[80,10]] },
  // Svalbard
  { name:'Svalbard', pts:[[14,78],[18,80],[22,80],[22,78],[18,77],[14,77],[14,78]] },
  // Borneo
  { name:'Borneo', pts:[[108,2],[110,4],[112,6],[114,6],[116,6],[118,4],[118,2],[116,0],[114,-2],[112,-2],[110,0],[108,2]] },
]

export default function MapView2D({ satellites = [], selected, onSelect, isPro = false }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({ hovered: null })
  const animRef   = useRef(null)
  const satsRef   = useRef(satellites)
  const selRef    = useRef(selected)

  useEffect(() => { satsRef.current = satellites }, [satellites])
  useEffect(() => { selRef.current  = selected   }, [selected])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = canvas.parentElement.clientWidth
      canvas.height = canvas.parentElement.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function drawMap(W, H) {
      // Ocean background
      const ocean = ctx.createLinearGradient(0, 0, 0, H)
      ocean.addColorStop(0,   '#05111f')
      ocean.addColorStop(0.5, '#061422')
      ocean.addColorStop(1,   '#040e18')
      ctx.fillStyle = ocean
      ctx.fillRect(0, 0, W, H)

      // Grid lines
      ctx.strokeStyle = 'rgba(56,189,248,0.06)'
      ctx.lineWidth   = 0.5
      for (let lon = -180; lon <= 180; lon += 30) {
        ctx.beginPath(); ctx.moveTo(lx(lon,W), 0); ctx.lineTo(lx(lon,W), H); ctx.stroke()
      }
      for (let lat = -90; lat <= 90; lat += 30) {
        ctx.beginPath(); ctx.moveTo(0, ly(lat,H)); ctx.lineTo(W, ly(lat,H)); ctx.stroke()
      }

      // Equator highlight
      ctx.strokeStyle = 'rgba(56,189,248,0.18)'
      ctx.lineWidth   = 0.8
      ctx.beginPath(); ctx.moveTo(0, ly(0,H)); ctx.lineTo(W, ly(0,H)); ctx.stroke()

      // Tropics (dashed)
      ctx.strokeStyle = 'rgba(56,189,248,0.07)'
      ctx.lineWidth   = 0.5
      ctx.setLineDash([4, 4])
      for (const lat of [23.5, -23.5, 66.5, -66.5]) {
        ctx.beginPath(); ctx.moveTo(0, ly(lat,H)); ctx.lineTo(W, ly(lat,H)); ctx.stroke()
      }
      ctx.setLineDash([])

      // Landmasses
      LAND.forEach(({ pts }) => {
        if (!pts.length) return
        ctx.beginPath()
        pts.forEach(([lon, lat], i) => {
          const x = lx(lon, W), y = ly(lat, H)
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        ctx.closePath()
        const g = ctx.createLinearGradient(0, 0, 0, H)
        g.addColorStop(0, 'rgba(30,70,160,0.6)')
        g.addColorStop(1, 'rgba(18,48,110,0.6)')
        ctx.fillStyle   = g
        ctx.fill()
        ctx.strokeStyle = 'rgba(60,140,240,0.3)'
        ctx.lineWidth   = 0.8
        ctx.stroke()
      })

      // Labels
      ctx.font      = '9px system-ui'
      ctx.fillStyle = 'rgba(148,163,184,0.2)'
      ctx.textAlign = 'center'
      for (let lon = -150; lon <= 180; lon += 30) {
        ctx.fillText(lon + '°', lx(lon, W), H - 4)
      }
      ctx.textAlign = 'left'
      for (let lat = -60; lat <= 90; lat += 30) {
        ctx.fillText(lat + '°', 4, ly(lat, H) - 2)
      }
    }

    function frame() {
      const W = canvas.width, H = canvas.height
      const sats = satsRef.current, sel = selRef.current
      drawMap(W, H)

      // Ground track for selected
      if (sel?.position) {
        ctx.strokeStyle = (CAT_COLORS[sel.cat] ?? '#38bdf8') + '20'
        ctx.lineWidth   = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(0, ly(sel.position.lat, H))
        ctx.lineTo(W, ly(sel.position.lat, H))
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Satellites
      sats.forEach(sat => {
        if (!sat.position) return
        const { lat, lon } = sat.position
        if (lat == null || lon == null) return
        const sx  = lx(lon, W), sy = ly(lat, H)
        const col = sat.risk ? '#f87171' : (CAT_COLORS[sat.cat] ?? '#38bdf8')
        const isSel = sel?.id === sat.id
        const isHov = stateRef.current.hovered === sat.id
        const isStn = sat.cat === 'stations'
        const sz    = isStn ? 7 : isSel || isHov ? 6 : 3

        sat._mapX = sx; sat._mapY = sy

        // Glow
        if (isSel || isHov || isStn || sat.risk) {
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sz * 6)
          g.addColorStop(0, col + '55'); g.addColorStop(1, col + '00')
          ctx.beginPath(); ctx.arc(sx, sy, sz * 6, 0, Math.PI * 2)
          ctx.fillStyle = g; ctx.fill()
        }

        // Dot
        ctx.beginPath(); ctx.arc(sx, sy, sz, 0, Math.PI * 2)
        ctx.fillStyle = col; ctx.fill()

        // Selection ring
        if (isSel) {
          ctx.beginPath(); ctx.arc(sx, sy, sz + 5, 0, Math.PI * 2)
          ctx.strokeStyle = col + '99'; ctx.lineWidth = 1.5; ctx.stroke()
        }

        // Label
        if (isSel || isStn || isHov) {
          ctx.font      = isSel ? '600 11px system-ui' : '11px system-ui'
          ctx.fillStyle = '#f1f5f9'; ctx.textAlign = 'left'
          ctx.shadowColor = '#000'; ctx.shadowBlur = 3
          ctx.fillText(sat.name, sx + sz + 4, sy + 4)
          ctx.shadowBlur = 0
        }
      })

      // Ad bar (free tier)
      if (!isPro) {
        ctx.fillStyle = 'rgba(10,16,32,0.9)'
        ctx.fillRect(0, H - 28, W, 28)
        ctx.strokeStyle = 'rgba(56,189,248,0.1)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(0, H - 28); ctx.lineTo(W, H - 28); ctx.stroke()
        ctx.font = '11px system-ui'; ctx.fillStyle = 'rgba(148,163,184,0.35)'
        ctx.textAlign = 'center'
        ctx.fillText('Advertisement · Upgrade to Pro to remove ads', W / 2, H - 10)
      }

      animRef.current = requestAnimationFrame(frame)
    }

    animRef.current = requestAnimationFrame(frame)

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left, my = e.clientY - rect.top
      let closest = null, minD = 16
      satsRef.current.forEach(sat => {
        if (sat._mapX == null) return
        const d = Math.hypot(sat._mapX - mx, sat._mapY - my)
        if (d < minD) { minD = d; closest = sat }
      })
      stateRef.current.hovered = closest?.id ?? null
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

  return <canvas ref={canvasRef} style={{ display:'block', width:'100%', height:'100%', cursor:'crosshair' }} />
}
