"""
OrbitOS conjunction screening.

Runs in GitHub Actions every 6 hours (see screen.yml). It:
  1. loads every current element set from Supabase (tle_records, is_current = true)
  2. propagates all objects with SGP4 across the next HORIZON_HOURS, every STEP_S seconds
  3. at each step, finds pairs that are close using a k-d tree, then estimates the true
     closest approach between samples from the relative position and velocity
  4. writes every approach under THRESHOLD_KM to the `conjunctions` table and retires
     the previous run's results

Distances come from public TLEs/SGP4, which are typically good to ~1 km in LEO, so these
are screening results (who to look at), not precise collision probabilities.
"""

import json
import re
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

import numpy as np
from scipy.spatial import cKDTree
from sgp4.api import Satrec, SatrecArray, jday

def _clean_url(u):
    # Tolerate common paste mistakes: spaces/quotes, a missing https://, or a trailing /rest/v1
    u = u.strip().strip('"').strip("'").strip().rstrip("/")
    if u.endswith("/rest/v1"):
        u = u[: -len("/rest/v1")]
    # A dashboard link (supabase.com/dashboard/project/<ref>) instead of the API URL
    m = re.search(r"supabase\.com/dashboard/project/([a-z0-9]+)", u)
    if m:
        u = f"https://{m.group(1)}.supabase.co"
    if u and not u.startswith(("http://", "https://")):
        u = "https://" + u
    return u


SUPABASE_URL = _clean_url(os.environ.get("SUPABASE_URL", ""))
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip().strip('"').strip("'").strip()

HORIZON_HOURS = float(os.environ.get("HORIZON_HOURS", "24"))
STEP_S = float(os.environ.get("STEP_S", "10"))
THRESHOLD_KM = float(os.environ.get("THRESHOLD_KM", "5"))
CRITICAL_KM = float(os.environ.get("CRITICAL_KM", "1"))
MIN_REL_SPEED = float(os.environ.get("MIN_REL_SPEED_KMS", "0.05"))  # below this = formation flying / docked
MAX_EPOCH_AGE_DAYS = float(os.environ.get("MAX_EPOCH_AGE_DAYS", "30"))
MAX_RESULTS = int(os.environ.get("MAX_RESULTS", "1000"))
CHUNK = int(os.environ.get("CHUNK_STEPS", "180"))

V_REL_MAX = 15.8  # km/s, upper bound on LEO closing speed
SEARCH_R = THRESHOLD_KM + V_REL_MAX * STEP_S / 2  # anything that could get within THRESHOLD between samples


# ── Supabase REST helpers ─────────────────────────────────────────────────────

def sb(path, method="GET", body=None, prefer=None):
    headers = {"apikey": SUPABASE_KEY, "Content-Type": "application/json"}
    if SUPABASE_KEY.startswith("eyJ"):  # legacy JWT keys also go in Authorization; new sb_ keys only in apikey
        headers["Authorization"] = f"Bearer {SUPABASE_KEY}"
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", data=data, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as res:
        raw = res.read()
        if not raw or method != "GET":
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            host = urllib.parse.urlparse(SUPABASE_URL).hostname or "?"
            sys.exit(
                "Supabase didn't return JSON, so SUPABASE_URL is probably not your project's API URL.\n"
                f"  It points at a host ending in: ...{host[-12:]}\n"
                "  It should look like https://<project-ref>.supabase.co (Supabase > Project Settings > API > Project URL).\n"
                f"  Response started with: {raw[:80]!r}"
            )


def load_catalogue():
    rows, page = [], 1000
    for offset in range(0, 100_000, page):
        batch = sb(f"tle_records?is_current=eq.true&select=norad_id,name,tle1,tle2&order=norad_id.asc&limit={page}&offset={offset}")
        rows += batch
        if len(batch) < page:
            break
    return rows


# ── Screening ────────────────────────────────────────────────────────────────

def build_satrecs(rows, now):
    sats, meta, seen = [], [], set()
    for r in rows:
        if r["norad_id"] in seen:
            continue
        try:
            s = Satrec.twoline2rv(r["tle1"], r["tle2"])
        except Exception:
            continue
        epoch = datetime(2000 + s.epochyr if s.epochyr < 57 else 1900 + s.epochyr, 1, 1, tzinfo=timezone.utc) + timedelta(days=s.epochdays - 1)
        if (now - epoch).days > MAX_EPOCH_AGE_DAYS:
            continue  # stale element set: probably decayed or lost
        seen.add(r["norad_id"])
        sats.append(s)
        meta.append((r["norad_id"], r["name"].strip()))
    return sats, meta


