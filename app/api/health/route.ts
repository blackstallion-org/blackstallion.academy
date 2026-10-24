import { connection } from "next/server";
import { checkHealth } from "@/lib/monitoring/health";

/**
 * Uptime probe. `/api/health` answers 200 while the server function runs; `/api/health?deep=1` also checks the
 * database (503 when it does not answer). Logic and limits: lib/monitoring/health.ts.
 */
export async function GET(request: Request) {
  await connection(); // the answer is about now: never prerender it
  const deep = new URL(request.url).searchParams.get("deep") === "1";
  const body = await checkHealth({ deep });
  return Response.json(body, { status: body.ok ? 200 : 503, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
}
