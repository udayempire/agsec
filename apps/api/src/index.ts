import express from "express";
import { indexRouter } from "./routes/index.routes";

const PORT = process.env.PORT;
const app = express();

app.use((req, res, next) => {
  res.set({
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-api-key",
  });

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json({ limit: 128 * 1024 }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "agsec-api" });
});

app.use(indexRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const status =
      typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof error.status === "number"
        ? error.status
        : 500;

    res.status(status).json({
      error:
        status === 400 ? "Invalid JSON request body" : "Internal server error",
    });
  },
);

app.listen(PORT, () => {
  console.log(`AgSec API listening on http://localhost:${PORT}`);
});
