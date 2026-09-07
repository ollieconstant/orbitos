export async function onRequestPost({ request, env }) {
  const headers={'Access-Control-Allow-Origin':'*','Content-Type':'application/json'}
  const { plan='pro', billing='monthly', email } = await request.json()
  const PRICES={pro:{monthly:env.STRIPE_PRO_MONTHLY_PRICE_ID,annual:env.STRIPE_PRO_ANNUAL_PRICE_ID}}
  const priceId=PRICES[plan]?.[billing]
  if (!priceId) return new Response(JSON.stringify({error:'Invalid plan/billing'}),{status:400,headers})
  const baseUrl=env.APP_URL||'https://orbitos-8n5.pages.dev'
  const res=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({mode:'subscription','payment_method_types[]':'card','line_items[0][price]':priceId,'line_items[0][quantity]':'1',...(email?{customer_email:email}:{}),success_url:`${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${baseUrl}/pricing`,'subscription_data[trial_period_days]':'14'})})
  const session=await res.json()
  if (!res.ok) return new Response(JSON.stringify({error:session.error?.message||'Stripe error'}),{status:500,headers})
  return new Response(JSON.stringify({url:session.url}),{headers})
}
export async function onRequestOptions(){return new Response(null,{headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}})}
