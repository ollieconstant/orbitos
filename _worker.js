// OrbitOS API worker — generated from the original functions/ folder. Edit the handler sections below.
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../tmp/claude-0/-home-claude/5a67f6ef-5151-5147-a873-1db616c6a0ed/scratchpad/wk/functions/api/_middleware.js
async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin") || "";
  const ALLOWED_ORIGINS = [
    "https://orbitos-8n5.pages.dev",
    "https://orbitos.space",
    "https://www.orbitos.space",
    "http://localhost:5173",
    "http://localhost:4173"
  ];
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin"
      }
    });
  }
  const response = await next();
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", corsOrigin);
  headers.set("Vary", "Origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.delete("Server");
  headers.delete("X-Powered-By");
  return new Response(response.body, {
    status: response.status,
    headers
  });
}

// ../../tmp/claude-0/-home-claude/5a67f6ef-5151-5147-a873-1db616c6a0ed/scratchpad/wk/functions/api/tle.js
var tle_exports = {};
__export(tle_exports, {
  onRequestGet: () => onRequestGet,
  onRequestOptions: () => onRequestOptions
});
async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const group = url.searchParams.get("group");
  const CELESTRAK2 = {
    stations: "https://celestrak.org/SATCAT/elements/?GROUP=stations&FORMAT=tle",
    starlink: "https://celestrak.org/SATCAT/elements/?GROUP=starlink&FORMAT=tle",
    weather: "https://celestrak.org/SATCAT/elements/?GROUP=weather&FORMAT=tle",
    science: "https://celestrak.org/SATCAT/elements/?GROUP=science&FORMAT=tle",
    "gps-ops": "https://celestrak.org/SATCAT/elements/?GROUP=gps-ops&FORMAT=tle",
    active: "https://celestrak.org/SATCAT/elements/?GROUP=active&FORMAT=tle",
    // Map frontend group names to valid Celestrak names
    nav: "https://celestrak.org/SATCAT/elements/?GROUP=gps-ops&FORMAT=tle",
    debris: "https://celestrak.org/SATCAT/elements/?GROUP=active&FORMAT=tle"
  };
  const SEARCH = {
    stations: "ISS",
    starlink: "STARLINK",
    weather: "NOAA",
    science: "HUBBLE",
    "gps-ops": "GPS",
    active: "COSMOS",
    nav: "GPS",
    debris: "DEB"
  };
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" };
  if (!group || !CELESTRAK2[group]) {
    return new Response(
      JSON.stringify({ error: `Unknown group: ${group}. Valid: stations, starlink, weather, science, gps-ops, nav, debris, active` }),
      { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }
  try {
    const res = await fetch(CELESTRAK2[group], {
      headers: { "User-Agent": "OrbitOS/1.0" },
      cf: { cacheTtl: 7200, cacheEverything: true }
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.includes("1 ") && text.length > 100) {
        return new Response(text, { headers: { ...headers, "Cache-Control": "public, max-age=7200" } });
      }
    }
  } catch {
  }
  try {
    const term = SEARCH[group] || group.toUpperCase();
    const res = await fetch(`https://tle.ivanstanojevic.me/api/tle?search=${term}&page-size=500`, {
      headers: { "Accept": "application/json" }
    });
    if (res.ok) {
      const json2 = await res.json();
      const members = json2.member || json2["hydra:member"] || [];
      if (members.length > 0) {
        const text = members.filter((s) => s.line1 && s.line2).map((s) => `${(s.name || "UNKNOWN").padEnd(24).slice(0, 24)}
${s.line1}
${s.line2}`).join("\n");
        return new Response(text, { headers: { ...headers, "Cache-Control": "public, max-age=3600" } });
      }
    }
  } catch {
  }
  return new Response(
    JSON.stringify({ error: `All sources failed for group: ${group}` }),
    { status: 502, headers: { ...headers, "Content-Type": "application/json" } }
  );
}
async function onRequestOptions() {
  return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" }
  });
}

