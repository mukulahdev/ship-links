import express from "express";
import type { ErrorRequestHandler } from "express";
import { z } from "zod";
import { CodeTakenError } from "./store.ts";
import type { LinkStore } from "./store.ts";

const reserved = new Set(["health", "links"]);

const createLinkSchema = z.object({
  url: z.url({
    protocol: /^https?$/,
    error: "url must be an http or https URL",
  }),
  code: z
    .string()
    .regex(/^[A-Za-z0-9-]{3,32}$/, "use 3-32 letters, digits or dashes")
    .refine((code) => !reserved.has(code), "this code is reserved")
    .optional(),
});

const handleErrors: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof CodeTakenError) {
    res.status(409).json({ error: "code_taken", message: err.message });
    return;
  }
  if (err instanceof SyntaxError) {
    res.status(400).json({ error: "invalid_json" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "internal_error" });
};

export function createApp(store: LinkStore) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/links", async (req, res) => {
    const parsed = createLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      res.status(400).json({ error: "invalid_input", issues });
      return;
    }
    const { url, code } = parsed.data;
    const link = await store.create(url, code);
    const shortUrl = `${req.protocol}://${req.get("host")}/${link.code}`;
    res.status(201).json({ code: link.code, shortUrl });
  });

  app.get("/links/:code/stats", async (req, res) => {
    const link = await store.get(req.params.code);
    if (!link) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({
      url: link.url,
      clicks: link.clicks,
      createdAt: link.createdAt,
    });
  });

  app.get("/:code", async (req, res) => {
    const link = await store.recordClick(req.params.code);
    if (!link) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.redirect(302, link.url);
  });

  app.use(handleErrors);
  return app;
}