def screen(sats, meta, start):
    n_steps = int(HORIZON_HOURS * 3600 / STEP_S) + 1
    arr = SatrecArray(sats)
    best = {}  # (i, j, tca bucket) -> (dist, tca_seconds, rel_speed)

    for c0 in range(0, n_steps, CHUNK):
        ks = np.arange(c0, min(c0 + CHUNK, n_steps))
        jd, fr = np.empty(len(ks)), np.empty(len(ks))
        for idx, k in enumerate(ks):
            t = start + timedelta(seconds=float(k * STEP_S))
            jd[idx], fr[idx] = jday(t.year, t.month, t.day, t.hour, t.minute, t.second + t.microsecond / 1e6)
        err, r, v = arr.sgp4(jd, fr)  # shapes: (n_sat, n_t), (n_sat, n_t, 3), (n_sat, n_t, 3)

        for idx, k in enumerate(ks):
            ok = err[:, idx] == 0
            pos = r[:, idx, :]
            good = np.nonzero(ok & np.isfinite(pos).all(axis=1))[0]
            if len(good) < 2:
                continue
            pairs = cKDTree(pos[good]).query_pairs(SEARCH_R, output_type="ndarray")
            if not len(pairs):
                continue
            i, j = good[pairs[:, 0]], good[pairs[:, 1]]
            dr = r[j, idx, :] - r[i, idx, :]
            dv = v[j, idx, :] - v[i, idx, :]
            vv = np.einsum("ij,ij->i", dv, dv)
            speed = np.sqrt(vv)
            # Straight-line relative motion is accurate over a few seconds: time of closest approach
            tau = np.where(vv > 0, -np.einsum("ij,ij->i", dr, dv) / np.where(vv > 0, vv, 1), 0.0)
            tau = np.clip(tau, -STEP_S / 2, STEP_S / 2)
            miss = np.linalg.norm(dr + dv * tau[:, None], axis=1)
            hit = (miss < THRESHOLD_KM) & (speed >= MIN_REL_SPEED)
            for a, b, d, t_off, s in zip(i[hit], j[hit], miss[hit], tau[hit], speed[hit]):
                tca = k * STEP_S + t_off
                key = (int(a), int(b), int(tca // 120))  # one encounter per pair per ~2 minutes
                if key not in best or d < best[key][0]:
                    best[key] = (float(d), float(tca), float(s))

    # Merge neighbouring buckets of the same encounter, keep the closest
    merged = {}
    for (a, b, _), (d, tca, s) in sorted(best.items(), key=lambda kv: kv[1][1]):
        prev = merged.get((a, b))
        if prev and abs(prev[-1][1] - tca) < 300:
            if d < prev[-1][0]:
                prev[-1] = (d, tca, s)
        else:
            merged.setdefault((a, b), []).append((d, tca, s))

    out = []
    for (a, b), events in merged.items():
        for d, tca, s in events:
            out.append({
                "sat1_norad_id": meta[a][0], "sat1_name": meta[a][1],
                "sat2_norad_id": meta[b][0], "sat2_name": meta[b][1],
                "distance_km": round(d, 3),
                "relative_speed_kms": round(s, 3),
                "tca": start + timedelta(seconds=tca),
            })
    out.sort(key=lambda c: c["distance_km"])
    return out[:MAX_RESULTS]


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        sys.exit("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    if SUPABASE_KEY.startswith("sb_publishable_"):
        sys.exit("SUPABASE_SERVICE_KEY is the publishable key. Use the secret key instead "
                 "(Supabase > Settings > API Keys > Secret keys, starts with sb_secret_).")
    t0 = time.time()
    start = datetime.now(timezone.utc).replace(microsecond=0)

    rows = load_catalogue()
    sats, meta = build_satrecs(rows, start)
    print(f"Loaded {len(rows)} element sets, screening {len(sats)} objects "
          f"over {HORIZON_HOURS:g} h at {STEP_S:g} s steps (search radius {SEARCH_R:.0f} km)")

    found = screen(sats, meta, start)
    print(f"Found {len(found)} approaches under {THRESHOLD_KM:g} km in {time.time() - t0:.0f} s")

    run_at = start.isoformat()
    records = [{
        "sat1_norad_id": c["sat1_norad_id"], "sat1_name": c["sat1_name"],
        "sat2_norad_id": c["sat2_norad_id"], "sat2_name": c["sat2_name"],
        "distance_km": c["distance_km"],
        "severity": "CRITICAL" if c["distance_km"] < CRITICAL_KM else "WARNING",
        "tca_estimate": c["tca"].isoformat(),
        "detected_at": run_at,
        "is_active": True,
    } for c in found]

    for i in range(0, len(records), 500):
        sb("conjunctions", "POST", records[i:i + 500], prefer="return=minimal")
    # Retire the previous run only after the new results are in
    sb(f"conjunctions?is_active=eq.true&detected_at=lt.{urllib.parse.quote(run_at)}", "PATCH",
       {"is_active": False, "resolved_at": datetime.now(timezone.utc).isoformat()}, prefer="return=minimal")

    for c in found[:10]:
        print(f"  {c['distance_km']:7.3f} km  {c['tca']:%Y-%m-%d %H:%M} UTC  {c['sat1_name']} × {c['sat2_name']}  ({c['relative_speed_kms']:.2f} km/s)")
    print(f"Done in {time.time() - t0:.0f} s")


if __name__ == "__main__":
    main()
