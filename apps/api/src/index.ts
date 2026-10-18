import { handleToolCall } from "./gateway/handle";
import { auditStore } from "./audit/memory-store";

const PORT = Number(Bun.env.PORT ?? 3001);

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return Response.json(body, {
    ...init,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization,x-api-key",
      ...init.headers,
    },
  });
}

async function readJson(req: Request): Promise<unknown> {
  const contentType = req.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error("Content-Type must be application/json");
  }

  return await req.json();
}

Bun.serve({
  port: PORT,
  maxRequestBodySize: 128 * 1024,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return jsonResponse({}, { status: 204 });
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return jsonResponse({ ok: true, service: "agsec-api" });
    }

    if (req.method === "GET" && url.pathname === "/admin/events") {
      const requestedLimit = Number(url.searchParams.get("limit") ?? 100);

      if (
        !Number.isInteger(requestedLimit) ||
        requestedLimit < 1 ||
        requestedLimit > 1_000
      ) {
        return jsonResponse(
          { error: "limit must be an integer between 1 and 1000" },
          { status: 400 },
        );
      }

      return jsonResponse({ events: await auditStore.listRecent(requestedLimit) });
    }

    if (req.method === "GET" && url.pathname === "/admin/stats") {
      return jsonResponse(await auditStore.getStats());
    }

    if (req.method === "POST" && url.pathname === "/v1/tool-calls") {
      try {
        const body = await readJson(req);
        const result = await handleToolCall(body);
        const status = result.verdict.decision === "ALLOW" ? 200 : 403;
        return jsonResponse(result, { status });
      } catch (error) {
        return jsonResponse(
          {
            verdict: {
              decision: "BLOCK",
              severity: "high",
              matchedRules: ["SYS-FAIL-CLOSED"],
              reason: error instanceof Error ? error.message : "Request failed closed",
            },
            executed: false,
          },
          { status: 400 },
        );
      }
    }

    return jsonResponse({ error: "Not found" }, { status: 404 });
  },
});

console.log(`AgSec API listening on http://localhost:${PORT}`);
