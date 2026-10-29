// Shared design tokens for the OrbitOS app (tracker) — matches the landing page.
export const C = {
  bg: '#050607', bg2: '#0a0b0d', bg3: '#101215',
  line: 'rgba(255,255,255,0.08)', line2: 'rgba(255,255,255,0.16)',
  fg: '#ededea', mut: '#9a9ea5', dim: '#5d6168',
  live: '#7dd3fc', sig: '#ff5a1f',
}

export const SANS = "'Inter Tight','Inter',system-ui,-apple-system,sans-serif"
export const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace"

// Restrained category palette: one neutral family, a few desaturated accents.
// Orange (C.sig) is reserved for conjunction risk.
export const CAT = {
  stations: { color: '#ededea', label: 'Stations' },
  starlink: { color: '#7c8189', label: 'Starlink' },
  comms:    { color: '#d8b48a', label: 'Comms'    },
  nav:      { color: '#e7d58a', label: 'Navigation' },
  weather:  { color: '#7dd3fc', label: 'Weather'  },
  science:  { color: '#b9b0f0', label: 'Science'  },
  debris:   { color: '#c98f8f', label: 'Debris'   },
  unknown:  { color: '#5d6168', label: 'Other'    },
}

export const catOf = cat => CAT[cat] || CAT.unknown
