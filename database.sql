-- ═══════════════════════════════════════════════════════════
-- OrbitOS Database Schema
-- Run this in Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- ── SATELLITES ───────────────────────────────────────────────
-- Master catalogue — one row per NORAD ID
CREATE TABLE IF NOT EXISTS satellites (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  norad_id      INTEGER UNIQUE NOT NULL,
  name          TEXT    NOT NULL,
  category      TEXT    DEFAULT 'unknown',
  country       TEXT,
  launch_date   DATE,
  object_type   TEXT,   -- PAYLOAD, ROCKET BODY, DEBRIS, UNKNOWN
  rcs_size      TEXT,   -- SMALL, MEDIUM, LARGE
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_satellites_norad    ON satellites(norad_id);
CREATE INDEX IF NOT EXISTS idx_satellites_category ON satellites(category);
CREATE INDEX IF NOT EXISTS idx_satellites_active   ON satellites(is_active);

-- ── TLE RECORDS ───────────────────────────────────────────────
-- Current TLE for every satellite
CREATE TABLE IF NOT EXISTS tle_records (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  satellite_id  UUID    REFERENCES satellites(id) ON DELETE CASCADE,
  norad_id      INTEGER NOT NULL,
  name          TEXT    NOT NULL,
  tle1          TEXT    NOT NULL,
  tle2          TEXT    NOT NULL,
  epoch         TIMESTAMPTZ,
  epoch_age_days NUMERIC,
  source        TEXT    DEFAULT 'spacetrack', -- spacetrack, celestrak, manual
  is_current    BOOLEAN DEFAULT true,
  ingested_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tle_norad     ON tle_records(norad_id);
CREATE INDEX IF NOT EXISTS idx_tle_current   ON tle_records(is_current);
CREATE INDEX IF NOT EXISTS idx_tle_ingested  ON tle_records(ingested_at DESC);

-- ── TLE HISTORY ───────────────────────────────────────────────
-- Every TLE ever ingested — for historical analysis (Pro/Enterprise)
CREATE TABLE IF NOT EXISTS tle_history (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  norad_id      INTEGER NOT NULL,
  name          TEXT    NOT NULL,
  tle1          TEXT    NOT NULL,
  tle2          TEXT    NOT NULL,
  epoch         TIMESTAMPTZ,
  source        TEXT    DEFAULT 'spacetrack',
  ingested_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tlehist_norad    ON tle_history(norad_id);
CREATE INDEX IF NOT EXISTS idx_tlehist_ingested ON tle_history(ingested_at DESC);

-- ── CONJUNCTIONS ─────────────────────────────────────────────
-- Detected conjunction risk events
CREATE TABLE IF NOT EXISTS conjunctions (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  sat1_norad_id   INTEGER NOT NULL,
  sat2_norad_id   INTEGER NOT NULL,
  sat1_name       TEXT,
  sat2_name       TEXT,
  distance_km     NUMERIC NOT NULL,
  severity        TEXT    NOT NULL, -- WARNING, CRITICAL
  detected_at     TIMESTAMPTZ DEFAULT NOW(),
  tca_estimate    TIMESTAMPTZ, -- time of closest approach
  is_active       BOOLEAN DEFAULT true,
  resolved_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_conj_active      ON conjunctions(is_active);
CREATE INDEX IF NOT EXISTS idx_conj_detected    ON conjunctions(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_conj_sat1        ON conjunctions(sat1_norad_id);
CREATE INDEX IF NOT EXISTS idx_conj_sat2        ON conjunctions(sat2_norad_id);

-- ── API KEYS ──────────────────────────────────────────────────
-- One per paying customer
CREATE TABLE IF NOT EXISTS api_keys (
  id                UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID    REFERENCES auth.users(id) ON DELETE CASCADE,
  key_prefix        TEXT    NOT NULL,  -- first 8 chars shown to user (orb_live_)
  key_hash          TEXT    NOT NULL UNIQUE, -- bcrypt hash of full key
  plan              TEXT    DEFAULT 'free', -- free, pro, enterprise
  requests_per_hour INTEGER DEFAULT 100,
  requests_this_hour INTEGER DEFAULT 0,
  hour_reset_at     TIMESTAMPTZ DEFAULT NOW(),
  requests_total    BIGINT  DEFAULT 0,
  is_active         BOOLEAN DEFAULT true,
  last_used_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  name              TEXT    DEFAULT 'Default key'
);

CREATE INDEX IF NOT EXISTS idx_apikeys_user   ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_apikeys_hash   ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_apikeys_active ON api_keys(is_active);

-- ── API USAGE ─────────────────────────────────────────────────
-- Every API call logged — for billing and analytics
CREATE TABLE IF NOT EXISTS api_usage (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id    UUID    REFERENCES api_keys(id) ON DELETE SET NULL,
  endpoint      TEXT    NOT NULL,
  method        TEXT    DEFAULT 'GET',
  response_ms   INTEGER,
  status_code   INTEGER,
  ip_address    TEXT,
  user_agent    TEXT,
  timestamp     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_key       ON api_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON api_usage(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_endpoint  ON api_usage(endpoint);

-- ── INGEST LOGS ───────────────────────────────────────────────
-- Pipeline health — every ingestion run recorded
CREATE TABLE IF NOT EXISTS ingest_logs (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  source          TEXT    NOT NULL, -- spacetrack, celestrak
  status          TEXT    NOT NULL, -- success, partial, failed
  satellites_fetched  INTEGER DEFAULT 0,
  satellites_new      INTEGER DEFAULT 0,
  satellites_updated  INTEGER DEFAULT 0,
  errors          JSONB   DEFAULT '[]',
  duration_ms     INTEGER,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ingest_started ON ingest_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingest_status  ON ingest_logs(status);

-- ── WATCHLISTS ────────────────────────────────────────────────
-- User satellite watchlists
CREATE TABLE IF NOT EXISTS watchlist (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  satellite_id    INTEGER NOT NULL,
  satellite_name  TEXT    NOT NULL,
  category        TEXT,
  altitude_km     NUMERIC,
  threshold_km    NUMERIC DEFAULT 5,
  alert_email     BOOLEAN DEFAULT true,
  alert_push      BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, satellite_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE satellites    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tle_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tle_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE conjunctions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys      ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist     ENABLE ROW LEVEL SECURITY;

-- Public read access for satellite data (it's public info)
CREATE POLICY "Public read satellites"
  ON satellites FOR SELECT USING (true);

CREATE POLICY "Public read tle_records"
  ON tle_records FOR SELECT USING (is_current = true);

CREATE POLICY "Public read conjunctions"
  ON conjunctions FOR SELECT USING (is_active = true);

-- Users manage their own data
CREATE POLICY "Users manage own api_keys"
  ON api_keys FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own api_usage"
  ON api_usage FOR SELECT
  USING (api_key_id IN (SELECT id FROM api_keys WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own watchlist"
  ON watchlist FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can write everything (for ingestion pipeline)
CREATE POLICY "Service role full access satellites"
  ON satellites FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access tle_records"
  ON tle_records FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access tle_history"
  ON tle_history FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access conjunctions"
  ON conjunctions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access ingest_logs"
  ON ingest_logs FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access api_usage"
  ON api_usage FOR ALL USING (auth.role() = 'service_role');

-- ── REALTIME ──────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE conjunctions;
ALTER PUBLICATION supabase_realtime ADD TABLE watchlist;
ALTER PUBLICATION supabase_realtime ADD TABLE tle_records;

-- ── HELPER FUNCTIONS ──────────────────────────────────────────
-- Get current satellite count
CREATE OR REPLACE FUNCTION get_satellite_stats()
RETURNS JSON AS $$
  SELECT json_build_object(
    'total',     COUNT(*),
    'active',    COUNT(*) FILTER (WHERE is_active = true),
    'debris',    COUNT(*) FILTER (WHERE category = 'debris'),
    'stations',  COUNT(*) FILTER (WHERE category = 'stations'),
    'starlink',  COUNT(*) FILTER (WHERE category = 'starlink')
  ) FROM satellites;
$$ LANGUAGE SQL;
