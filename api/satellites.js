// api/satellites.js
// GET /api/satellites — serves satellite data from YOUR Supabase database
// No more Celestrak dependency. You own this data.
// Replaces the old /api/tle.js proxy

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  const { category, limit = 500, format = 'json' } = req.query

  try {
    // Build query
    let query = supabase
      .from('tle_records')
      .select(`
        norad_id, name, tle1, tle2, epoch, epoch_age_days, source,
        satellites!inner(category, country, object_type, is_active)
      `)
      .eq('is_current', true)
      .eq('satellites.is_active', true)
      .order('ingested_at', { ascending:false })
      .limit(Math.min(parseInt(limit) || 500, 5000))

    if (category) query = query.eq('satellites.category', category)

    const { data, error } = await query
    if (error) throw error

    if (!data?.length) {
      // Fallback: serve from tle proxy if DB is empty
      return res.status(404).json({ error:'No satellite data in database yet. Run /api/ingest first.' })
    }

    // Format response
    if (format === 'tle') {
      // Return as raw TLE text (for compatibility)
      const text = data.map(r =>
        `${r.name.padEnd(24).slice(0,24)}\n${r.tle1}\n${r.tle2}`
      ).join('\n')
      res.setHeader('Content-Type', 'text/plain')
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
      return res.status(200).send(text)
    }

    // Return as JSON (default)
    const satellites = data.map(r => ({
      id:            r.norad_id,
      name:          r.name,
      category:      r.satellites?.category || 'unknown',
      country:       r.satellites?.country,
      object_type:   r.satellites?.object_type,
      tle1:          r.tle1,
      tle2:          r.tle2,
      epoch:         r.epoch,
      epoch_age_days: r.epoch_age_days,
      source:        r.source,
    }))

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json({
      count:      satellites.length,
      updated_at: data[0]?.ingested_at,
      satellites,
    })

  } catch (err) {
    console.error('[/api/satellites] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
