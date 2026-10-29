import { createApp } from "./app.ts";
import { MemoryLinkStore } from "./store.ts";

const port = Number(process.env.PORT ?? 3000);
const app = createApp(new MemoryLinkStore());

app.listen(port, (error) => {
  if (error) {
    console.error(`Could not listen on port ${port}: ${error.message}`);
    process.exit(1);
  }
  console.log(`ship-links listening on http://localhost:${port}`);
});
