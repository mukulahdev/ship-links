import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.ts";
import { MemoryLinkStore } from "../src/store.ts";

let server: Server;
let baseUrl = "";

before(async () => {
  server = createApp(new MemoryLinkStore()).listen(0);
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://localhost:${port}`;
});

after(() => {
  server.close();
});

function createLink(body: unknown) {
  return fetch(`${baseUrl}/links`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("creates a link and redirects to it", async () => {
  const res = await createLink({ url: "https://example.com/a" });
  assert.equal(res.status, 201);
  const { code } = (await res.json()) as { code: string };

  const visit = await fetch(`${baseUrl}/${code}`, {
    redirect: "manual",
  });
  assert.equal(visit.status, 302);
  assert.equal(visit.headers.get("location"), "https://example.com/a");
});

test("rejects a taken custom code with 409", async () => {
  const body = { url: "https://example.com", code: "taken" };
  const first = await createLink(body);
  assert.equal(first.status, 201);
  const second = await createLink(body);
  assert.equal(second.status, 409);
});

test("rejects a URL that is not http or https", async () => {
  const res = await createLink({ url: "ftp://example.com/file" });
  assert.equal(res.status, 400);
  const body = (await res.json()) as { issues: { path: string }[] };
  assert.equal(body.issues[0].path, "url");
});

test("counts clicks in the stats", async () => {
  await createLink({ url: "https://example.com/b", code: "stats-demo" });
  await fetch(`${baseUrl}/stats-demo`, { redirect: "manual" });
  await fetch(`${baseUrl}/stats-demo`, { redirect: "manual" });

  const res = await fetch(`${baseUrl}/links/stats-demo/stats`);
  const stats = (await res.json()) as { clicks: number };
  assert.equal(stats.clicks, 2);
});

test("returns 404 for unknown codes", async () => {
  const res = await fetch(`${baseUrl}/no-such-code`);
  assert.equal(res.status, 404);
});
