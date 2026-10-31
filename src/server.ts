import pg from "pg";
import { createApp } from "./app.ts";
import { PgLinkStore } from "./pg-store.ts";
import { MemoryLinkStore } from "./store.ts";

const port = Number(process.env.PORT ?? 3000);
// Only programs on this machine (like Nginx) can connect
const host = process.env.HOST ?? "127.0.0.1";
// PGHOST, PGDATABASE and PGUSER come from the environment; no password needed
const store = process.env.PGDATABASE
  ? new PgLinkStore(new pg.Pool())
  : new MemoryLinkStore();
const app = createApp(store);

app.listen(port, host, (error) => {
  if (error) {
    console.error(`Could not listen on ${host}:${port}: ${error.message}`);
    process.exit(1);
  }
  const storage = process.env.PGDATABASE ? `PostgreSQL ${process.env.PGDATABASE}` : "memory";
  console.log(`ship-links listening on http://${host}:${port} (${storage})`);
});