// ../../tmp/claude-0/-home-claude/5a67f6ef-5151-5147-a873-1db616c6a0ed/scratchpad/wk/functions/api/satellites.js
var satellites_exports = {};
__export(satellites_exports, {
  onRequestGet: () => onRequestGet2
});
async function onRequestGet2({ request, env }) {
  const url = new URL(request.url), limit = Math.min(parseInt(url.searchParams.get("limit") || "5000"), 5e4), format = url.searchParams.get("format") || "json", category = url.searchParams.get("category");
  const headers = { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=300, stale-while-revalidate=600" };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return new Response(JSON.stringify({ error: "Supabase not configured", satellites: [] }), { status: 503, headers: { ...headers, "Content-Type": "application/json" } });
  try {
    let q = `${env.SUPABASE_URL}/rest/v1/tle_records?is_current=eq.true&select=norad_id,name,tle1,tle2,epoch,satellites!inner(category,country)&limit=${limit}&order=ingested_at.desc`;
    if (category) q += `&satellites.category=eq.${category}`;
    const res = await fetch(q, { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, "Content-Type": "application/json" } });
    if (!res.ok) throw new Error("Supabase " + res.status);
    const data = await res.json();
    if (!data?.length) return new Response(JSON.stringify({ error: "No data yet. Run /api/ingest first.", count: 0, satellites: [] }), { status: 404, headers: { ...headers, "Content-Type": "application/json" } });
    if (format === "tle") {
      const text = data.map((r) => r.name.padEnd(24).slice(0, 24) + "\n" + r.tle1 + "\n" + r.tle2).join("\n");
      return new Response(text, { headers: { ...headers, "Content-Type": "text/plain" } });
    }
    const satellites = data.map((r) => ({ id: r.norad_id, name: r.name, category: r.satellites?.category || "unknown", country: r.satellites?.country, tle1: r.tle1, tle2: r.tle2, epoch: r.epoch }));
    return new Response(JSON.stringify({ count: satellites.length, satellites }), { headers: { ...headers, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, satellites: [] }), { status: 500, headers: { ...headers, "Content-Type": "application/json" } });
  }
}

