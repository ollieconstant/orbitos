import { useEffect, useRef } from 'react'
import { LAND } from './landGeo.js'
import { C, catOf } from './theme.js'

const LABEL_FONT = "500 11px 'JetBrains Mono', ui-monospace, monospace"

// Wireframe Earth: coastlines + graticule drawn as thin lines just above the surface
function addWireframe(viewer, Cesium) {
  const lines = viewer.scene.primitives.add(new Cesium.PolylineCollection())
  const H = 12000 // metres above the ellipsoid so lines never dip below it
  const coast = Cesium.Color.fromCssColorString('#ededea').withAlpha(0.42)
  const grid  = Cesium.Color.fromCssColorString('#ededea').withAlpha(0.07)
  const densify = ring => {
    const out = []
    for (let i = 0; i < ring.length; i++) {
      const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % ring.length]
      if (y1 < -85 || y2 < -85) continue // skip Antarctica's closing edge through the pole
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 1.5))
      for (let k = 0; k < n; k++) out.push(x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n, H)
    }
    if (out.length >= 3) out.push(out[0], out[1], H)
    return out
  }
  LAND.forEach(ring => {
    const pts = densify(ring)
    if (pts.length >= 6) lines.add({ positions: Cesium.Cartesian3.fromDegreesArrayHeights(pts), width: 1, material: Cesium.Material.fromType('Color', { color: coast }) })
  })
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = []; for (let lon = -180; lon <= 180; lon += 2) pts.push(lon, lat, H)
    lines.add({ positions: Cesium.Cartesian3.fromDegreesArrayHeights(pts), width: 1, material: Cesium.Material.fromType('Color', { color: grid }) })
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const pts = []; for (let lat = -88; lat <= 88; lat += 2) pts.push(lon, lat, H)
    lines.add({ positions: Cesium.Cartesian3.fromDegreesArrayHeights(pts), width: 1, material: Cesium.Material.fromType('Color', { color: grid }) })
  }
}

