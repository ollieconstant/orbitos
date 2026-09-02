import { useEffect, useRef } from 'react'

const CAT_COLORS = {
  stations:'#34d399', starlink:'#94a3b8', weather:'#38bdf8',
  science:'#a78bfa', nav:'#fbbf24', debris:'#f87171', comms:'#fb923c',
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
        viewer.scene.backgroundColor    = Cesium.Color.fromCssColorString('#030810')
        viewer.scene.globe.enableLighting = false
        viewer.scene.skyAtmosphere.show = true
        viewer.scene.fog.enabled        = false
        if (!token) {
          viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0d2060')
          viewer.scene.imageryLayers.removeAll()
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
              ctx.beginPath(); ctx.arc(size,size,size-2,0,Math.PI*2)
              ctx.strokeStyle='rgba(56,189,248,0.8)'; ctx.lineWidth=1.5; ctx.stroke()
              ctx.beginPath(); ctx.arc(size,size,size*0.62,0,Math.PI*2)
              ctx.fillStyle='rgba(10,16,32,0.9)'; ctx.fill()
              ctx.font=`bold ${Math.round(size*.55)}px system-ui`
              ctx.fillStyle='#38bdf8'; ctx.textAlign='center'; ctx.textBaseline='middle'
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
      const col   = Cesium.Color.fromCssColorString(sat.risk?'#f87171':(CAT_COLORS[sat.cat]??'#38bdf8'))
      const pos   = Cesium.Cartesian3.fromDegrees(lon,lat,alt*1000)
      const sz    = isSel?12:sat.cat==='stations'?9:5
      if (entitiesRef.current[sat.id]) {
        const e = entitiesRef.current[sat.id]
        e.position=new Cesium.ConstantPositionProperty(pos); e.satelliteData=sat
        e.point.pixelSize=new Cesium.ConstantProperty(sz); e.point.color=new Cesium.ConstantProperty(col)
        e.label.show=new Cesium.ConstantProperty(isSel||sat.cat==='stations')
      } else {
        try {
          entitiesRef.current[sat.id] = viewer.entities.add({
            id:String(sat.id), name:sat.name, satelliteData:sat, position:pos,
            point:{ pixelSize:sz, color:col, outlineColor:Cesium.Color.WHITE.withAlpha(0.12), outlineWidth:0.5, disableDepthTestDistance:Number.POSITIVE_INFINITY, scaleByDistance:new Cesium.NearFarScalar(1e3,1.5,5e7,0.5) },
            label:{ text:sat.name, show:sat.cat==='stations'||isSel, font:'600 11px system-ui', fillColor:Cesium.Color.WHITE, outlineColor:Cesium.Color.fromCssColorString('#030810'), outlineWidth:3, style:Cesium.LabelStyle.FILL_AND_OUTLINE, verticalOrigin:Cesium.VerticalOrigin.BOTTOM, pixelOffset:new Cesium.Cartesian2(0,-12), distanceDisplayCondition:new Cesium.DistanceDisplayCondition(0,6000000), disableDepthTestDistance:Number.POSITIVE_INFINITY },
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

  return <div ref={containerRef} style={{ width:'100%', height:'100%', background:'#030810' }} />
}