// ../../tmp/claude-0/-home-claude/5a67f6ef-5151-5147-a873-1db616c6a0ed/scratchpad/wk/functions/api/ingest.js
var ingest_exports = {};
__export(ingest_exports, {
  onRequestGet: () => onRequestGet3
});
var CELESTRAK = "https://celestrak.org/NORAD/elements/gp.php";
var GROUPS = [
  { key: "stations", category: "stations" },
  { key: "gps-ops", category: "nav" },
  { key: "weather", category: "weather" },
  { key: "science", category: "science" },
  { key: "active", category: null }
  // categorised by name below
];
var NAME_RULES = [
  [/^STARLINK/, "starlink"],
  [/^(NAVSTAR|GPS |GLONASS|COSMOS 2[45]\d\d|GSAT0|GALILEO|BEIDOU|QZS|IRNSS)/, "nav"],
  [/^(ONEWEB|IRIDIUM|ORBCOMM|GLOBALSTAR|INTELSAT|SES|EUTELSAT|ASTRA|INMARSAT|VIASAT|TELESAT|KUIPER|O3B|AMAZONAS|HISPASAT|ECHOSTAR|SIRIUS|TDRS)/, "comms"],
  [/^(NOAA|GOES|METEOSAT|METOP|FENGYUN|HIMAWARI|DMSP|JPSS|SUOMI)/, "weather"],
  [/^(ISS|CSS|TIANHE|WENTIAN|MENGTIAN|TIANGONG)/, "stations"],
  [/(DEB|R\/B)/, "debris"]
];
var categorise = (name) => (NAME_RULES.find(([re]) => re.test(name)) || [, "unknown"])[1];
var json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
async function onRequestGet3({ request, env }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return json({ error: "Supabase not configured" }, 503);
  if (env.CRON_SECRET) {
    const url = new URL(request.url);
    const auth = request.headers.get("Authorization") || "";
    if (auth !== `Bearer ${env.CRON_SECRET}` && url.searchParams.get("key") !== env.CRON_SECRET) {
      return json({ error: "Unauthorised" }, 401);
    }
  }
  const started = Date.now();
  const runAt = new Date(started).toISOString();
  const errors = [];
  const groups = {};
  const byId = /* @__PURE__ */ new Map();
  for (const g of GROUPS) {
    try {
      const tles = await fetchGroup(g.key);
      let added = 0;
      for (const t of tles) {
        if (byId.has(t.noradId)) continue;
        byId.set(t.noradId, { ...t, category: g.category || categorise(t.name) });
        added++;
      }
      groups[g.key] = added;
    } catch (err) {
      groups[g.key] = 0;
      errors.push(`${g.key}: ${err.message}`);
    }
  }
  const all = [...byId.values()];
  let stored = 0;
  if (all.length) {
    try {
      stored = await storeTLEs(all, runAt, env);
      await sb(env, `tle_records?is_current=eq.true&ingested_at=lt.${encodeURIComponent(runAt)}`, "PATCH", { is_current: false });
    } catch (err) {
      errors.push(`store: ${err.message}`);
    }
  }
  const duration = Date.now() - started;
  const status = stored === 0 ? "failed" : errors.length ? "partial" : "success";
  try {
    await sb(env, "ingest_logs", "POST", {
      status,
      source: "celestrak",
      satellites_fetched: all.length,
      satellites_updated: stored,
      errors,
      duration_ms: duration,
      started_at: runAt,
      completed_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch {
  }
  return json({ status, duration_ms: duration, fetched: all.length, stored, groups, errors }, status === "failed" ? 502 : 200);
}
async function fetchGroup(group) {
  const res = await fetch(`${CELESTRAK}?GROUP=${encodeURIComponent(group)}&FORMAT=tle`, {
    headers: { "User-Agent": "OrbitOS/1.0 (+https://orbitos-8n5.pages.dev; hello@orbitos.space)" }
  });
  if (!res.ok) throw new Error(`Celestrak HTTP ${res.status}`);
  const text = await res.text();
  if (!text.includes("\n1 ")) throw new Error(`Celestrak: ${text.slice(0, 120).trim() || "empty response"}`);
  return parseTLE(text);
}
function parseTLE(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean);
  const out = [];
  for (let i = 0; i + 2 < lines.length; ) {
    const name = lines[i], l1 = lines[i + 1], l2 = lines[i + 2];
    if (l1.startsWith("1 ") && l2.startsWith("2 ") && l1.length >= 69 && l2.length >= 69) {
      const noradId = parseInt(l1.slice(2, 7), 10);
      if (!isNaN(noradId)) out.push({ name: name.replace(/^0 /, "").trim(), tle1: l1, tle2: l2, noradId });
      i += 3;
    } else {
      i += 1;
    }
  }
  return out;
}
function parseEpoch(tle1) {
  const yy = parseInt(tle1.slice(18, 20), 10);
  const doy = parseFloat(tle1.slice(20, 32));
  if (isNaN(yy) || isNaN(doy)) return null;
  const year = yy >= 57 ? 1900 + yy : 2e3 + yy;
  return new Date(Date.UTC(year, 0, 1) + (doy - 1) * 864e5).toISOString();
}
async function storeTLEs(tles, runAt, env) {
  const BATCH = 2e3;
  let n = 0;
  for (let i = 0; i < tles.length; i += BATCH) {
    const batch = tles.slice(i, i + BATCH);
    await sb(
      env,
      "satellites?on_conflict=norad_id",
      "POST",
      batch.map((t) => ({ norad_id: t.noradId, name: t.name, category: t.category, is_active: true, updated_at: runAt })),
      "resolution=merge-duplicates,return=minimal"
    );
    const rows = batch.map((t) => ({
      norad_id: t.noradId,
      name: t.name,
      tle1: t.tle1,
      tle2: t.tle2,
      epoch: parseEpoch(t.tle1),
      source: "celestrak",
      is_current: true,
      ingested_at: runAt
    }));
    await sb(env, "tle_records", "POST", rows);
    await sb(env, "tle_history", "POST", rows.map(({ is_current, ...r }) => r));
    n += batch.length;
  }
  return n;
}
async function sb(env, path, method, body, prefer = "return=minimal") {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: prefer
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${method} ${path.split("?")[0]} \u2192 ${res.status} ${(await res.text()).slice(0, 160)}`);
}

// ../../tmp/claude-0/-home-claude/5a67f6ef-5151-5147-a873-1db616c6a0ed/scratchpad/wk/functions/api/contact.js
var contact_exports = {};
__export(contact_exports, {
  onRequestOptions: () => onRequestOptions2,
  onRequestPost: () => onRequestPost
});
async function onRequestPost({ request, env }) {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  const { name, email, organisation, message, plan } = await request.json();
  if (!name || !email || !message) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers });
  await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RESEND_API_KEY}` }, body: JSON.stringify({ from: "OrbitOS Contact <hello@orbitos.space>", to: ["hello@orbitos.space"], subject: `New enquiry from ${name}${plan ? ` (${plan})` : ""}`, html: `<h2>New OrbitOS enquiry</h2><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Organisation:</b> ${organisation || "Not provided"}</p><p><b>Message:</b></p><p>${message.replace(/\n/g, "<br>")}</p>` }) });
  await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RESEND_API_KEY}` }, body: JSON.stringify({ from: "OrbitOS <hello@orbitos.space>", to: [email], subject: "We got your message", html: `<div style="background:#0a1020;font-family:system-ui;padding:28px;color:#cbd5e1;max-width:480px;margin:0 auto"><div style="color:#38bdf8;font-weight:700;font-size:16px;margin-bottom:16px">\u25CE OrbitOS</div><h2 style="color:#f1f5f9">Thanks ${name} \u2014 we will be in touch</h2><p style="color:rgba(148,163,184,0.6);line-height:1.8">We have received your message and will get back to you within 24 hours.</p><a href="https://orbitos-8n5.pages.dev/app" style="display:block;text-align:center;background:#38bdf8;color:#0f172a;padding:12px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;margin-top:16px">Try OrbitOS</a></div>` }) });
  return new Response(JSON.stringify({ sent: true }), { headers });
}
async function onRequestOptions2() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}

// ../../tmp/claude-0/-home-claude/5a67f6ef-5151-5147-a873-1db616c6a0ed/scratchpad/wk/functions/api/send-alert.js
var send_alert_exports = {};
__export(send_alert_exports, {
  onRequestOptions: () => onRequestOptions3,
  onRequestPost: () => onRequestPost2
});
async function onRequestPost2({ request, env }) {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  const { to, alert } = await request.json();
  if (!to || !alert) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers });
  const { sat1, sat2, distanceKm, severity, tcaMinutes } = alert;
  const col = severity === "CRITICAL" ? "#f87171" : "#fb923c";
  const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RESEND_API_KEY}` }, body: JSON.stringify({ from: "OrbitOS Alerts <alerts@orbitos.space>", to: [to], subject: `${severity}: ${sat1} x ${sat2} \u2014 ${distanceKm} km`, html: `<div style="background:#0a1020;font-family:system-ui;padding:24px;color:#cbd5e1;max-width:480px;margin:0 auto;border:1px solid ${col}44;border-radius:12px"><div style="color:#38bdf8;font-weight:700;margin-bottom:14px">\u25CE OrbitOS</div><h2 style="color:${col}">Conjunction Alert \u2014 ${severity}</h2><div style="background:${col}18;border:1px solid ${col}44;border-radius:8px;padding:16px;text-align:center;margin:16px 0"><div style="font-size:16px;font-weight:700;color:#f1f5f9;margin-bottom:4px">${sat1} x ${sat2}</div><div style="font-size:24px;font-weight:700;color:${col}">${distanceKm} km</div><div style="font-size:12px;color:rgba(148,163,184,0.5);margin-top:4px">TCA: ${tcaMinutes} minutes</div></div><a href="https://orbitos-8n5.pages.dev/app" style="display:block;text-align:center;background:#38bdf8;color:#0f172a;padding:11px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none">View in OrbitOS</a></div>` }) });
  return new Response(JSON.stringify({ sent: res.ok }), { headers });
}
async function onRequestOptions3() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}

