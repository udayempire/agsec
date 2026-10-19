import { Router } from "express";
import { auditStore } from "../audit/postgres-store";

export const auditLogsRouter = Router();

auditLogsRouter.get("/admin/events", async (req, res) => {
  const requestedLimit = Number(req.query.limit ?? 100);

  if (
    !Number.isInteger(requestedLimit) ||
    requestedLimit < 1 ||
    requestedLimit > 1_000
  ) {
    res
      .status(400)
      .json({ error: "limit must be an integer between 1 and 1000" });
    return;
  }

  res.json({ events: await auditStore.listRecent(requestedLimit) });
});

auditLogsRouter.get("/admin/stats", async (_req, res) => {
  res.json(await auditStore.getStats());
});

auditLogsRouter.get("/admin/stream", (req, res) => {
  let unsubscribe = () => {};
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    unsubscribe();
    clearInterval(heartbeat);
  };

  const send = (event: string, data: unknown) => {
    if (closed || res.destroyed) return;

    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      close();
    }
  };

  res.status(200).set({
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "content-type": "text/event-stream",
  });
  res.flushHeaders();

  const heartbeat = setInterval(() => {
    if (closed || res.destroyed) return;
    try {
      res.write(": heartbeat\n\n");
    } catch {
      close();
    }
  }, 15_000);

  unsubscribe = auditStore.subscribe((event) => send("audit", event));
  send("ready", { service: "agsec-api" });
  res.on("close", close);
});
