// api/conjunctions.js
// GET /api/conjunctions — serves active conjunction risks from your database

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).end()

  const { threshold = 10, limit = 100 } = req.query

  try {
    const { data, error } = await supabase
      .from('conjunctions')
      .select('*')
      .eq('is_active', true)
      .lte('distance_km', parseFloat(threshold))
      .order('distance_km', { ascending:true })
      .limit(Math.min(parseInt(limit), 500))

    if (error) throw error

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    return res.status(200).json({
      count:        data?.length || 0,
      threshold_km: parseFloat(threshold),
      conjunctions: data || [],
    })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