export default function Globe({ satellites=[], selected, onSelectSat, onViewerReady, orbitPaths={} }) {
  const containerRef = useRef(null)
  const viewerRef    = useRef(null)
  const entitiesRef  = useRef({})
  const orbitRef     = useRef({})

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return
    const tryInit = () => {
      const Cesium = window.Cesium
      if (!Cesium) { setTimeout(tryInit, 200); return }
      try {
        const token = import.meta.env.VITE_CESIUM_TOKEN
        if (token) Cesium.Ion.defaultAccessToken = token

        const viewerOptions = {
          animation:false, baseLayerPicker:false, fullscreenButton:false,
          geocoder:false, homeButton:false, infoBox:false, sceneModePicker:false,
          selectionIndicator:false, timeline:false, navigationHelpButton:false,
          creditContainer:document.createElement('div'),
          terrainProvider:new Cesium.EllipsoidTerrainProvider(),
        }
        if (!token) {
          viewerOptions.imageryProvider = new Cesium.SingleTileImageryProvider({
            url:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            rectangle:Cesium.Rectangle.fromDegrees(-180,-90,180,90),
          })
        }

        const viewer = new Cesium.Viewer(containerRef.current, viewerOptions)
        viewer.scene.backgroundColor    = Cesium.Color.fromCssColorString(C.bg)
        viewer.scene.globe.enableLighting = false
        viewer.scene.skyAtmosphere.show = false
        viewer.scene.globe.showGroundAtmosphere = false
        if (viewer.scene.skyBox) viewer.scene.skyBox.show = false
        if (viewer.scene.sun) viewer.scene.sun.show = false
        if (viewer.scene.moon) viewer.scene.moon.show = false
        viewer.scene.fog.enabled        = false
        if (!token) {
          viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0b0d10')
          viewer.scene.imageryLayers.removeAll()
          try { addWireframe(viewer, Cesium) } catch (e) { console.warn('[Globe] wireframe', e.message) }
        }
        viewer.camera.setView({ destination:Cesium.Cartesian3.fromDegrees(0,20,22000000) })

        viewer.screenSpaceEventHandler.setInputAction((click) => {
          const picked = viewer.scene.pick(click.position)
          if (Cesium.defined(picked) && picked.id?.satelliteData) onSelectSat?.(picked.id.satelliteData)
          else onSelectSat?.(null)
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

        try {
          if (viewer.entities.cluster) {
            viewer.entities.cluster.enabled = true
            viewer.entities.cluster.pixelRange = 25
            viewer.entities.cluster.minimumClusterSize = 4
            viewer.entities.cluster.clusterEvent.addEventListener((clustered, cp) => {
              const count = clustered.length, size = count < 10 ? 20 : count < 100 ? 28 : 36
              const canvas = document.createElement('canvas')
              canvas.width = canvas.height = size * 2
              const ctx = canvas.getContext('2d')
              // Square bracket reticle with a mono count
              const s = size * 2, L = size * 0.55
              ctx.fillStyle='rgba(5,6,7,0.85)'; ctx.fillRect(3,3,s-6,s-6)
              ctx.strokeStyle='rgba(237,237,234,0.85)'; ctx.lineWidth=1.5
              ctx.beginPath()
              ;[[2,2,1,1],[s-2,2,-1,1],[s-2,s-2,-1,-1],[2,s-2,1,-1]].forEach(([x,y,a,b]) => { ctx.moveTo(x+a*L,y); ctx.lineTo(x,y); ctx.lineTo(x,y+b*L) })
              ctx.stroke()
              ctx.font=`500 ${Math.round(size*.5)}px 'JetBrains Mono', ui-monospace, monospace`
              ctx.fillStyle='#ededea'; ctx.textAlign='center'; ctx.textBaseline='middle'
              ctx.fillText(count>999?'999+':String(count),size,size)
              cp.billboard.show=true; cp.billboard.image=canvas; cp.label.show=false
            })
          }
        } catch {}

        viewerRef.current = viewer
        onViewerReady?.(viewer)
      } catch (err) { console.error('[Globe] Init failed:', err.message) }
    }
    tryInit()
    return () => {
      try { if (viewerRef.current && !viewerRef.current.isDestroyed()) viewerRef.current.destroy() } catch {}
      viewerRef.current = null
    }
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current, Cesium = window.Cesium
    if (!viewer || !Cesium || viewer.isDestroyed()) return
    const currentIds = new Set()
    for (const sat of satellites) {
      if (!sat.position) continue
      const { lat, lon, alt } = sat.position
      if (lat==null||lon==null||alt==null) continue
      currentIds.add(String(sat.id))
      const isSel = selected?.id===sat.id
      const col   = Cesium.Color.fromCssColorString(sat.risk ? C.sig : isSel ? '#ffffff' : catOf(sat.cat).color)
      const pos   = Cesium.Cartesian3.fromDegrees(lon,lat,alt*1000)
      const sz    = isSel?11:sat.risk?8:sat.cat==='stations'?8:4
      if (entitiesRef.current[sat.id]) {
        const e = entitiesRef.current[sat.id]
        e.position=new Cesium.ConstantPositionProperty(pos); e.satelliteData=sat
        e.point.pixelSize=new Cesium.ConstantProperty(sz); e.point.color=new Cesium.ConstantProperty(col)
        e.label.show=new Cesium.ConstantProperty(isSel||sat.cat==='stations')
        e.point.outlineColor=new Cesium.ConstantProperty(isSel?Cesium.Color.fromCssColorString(C.live):Cesium.Color.BLACK.withAlpha(0.6))
        e.point.outlineWidth=new Cesium.ConstantProperty(isSel?3:1)
      } else {
        try {
          entitiesRef.current[sat.id] = viewer.entities.add({
            id:String(sat.id), name:sat.name, satelliteData:sat, position:pos,
            point:{ pixelSize:sz, color:col, outlineColor:isSel?Cesium.Color.fromCssColorString(C.live):Cesium.Color.BLACK.withAlpha(0.6), outlineWidth:isSel?3:1, disableDepthTestDistance:Number.POSITIVE_INFINITY, scaleByDistance:new Cesium.NearFarScalar(1e3,1.5,5e7,0.5) },
            label:{ text:sat.name.toUpperCase(), show:sat.cat==='stations'||isSel, font:LABEL_FONT, fillColor:Cesium.Color.fromCssColorString(C.fg), outlineColor:Cesium.Color.fromCssColorString(C.bg), outlineWidth:3, style:Cesium.LabelStyle.FILL_AND_OUTLINE, verticalOrigin:Cesium.VerticalOrigin.BOTTOM, pixelOffset:new Cesium.Cartesian2(0,-14), distanceDisplayCondition:new Cesium.DistanceDisplayCondition(0,6000000), disableDepthTestDistance:Number.POSITIVE_INFINITY },
          })
        } catch {}
      }
    }
    for (const id of Object.keys(entitiesRef.current)) {
      if (!currentIds.has(id)) { try { viewer.entities.removeById(id) } catch {}; delete entitiesRef.current[id] }
    }
  }, [satellites, selected])

  useEffect(() => {
    const viewer = viewerRef.current, Cesium = window.Cesium
    if (!viewer||!Cesium||viewer.isDestroyed()||!selected?.position) return
    const { lat, lon, alt } = selected.position
    if (lat==null||lon==null) return
    viewer.camera.flyTo({ destination:Cesium.Cartesian3.fromDegrees(lon,lat,(alt??400)*1000+800000), duration:1.5 })
  }, [selected?.id])

  return <div ref={containerRef} style={{ width:'100%', height:'100%', background:C.bg }} />
}
