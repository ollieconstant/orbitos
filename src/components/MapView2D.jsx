import { useEffect, useRef } from 'react'

const CAT_COLORS = { stations:'#34d399', starlink:'#94a3b8', weather:'#38bdf8', science:'#a78bfa', nav:'#fbbf24', debris:'#f87171', comms:'#fb923c' }
const lx = (lon,W) => ((lon+180)/360)*W
const ly = (lat,H) => ((90-lat)/180)*H

const COASTLINES = [
  [[-168,72],[-140,70],[-120,68],[-110,70],[-95,72],[-85,73],[-80,72],[-75,68],[-65,65],[-60,62],[-64,47],[-66,44],[-70,43],[-71,42],[-75,38],[-76,35],[-80,31],[-82,29],[-85,29],[-87,30],[-90,29],[-94,29],[-97,26],[-105,20],[-105,23],[-109,23],[-110,24],[-117,32],[-118,34],[-122,37],[-124,40],[-124,47],[-123,49],[-125,50],[-130,54],[-135,57],[-140,58],[-145,59],[-148,60],[-152,58],[-155,57],[-158,56],[-162,60],[-165,62],[-168,66],[-168,72]],
  [[-80,8],[-75,10],[-63,10],[-62,11],[-60,8],[-52,4],[-50,1],[-49,-1],[-44,-2],[-37,-5],[-35,-8],[-35,-10],[-38,-13],[-40,-19],[-40,-22],[-43,-23],[-44,-23],[-46,-24],[-48,-26],[-50,-29],[-52,-32],[-53,-33],[-54,-35],[-58,-38],[-62,-38],[-65,-42],[-66,-45],[-68,-48],[-67,-52],[-68,-53],[-70,-52],[-72,-50],[-75,-48],[-76,-50],[-74,-52],[-70,-55],[-68,-54],[-65,-55],[-63,-52],[-60,-52],[-58,-51],[-57,-52],[-60,-51],[-62,-50],[-64,-48],[-65,-45],[-68,-42],[-70,-38],[-70,-35],[-70,-30],[-70,-18],[-76,-10],[-78,-5],[-78,0],[-78,2],[-77,6],[-77,8],[-80,8]],
  [[-9,39],[-9,37],[-8,37],[-6,37],[-5,36],[-2,35],[0,35],[2,37],[3,40],[1,41],[0,43],[-1,44],[-2,44],[-1,46],[1,47],[2,48],[2,51],[1,51],[0,52],[-1,53],[-3,54],[-5,54],[-6,54],[-5,56],[-4,57],[-3,58],[-1,60],[0,61],[5,62],[5,58],[8,57],[10,55],[12,55],[12,56],[14,57],[18,58],[20,59],[22,59],[24,60],[26,60],[28,65],[30,66],[28,70],[24,70],[20,70],[16,69],[14,68],[12,66],[8,63],[5,62],[5,58],[8,55],[10,55],[12,54],[14,54],[18,54],[20,54],[22,54],[24,56],[24,58],[22,57],[20,55],[18,54],[14,54],[12,52],[14,50],[16,48],[16,47],[14,46],[12,44],[14,43],[16,40],[18,40],[20,38],[22,37],[24,36],[26,36],[28,36],[26,40],[24,42],[22,42],[20,44],[18,44],[16,44],[14,43],[12,44],[10,44],[8,44],[6,44],[4,43],[2,43],[0,43],[-2,44],[-5,44],[-8,44],[-9,39]],
  [[-6,35],[-5,36],[-2,35],[0,35],[2,37],[5,37],[8,37],[10,37],[12,33],[14,32],[16,30],[18,28],[20,22],[20,18],[16,12],[14,10],[12,8],[8,4],[4,4],[2,5],[0,5],[-2,5],[-4,5],[-5,5],[-5,3],[-2,2],[0,1],[2,1],[8,-2],[10,-4],[12,-5],[14,-6],[16,-8],[18,-8],[20,-10],[22,-12],[24,-12],[26,-14],[28,-16],[30,-18],[32,-20],[34,-22],[34,-26],[32,-28],[30,-30],[28,-33],[26,-34],[24,-34],[22,-34],[20,-35],[18,-34],[16,-32],[14,-30],[12,-24],[10,-20],[8,-15],[6,-10],[4,-5],[2,-1],[0,2],[-2,5],[-6,5],[-8,5],[-10,6],[-12,8],[-14,10],[-16,12],[-16,14],[-14,16],[-12,18],[-12,20],[-12,22],[-10,24],[-8,26],[-8,28],[-8,30],[-10,32],[-8,34],[-6,35]],
  [[26,40],[28,42],[30,42],[32,44],[34,46],[36,47],[38,47],[40,46],[42,44],[44,42],[46,42],[48,44],[50,44],[52,46],[54,47],[56,48],[58,48],[60,46],[62,44],[64,42],[66,38],[66,34],[64,32],[62,28],[60,24],[58,22],[56,22],[58,20],[60,18],[62,16],[64,14],[66,12],[68,10],[70,12],[72,14],[74,16],[76,14],[78,12],[80,10],[82,12],[84,14],[86,16],[88,18],[90,20],[92,22],[94,24],[96,22],[98,18],[100,14],[102,10],[104,2],[104,0],[106,-2],[108,-4],[110,-6],[112,-8],[114,-8],[116,-8],[118,-6],[120,-4],[122,-2],[124,0],[126,2],[128,4],[130,6],[130,4],[128,2],[126,0],[124,-2],[122,-4],[120,-4],[118,-6],[116,-8],[114,-8],[112,-8],[110,-8],[108,-6],[106,-6],[104,-4],[102,-2],[100,0],[98,2],[96,4],[98,6],[100,8],[102,10],[104,12],[106,14],[108,16],[110,18],[112,20],[114,20],[116,22],[118,24],[120,24],[122,26],[124,28],[126,28],[128,28],[130,28],[132,26],[134,24],[136,22],[138,20],[140,18],[140,20],[138,22],[136,22],[134,24],[132,26],[130,28],[132,30],[134,32],[136,34],[138,34],[140,36],[140,38],[138,40],[136,40],[134,38],[132,36],[130,36],[128,34],[126,32],[124,30],[122,30],[120,28],[118,28],[116,26],[114,24],[112,22],[110,20],[108,20],[106,18],[104,18],[102,20],[100,22],[98,24],[96,26],[94,28],[92,26],[90,26],[88,24],[86,22],[84,24],[82,26],[80,28],[78,30],[76,32],[74,34],[72,36],[70,38],[68,36],[66,34],[64,36],[62,38],[60,40],[58,42],[56,42],[54,42],[52,44],[50,44],[48,46],[46,44],[44,44],[42,46],[40,48],[38,48],[36,46],[34,46],[32,44],[30,44],[28,42],[26,40]],
  [[114,-22],[116,-20],[118,-18],[120,-16],[122,-14],[124,-14],[126,-14],[128,-14],[130,-12],[132,-12],[134,-12],[136,-12],[138,-14],[140,-16],[142,-18],[144,-20],[146,-22],[148,-22],[150,-22],[152,-24],[152,-26],[150,-28],[150,-30],[152,-32],[152,-34],[150,-36],[148,-38],[146,-38],[144,-38],[142,-38],[140,-36],[138,-35],[136,-34],[134,-32],[132,-32],[130,-32],[128,-34],[126,-34],[124,-34],[122,-34],[120,-34],[118,-32],[116,-30],[114,-28],[112,-26],[112,-24],[114,-22]],
  [[-73,76],[-68,76],[-55,77],[-42,83],[-20,83],[-18,77],[-22,70],[-28,68],[-34,65],[-44,60],[-52,67],[-58,68],[-62,72],[-68,75],[-73,76]],
]

