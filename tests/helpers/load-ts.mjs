// Loads TypeScript source (with the project's "@/" alias) for node:test, without adding a test-runner dependency.
// Uses jiti, which is already installed in the lockfile (Tailwind CSS 4 depends on it).
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const jiti = createJiti(import.meta.url, { alias: { "@": root }, moduleCache: false, fsCache: false });

/** Fresh import each call (module-level state such as in-memory limiters starts empty). */
export function loadTs(relativePath) {
  return jiti.import(path.join(root, relativePath));
}

/** Minimal loopback HTTP receiver that records JSON bodies and replies with a scripted response. */
export async function loopback(handler) {
  const { createServer } = await import("node:http");
  const requests = [];
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const part of req) body += part;
    let json = null;
    try { json = JSON.parse(body); } catch { json = body; }
    const entry = { url: req.url, headers: req.headers, body: json };
    requests.push(entry);
    const { status = 200, reply = {} } = (await handler(entry)) ?? {};
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(reply));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, requests, close: () => new Promise((r) => server.close(r)) };
}