// ../../tmp/claude-0/-home-claude/5a67f6ef-5151-5147-a873-1db616c6a0ed/scratchpad/wk/functions/api/stripe-checkout.js
var stripe_checkout_exports = {};
__export(stripe_checkout_exports, {
  onRequestOptions: () => onRequestOptions4,
  onRequestPost: () => onRequestPost3
});
async function onRequestPost3({ request, env }) {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  const { plan = "pro", billing = "monthly", email } = await request.json();
  const PRICES = { pro: { monthly: env.STRIPE_PRO_MONTHLY_PRICE_ID, annual: env.STRIPE_PRO_ANNUAL_PRICE_ID } };
  const priceId = PRICES[plan]?.[billing];
  if (!priceId) return new Response(JSON.stringify({ error: "Invalid plan/billing" }), { status: 400, headers });
  const baseUrl = env.APP_URL || "https://orbitos-8n5.pages.dev";
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ mode: "subscription", "payment_method_types[]": "card", "line_items[0][price]": priceId, "line_items[0][quantity]": "1", ...email ? { customer_email: email } : {}, success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${baseUrl}/pricing`, "subscription_data[trial_period_days]": "14" }) });
  const session = await res.json();
  if (!res.ok) return new Response(JSON.stringify({ error: session.error?.message || "Stripe error" }), { status: 500, headers });
  return new Response(JSON.stringify({ url: session.url }), { headers });
}
async function onRequestOptions4() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}

// ../../tmp/claude-0/-home-claude/5a67f6ef-5151-5147-a873-1db616c6a0ed/scratchpad/wk/functions/api/stripe-webhook.js
var stripe_webhook_exports = {};
__export(stripe_webhook_exports, {
  onRequestPost: () => onRequestPost4
});
async function verifyStripeSignature(body, signature, secret) {
  try {
    const parts = signature.split(",");
    const timestamp = parts.find((p) => p.startsWith("t=")).slice(2);
    const v1 = parts.find((p) => p.startsWith("v1=")).slice(3);
    if (Math.abs(Date.now() / 1e3 - parseInt(timestamp)) > 300) return false;
    const payload = `${timestamp}.${body}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return hex === v1;
  } catch {
    return false;
  }
}
async function sendEmail(apiKey, { to, subject, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ from: "OrbitOS <hello@orbitos.space>", to: [to], subject, html })
  });
  if (!res.ok) console.error("[Email] Failed:", await res.text());
}
async function onRequestPost4({ request, env }) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Missing signature", { status: 400 });
  }
  const valid = await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return new Response("Invalid signature", { status: 400 });
  }
  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const appUrl = env.APP_URL || "https://orbitos-8n5.pages.dev";
  switch (event.type) {
    case "checkout.session.completed": {
      const email = event.data.object.customer_email || event.data.object.customer_details?.email;
      if (email && env.RESEND_API_KEY) {
        await sendEmail(env.RESEND_API_KEY, {
          to: email,
          subject: "Welcome to OrbitOS Pro",
          html: `<div style="background:#0a1020;font-family:system-ui;padding:32px;color:#cbd5e1;max-width:520px;margin:0 auto"><div style="color:#38bdf8;font-size:20px;font-weight:700;margin-bottom:16px">OrbitOS</div><h1 style="color:#f1f5f9;font-size:22px;margin-bottom:12px">Welcome to Pro</h1><p style="color:rgba(148,163,184,0.7);line-height:1.8;margin-bottom:20px">You now have full access to OrbitOS Pro. Your 14-day free trial has started.</p><a href="${appUrl}/app" style="display:block;text-align:center;background:#38bdf8;color:#0f172a;padding:12px;border-radius:8px;font-weight:700;text-decoration:none">Open OrbitOS</a></div>`
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const custRes = await fetch(`https://api.stripe.com/v1/customers/${event.data.object.customer}`, {
        headers: { "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}` }
      });
      const cust = await custRes.json();
      if (cust.email && env.RESEND_API_KEY) {
        await sendEmail(env.RESEND_API_KEY, {
          to: cust.email,
          subject: "Your OrbitOS Pro subscription has ended",
          html: `<div style="background:#0a1020;font-family:system-ui;padding:32px;color:#cbd5e1;max-width:520px;margin:0 auto"><div style="color:#38bdf8;font-size:20px;font-weight:700;margin-bottom:16px">OrbitOS</div><h1 style="color:#f1f5f9;font-size:20px;margin-bottom:12px">Subscription ended</h1><p style="color:rgba(148,163,184,0.6);line-height:1.8;margin-bottom:20px">Your account has moved to the free plan. Your data is saved.</p><a href="${appUrl}/pricing" style="display:block;text-align:center;background:#38bdf8;color:#0f172a;padding:12px;border-radius:8px;font-weight:700;text-decoration:none">Resubscribe</a></div>`
        });
      }
      break;
    }
    case "invoice.payment_failed": {
      const email = event.data.object.customer_email;
      if (email && env.RESEND_API_KEY) {
        await sendEmail(env.RESEND_API_KEY, {
          to: email,
          subject: "Action needed: OrbitOS payment failed",
          html: `<div style="background:#0a1020;font-family:system-ui;padding:32px;color:#cbd5e1;max-width:520px;margin:0 auto"><div style="color:#38bdf8;font-size:20px;font-weight:700;margin-bottom:16px">OrbitOS</div><h1 style="color:#f87171;font-size:20px;margin-bottom:12px">Payment failed</h1><p style="color:rgba(148,163,184,0.6);line-height:1.8;margin-bottom:20px">We could not process your payment. Please update your payment method.</p><a href="${appUrl}/dashboard/billing" style="display:block;text-align:center;background:#f87171;color:#fff;padding:12px;border-radius:8px;font-weight:700;text-decoration:none">Update payment method</a></div>`
        });
      }
      break;
    }
  }
  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" }
  });
}

// ../../tmp/claude-0/-home-claude/5a67f6ef-5151-5147-a873-1db616c6a0ed/scratchpad/wk/functions/api/v1/satellites.js
var satellites_exports2 = {};
__export(satellites_exports2, {
  onRequestGet: () => onRequestGet4,
  onRequestOptions: () => onRequestOptions5
});
var PLAN_LIMITS = { free: 100, pro: 1e4, enterprise: Infinity };
async function validateKey(authHeader, supabaseUrl, supabaseKey) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const rawKey = authHeader.slice(7);
  if (!rawKey.startsWith("orb_")) return null;
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawKey));
  const hex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const res = await fetch(`${supabaseUrl}/rest/v1/api_keys?key_hash=eq.${hex}&is_active=eq.true&limit=1`, {
    headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
  });
  const data = await res.json();
  return data?.[0] || null;
}
async function checkRateLimit(key, supabaseUrl, supabaseKey) {
  const limit = PLAN_LIMITS[key.plan] || 100;
  const hourPast = Date.now() - new Date(key.hour_reset_at) > 36e5;
  if (hourPast) {
    await fetch(`${supabaseUrl}/rest/v1/api_keys?id=eq.${key.id}`, {
      method: "PATCH",
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({ requests_this_hour: 1, hour_reset_at: (/* @__PURE__ */ new Date()).toISOString() })
    });
    return { ok: true, remaining: limit - 1, limit };
  }
  const remaining = limit - (key.requests_this_hour || 0);
  if (remaining <= 0) return { ok: false, remaining: 0, limit };
  await fetch(`${supabaseUrl}/rest/v1/api_keys?id=eq.${key.id}`, {
    method: "PATCH",
    headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
    body: JSON.stringify({ requests_this_hour: (key.requests_this_hour || 0) + 1, requests_total: (key.requests_total || 0) + 1, last_used_at: (/* @__PURE__ */ new Date()).toISOString() })
  });
  return { ok: true, remaining: remaining - 1, limit };
}
async function onRequestGet4({ request, env }) {
  const t0 = Date.now();
  const headers = { "Content-Type": "application/json" };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ error: "Service unavailable" }), { status: 503, headers });
  }
  const key = await validateKey(request.headers.get("Authorization"), env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  if (!key) {
    return new Response(JSON.stringify({ error: "Invalid or missing API key", docs: "https://orbitos-8n5.pages.dev/api" }), { status: 401, headers });
  }
  const { ok, remaining, limit } = await checkRateLimit(key, env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  headers["X-RateLimit-Limit"] = String(limit);
  headers["X-RateLimit-Remaining"] = String(remaining);
  headers["X-RateLimit-Reset"] = String(Math.floor(Date.now() / 1e3) + 3600);
  if (!ok) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Upgrade your plan for more requests." }), { status: 429, headers });
  }
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const maxLimit = key.plan === "enterprise" ? 5e4 : 5e3;
  const count = Math.min(parseInt(url.searchParams.get("limit") || "500"), maxLimit);
  let query = `${env.SUPABASE_URL}/rest/v1/tle_records?is_current=eq.true&select=norad_id,name,tle1,tle2,epoch,satellites!inner(category,country)&limit=${count}&order=ingested_at.desc`;
  if (category) query += `&satellites.category=eq.${category}`;
  const res = await fetch(query, { headers: { "apikey": env.SUPABASE_SERVICE_KEY, "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}` } });
  const data = await res.json();
  fetch(`${env.SUPABASE_URL}/rest/v1/api_usage`, {
    method: "POST",
    headers: { "apikey": env.SUPABASE_SERVICE_KEY, "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
    body: JSON.stringify({ api_key_id: key.id, endpoint: "/v1/satellites", method: "GET", status_code: 200, response_ms: Date.now() - t0, ip_address: request.headers.get("CF-Connecting-IP") })
  });
  headers["Cache-Control"] = "s-maxage=60";
  return new Response(JSON.stringify({
    count: data?.length || 0,
    plan: key.plan,
    satellites: (data || []).map((r) => ({ id: r.norad_id, name: r.name, category: r.satellites?.category, country: r.satellites?.country, tle1: r.tle1, tle2: r.tle2, epoch: r.epoch }))
  }), { headers });
}
async function onRequestOptions5() {
  return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type" }
  });
}

// ../../tmp/claude-0/-home-claude/5a67f6ef-5151-5147-a873-1db616c6a0ed/scratchpad/wk/router.js
var ROUTES = {
  "/api/tle": tle_exports,
  "/api/satellites": satellites_exports,
  "/api/ingest": ingest_exports,
  "/api/contact": contact_exports,
  "/api/send-alert": send_alert_exports,
  "/api/stripe-checkout": stripe_checkout_exports,
  "/api/stripe-webhook": stripe_webhook_exports,
  "/api/v1/satellites": satellites_exports2
};
var METHOD_KEY = { GET: "onRequestGet", POST: "onRequestPost", OPTIONS: "onRequestOptions", PUT: "onRequestPut", DELETE: "onRequestDelete", PATCH: "onRequestPatch", HEAD: "onRequestHead" };
var router_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "");
    if (!path.startsWith("/api/")) return env.ASSETS.fetch(request);
    const mod = ROUTES[path];
    const context = { request, env, params: {}, waitUntil: ctx.waitUntil.bind(ctx), data: {} };
    const handler = mod && (mod[METHOD_KEY[request.method]] || mod.onRequest);
    const next = async () => {
      if (!mod) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!handler) return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
      return handler(context);
    };
    try {
      return await onRequest({ ...context, next });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
};
export {
  router_default as default
};
