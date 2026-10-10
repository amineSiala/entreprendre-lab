CREATE TABLE game_rooms (
  code TEXT PRIMARY KEY,
  host_hash TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX game_rooms_host_created ON game_rooms (host_hash, created_at);
