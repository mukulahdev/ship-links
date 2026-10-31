-- Run once as the postgres superuser:
--   sudo -u postgres psql -d ship_links -f db/schema.sql
CREATE TABLE links (
  code       text        PRIMARY KEY,
  url        text        NOT NULL,
  clicks     integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The app may read, add and count links. It can't drop or alter the table.
GRANT SELECT, INSERT, UPDATE ON links TO "ship-links";
