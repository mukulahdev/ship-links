import { randomBytes } from "node:crypto";
import type { Pool } from "pg";
import { CodeTakenError } from "./store.ts";
import type { Link, LinkStore } from "./store.ts";

type Row = { code: string; url: string; clicks: number; created_at: Date };

const toLink = (row: Row): Link => ({
  code: row.code,
  url: row.url,
  clicks: row.clicks,
  createdAt: row.created_at.toISOString(),
});

export class PgLinkStore implements LinkStore {
  #pool: Pool;

  constructor(pool: Pool) {
    this.#pool = pool;
  }

  async create(url: string, code?: string): Promise<Link> {
    for (;;) {
      const finalCode = code ?? randomBytes(6).toString("base64url");
      const { rows } = await this.#pool.query<Row>(
        `INSERT INTO links (code, url) VALUES ($1, $2)
         ON CONFLICT (code) DO NOTHING
         RETURNING code, url, clicks, created_at`,
        [finalCode, url],
      );
      if (rows[0]) return toLink(rows[0]);
      if (code) throw new CodeTakenError(code);
      // A random code collided with an existing one: try another
    }
  }

  async get(code: string): Promise<Link | undefined> {
    const { rows } = await this.#pool.query<Row>(
      "SELECT code, url, clicks, created_at FROM links WHERE code = $1",
      [code],
    );
    return rows[0] ? toLink(rows[0]) : undefined;
  }

  async recordClick(code: string): Promise<Link | undefined> {
    const { rows } = await this.#pool.query<Row>(
      `UPDATE links SET clicks = clicks + 1 WHERE code = $1
       RETURNING code, url, clicks, created_at`,
      [code],
    );
    return rows[0] ? toLink(rows[0]) : undefined;
  }
}