export default function MapView2D({ satellites=[], selected, onSelect, isPro=false }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({ hovered:null })
  const animRef   = useRef(null)
  const satsRef   = useRef(satellites)
  const selRef    = useRef(selected)

  useEffect(() => { satsRef.current=satellites }, [satellites])
  useEffect(() => { selRef.current=selected }, [selected])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => { canvas.width=canvas.parentElement.clientWidth; canvas.height=canvas.parentElement.clientHeight }
    resize()
    window.addEventListener('resize', resize)

    function drawMap(W,H) {
      const ocean = ctx.createLinearGradient(0,0,0,H)
      ocean.addColorStop(0,'#06101e'); ocean.addColorStop(1,'#040c16')
      ctx.fillStyle=ocean; ctx.fillRect(0,0,W,H)
      ctx.strokeStyle='rgba(56,189,248,0.05)'; ctx.lineWidth=.5
      for (let lon=-180;lon<=180;lon+=30) { ctx.beginPath(); ctx.moveTo(lx(lon,W),0); ctx.lineTo(lx(lon,W),H); ctx.stroke() }
      for (let lat=-90;lat<=90;lat+=30) { ctx.beginPath(); ctx.moveTo(0,ly(lat,H)); ctx.lineTo(W,ly(lat,H)); ctx.stroke() }
      ctx.strokeStyle='rgba(56,189,248,0.15)'; ctx.lineWidth=.8
      ctx.beginPath(); ctx.moveTo(0,ly(0,H)); ctx.lineTo(W,ly(0,H)); ctx.stroke()
      COASTLINES.forEach(coast => {
        ctx.beginPath(); let first=true
        coast.forEach(([lon,lat]) => { const x=lx(lon,W),y=ly(lat,H); first?ctx.moveTo(x,y):ctx.lineTo(x,y); first=false })
        ctx.closePath()
        const g=ctx.createLinearGradient(0,0,W,H); g.addColorStop(0,'rgba(22,58,130,0.55)'); g.addColorStop(1,'rgba(16,44,100,0.55)')
        ctx.fillStyle=g; ctx.fill(); ctx.strokeStyle='rgba(56,130,220,0.25)'; ctx.lineWidth=.7; ctx.stroke()
      })
      ctx.font='9px system-ui'; ctx.fillStyle='rgba(148,163,184,0.2)'; ctx.textAlign='center'
      for (let lon=-150;lon<=180;lon+=30) ctx.fillText(lon+'°',lx(lon,W),H-4)
      ctx.textAlign='left'
      for (let lat=-60;lat<=90;lat+=30) ctx.fillText(lat+'°',4,ly(lat,H)-2)
    }

    function frame() {
      const W=canvas.width,H=canvas.height
      const sats=satsRef.current, sel=selRef.current
      drawMap(W,H)
      sats.forEach(sat => {
        if (!sat.position) return
        const { lat, lon } = sat.position
        if (lat==null||lon==null) return
        const sx=lx(lon,W),sy=ly(lat,H)
        const col=sat.risk?'#f87171':(CAT_COLORS[sat.cat]??'#38bdf8')
        const isSel=sel?.id===sat.id, isHov=stateRef.current.hovered===sat.id
        const isStn=sat.cat==='stations'
        const sz=isStn?7:isSel||isHov?6:3
        sat._mapX=sx; sat._mapY=sy
        if (isSel||isHov||isStn||sat.risk) {
          const g=ctx.createRadialGradient(sx,sy,0,sx,sy,sz*6)
          g.addColorStop(0,col+'50'); g.addColorStop(1,col+'00')
          ctx.beginPath(); ctx.arc(sx,sy,sz*6,0,Math.PI*2); ctx.fillStyle=g; ctx.fill()
        }
        ctx.beginPath(); ctx.arc(sx,sy,sz,0,Math.PI*2); ctx.fillStyle=col; ctx.fill()
        if (isSel) { ctx.beginPath(); ctx.arc(sx,sy,sz+5,0,Math.PI*2); ctx.strokeStyle=col+'99'; ctx.lineWidth=1.5; ctx.stroke() }
        if (isSel||isStn||isHov) {
          ctx.font=isSel?'600 11px system-ui':'11px system-ui'
          ctx.fillStyle='#f1f5f9'; ctx.textAlign='left'
          ctx.shadowColor='#000'; ctx.shadowBlur=3
          ctx.fillText(sat.name,sx+sz+4,sy+4); ctx.shadowBlur=0
        }
      })
      if (!isPro) {
        ctx.fillStyle='rgba(10,16,32,0.92)'; ctx.fillRect(0,H-28,W,28)
        ctx.strokeStyle='rgba(56,189,248,0.12)'; ctx.lineWidth=1
        ctx.beginPath(); ctx.moveTo(0,H-28); ctx.lineTo(W,H-28); ctx.stroke()
        ctx.font='11px system-ui'; ctx.fillStyle='rgba(148,163,184,0.4)'; ctx.textAlign='center'
        ctx.fillText('Advertisement',W/2,H-10)
      }
      animRef.current=requestAnimationFrame(frame)
    }
    animRef.current=requestAnimationFrame(frame)

    const handleMove = (e) => {
      const rect=canvas.getBoundingClientRect(), mx=e.clientX-rect.left, my=e.clientY-rect.top
      let closest=null, minD=16
      satsRef.current.forEach(sat => {
        if (sat._mapX==null) return
        const d=Math.hypot(sat._mapX-mx,sat._mapY-my)
        if (d<minD) { minD=d; closest=sat }
      })
      stateRef.current.hovered=closest?.id??null
    }
    const handleClick = () => {
      const id=stateRef.current.hovered
      onSelect?.(id?satsRef.current.find(s=>s.id===id)??null:null)
    }
    canvas.addEventListener('mousemove',handleMove)
    canvas.addEventListener('click',handleClick)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize',resize)
      canvas.removeEventListener('mousemove',handleMove)
      canvas.removeEventListener('click',handleClick)
    }
  }, [onSelect, isPro])

  return <canvas ref={canvasRef} style={{ display:'block', width:'100%', height:'100%', cursor:'crosshair' }} />
}
