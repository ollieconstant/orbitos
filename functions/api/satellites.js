export async function onRequestGet({ request, env }) {
  const url=new URL(request.url),limit=Math.min(parseInt(url.searchParams.get('limit')||'5000'),50000),format=url.searchParams.get('format')||'json',category=url.searchParams.get('category')
  const headers={'Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=300, stale-while-revalidate=600'}
  if (!env.SUPABASE_URL||!env.SUPABASE_SERVICE_KEY) return new Response(JSON.stringify({error:'Supabase not configured',satellites:[]}),{status:503,headers:{...headers,'Content-Type':'application/json'}})
  try {
    let q=`${env.SUPABASE_URL}/rest/v1/tle_records?is_current=eq.true&select=norad_id,name,tle1,tle2,epoch,satellites!inner(category,country)&limit=${limit}&order=ingested_at.desc`
    if (category) q+=`&satellites.category=eq.${category}`
    const res=await fetch(q,{headers:{apikey:env.SUPABASE_SERVICE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_KEY}`,'Content-Type':'application/json'}})
    if (!res.ok) throw new Error('Supabase '+res.status)
    const data=await res.json()
    if (!data?.length) return new Response(JSON.stringify({error:'No data yet. Run /api/ingest first.',count:0,satellites:[]}),{status:404,headers:{...headers,'Content-Type':'application/json'}})
    if (format==='tle') { const text=data.map(r=>r.name.padEnd(24).slice(0,24)+'\n'+r.tle1+'\n'+r.tle2).join('\n');return new Response(text,{headers:{...headers,'Content-Type':'text/plain'}}) }
    const satellites=data.map(r=>({id:r.norad_id,name:r.name,category:r.satellites?.category||'unknown',country:r.satellites?.country,tle1:r.tle1,tle2:r.tle2,epoch:r.epoch}))
    return new Response(JSON.stringify({count:satellites.length,satellites}),{headers:{...headers,'Content-Type':'application/json'}})
  } catch (err) { return new Response(JSON.stringify({error:err.message,satellites:[]}),{status:500,headers:{...headers,'Content-Type':'application/json'}}) }
}
