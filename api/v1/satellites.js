// api/v1/satellites.js — Public REST API for paying customers

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const LIMITS   = { free:100, pro:10_000, enterprise:Infinity }

async function validateKey(header) {
  if (!header?.startsWith('Bearer ')) return null
  const hash = crypto.createHash('sha256').update(header.slice(7)).digest('hex')
  const { data } = await supabase.from('api_keys').select('*').eq('key_hash', hash).eq('is_active', true).single()
  return data
}

async function rateLimit(key) {
  const hourPast = (Date.now() - new Date(key.hour_reset_at)) > 3_600_000
  const limit    = LIMITS[key.plan] || 100
  if (hourPast) {
    await supabase.from('api_keys').update({ requests_this_hour:1, hour_reset_at:new Date().toISOString() }).eq('id', key.id)
    return { ok:true, remaining:limit-1 }
  }
  const rem = limit - key.requests_this_hour
  if (rem <= 0) return { ok:false, remaining:0 }
  await supabase.from('api_keys').update({ requests_this_hour:key.requests_this_hour+1, requests_total:key.requests_total+1, last_used_at:new Date().toISOString() }).eq('id', key.id)
  return { ok:true, remaining:rem-1 }
}

async function log(keyId, endpoint, status, ms, req) {
  await supabase.from('api_usage').insert({ api_key_id:keyId, endpoint, method:req.method, status_code:status, response_ms:ms, ip_address:req.headers['x-forwarded-for'], user_agent:req.headers['user-agent'] })
}

export default async function handler(req, res) {
  const t0 = Date.now()
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const key = await validateKey(req.headers.authorization)
  if (!key) return res.status(401).json({ error:'Invalid API key', docs:'https://orbitos.space/api' })

  const { ok, remaining } = await rateLimit(key)
  res.setHeader('X-RateLimit-Limit',     LIMITS[key.plan])
  res.setHeader('X-RateLimit-Remaining', remaining)
  if (!ok) { await log(key.id, '/v1/satellites', 429, Date.now()-t0, req); return res.status(429).json({ error:'Rate limit exceeded' }) }

  try {
    const { category, limit=500 } = req.query
    let q = supabase.from('tle_records').select('norad_id,name,tle1,tle2,epoch,epoch_age_days,satellites!inner(category,country)').eq('is_current', true).limit(Math.min(+limit, 50000))
    if (category) q = q.eq('satellites.category', category)
    const { data, error } = await q
    if (error) throw error
    await log(key.id, '/v1/satellites', 200, Date.now()-t0, req)
    res.setHeader('Cache-Control', 's-maxage=60')
    return res.status(200).json({ count:data?.length||0, plan:key.plan, satellites:(data||[]).map(r=>({ id:r.norad_id, name:r.name, category:r.satellites?.category, country:r.satellites?.country, tle1:r.tle1, tle2:r.tle2, epoch:r.epoch })) })
  } catch (err) {
    await log(key.id, '/v1/satellites', 500, Date.now()-t0, req)
    return res.status(500).json({ error:err.message })
  }
}
