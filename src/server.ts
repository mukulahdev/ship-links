import { createApp } from "./app.ts";
import { MemoryLinkStore } from "./store.ts";

const port = Number(process.env.PORT ?? 3000);
// Only programs on this machine (like Nginx) can connect
const host = process.env.HOST ?? "127.0.0.1";
const app = createApp(new MemoryLinkStore());

app.listen(port, host, (error) => {
  if (error) {
    console.error(`Could not listen on ${host}:${port}: ${error.message}`);
    process.exit(1);
  }
  console.log(`ship-links listening on http://${host}:${port}`);
});
