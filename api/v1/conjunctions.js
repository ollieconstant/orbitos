// api/v1/conjunctions.js — Active conjunction risks for paying customers

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function validateKey(header) {
  if (!header?.startsWith('Bearer ')) return null
  const hash = crypto.createHash('sha256').update(header.slice(7)).digest('hex')
  const { data } = await supabase.from('api_keys').select('*').eq('key_hash', hash).eq('is_active', true).single()
  return data
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const key = await validateKey(req.headers.authorization)
  if (!key) return res.status(401).json({ error:'Invalid API key' })

  const { threshold = 10, limit = 100 } = req.query

  const { data, error } = await supabase
    .from('conjunctions')
    .select('*')
    .eq('is_active', true)
    .lte('distance_km', parseFloat(threshold))
    .order('distance_km', { ascending:true })
    .limit(Math.min(parseInt(limit), 1000))

  if (error) return res.status(500).json({ error:error.message })

  res.setHeader('Cache-Control', 's-maxage=60')
  return res.status(200).json({
    count:        data?.length || 0,
    threshold_km: parseFloat(threshold),
    conjunctions: data || [],
  })
}
