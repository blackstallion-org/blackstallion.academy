// A small stand-in for the parts of the Supabase Storage REST API that scripts/upload-media.mjs and the site use, so the upload
// tool can be tested end to end without a real project and without any real key. It runs on this computer only.
// It copies the documented behaviour: the `apikey` header carries the key, a non-JWT key in `Authorization: Bearer` is refused,
// a secret key with a browser-like User-Agent is refused, buckets can be public, duplicate uploads answer 409 unless x-upsert is true,
// public objects answer with CORS and partial-content (Range) headers.
import { createHash, randomUUID } from "node:crypto";
import http from "node:http";

const KEY_RULE = /^(\w|\/|!|-|\.|\*|'|\(|\)| |&|\$|@|=|;|:|\+|,|\?)+$/;

/**
 * options: key, legacyErrors (answer HTTP 400 with the real status in the body, as older Storage versions did),
 * omitCors, ignoreRange, globalLimit (bytes).
 */
export async function startFakeStorage(options = {}) {
  const key = options.key ?? ["sb", "secret", "FAKEKEYFORTESTS0123456789abcdef"].join("_"); // joined at run time so secret scanners do not mistake the fixture for a real key
  const globalLimit = options.globalLimit ?? 50 * 1024 * 1024;
  const buckets = new Map();
  const objects = new Map(); // "bucket/path" -> { body, type, cache, etag }
  const requests = [];
  const faults = [];

  const json = (res, status, body, headers = {}) => {
    res.writeHead(status, { "content-type": "application/json", ...headers });
    res.end(JSON.stringify(body));
  };
  const problem = (res, status, error, message) => json(res, options.legacyErrors && status !== 401 ? 400 : status, { statusCode: String(status), error, message });

  const authorised = (req) => {
    if (/mozilla|chrome|safari|applewebkit/i.test(req.headers["user-agent"] ?? "")) return false; // secret keys are refused from browsers
    if (req.headers.apikey !== key) return false;
    const bearer = req.headers.authorization;
    if (bearer && bearer !== `Bearer ${key}`) return false;
    if (bearer && !key.startsWith("eyJ")) return false; // a non-JWT key is never valid as a bearer token
    return true;
  };

  const readBody = (req) => new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

  const servePublic = (req, res, bucketId, objectPath) => {
    const bucket = buckets.get(bucketId);
    const entry = bucket && bucket.public ? objects.get(`${bucketId}/${objectPath}`) : null;
    if (!entry) return problem(res, 404, "not_found", "Object not found");
    const headers = {
      "content-type": entry.type,
      "cache-control": entry.cache,
      "accept-ranges": "bytes",
      etag: `"${entry.etag}"`,
      ...(options.omitCors ? {} : { "access-control-allow-origin": "*", "access-control-expose-headers": "content-length, content-range, content-type" }),
    };
    const size = entry.body.length;
    const range = options.ignoreRange ? null : /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    if (range && (range[1] !== "" || range[2] !== "")) {
      const start = range[1] === "" ? Math.max(0, size - Number(range[2])) : Number(range[1]);
      const end = range[1] === "" || range[2] === "" ? size - 1 : Math.min(Number(range[2]), size - 1);
      if (start > end || start >= size) {
        res.writeHead(416, { ...headers, "content-range": `bytes */${size}` });
        return res.end();
      }
      res.writeHead(206, { ...headers, "content-range": `bytes ${start}-${end}/${size}`, "content-length": end - start + 1 });
      return req.method === "HEAD" ? res.end() : res.end(entry.body.subarray(start, end + 1));
    }
    res.writeHead(200, { ...headers, "content-length": size });
    return req.method === "HEAD" ? res.end() : res.end(entry.body);
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://fake");
    requests.push({ method: req.method, path: url.pathname, headers: req.headers });
    try {
      const fault = faults.find((f) => f.times > 0 && (!f.method || f.method === req.method) && (!f.pathIncludes || url.pathname.includes(f.pathIncludes)));
      if (fault) {
        fault.times--;
        req.resume();
        return json(res, fault.status, fault.body ?? { message: "injected failure" });
      }
      const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
      if (parts[0] !== "storage" || parts[1] !== "v1") return problem(res, 404, "not_found", "no such route");
      const [kind, ...rest] = parts.slice(2);

      if (kind === "object" && rest[0] === "public" && (req.method === "GET" || req.method === "HEAD")) {
        return servePublic(req, res, rest[1], rest.slice(2).join("/"));
      }
      if (!authorised(req)) {
        req.resume();
        return json(res, 401, { message: "Invalid API key", hint: "Double check your Supabase `anon` or `service_role` API key." });
      }

      if (kind === "bucket") {
        if (req.method === "GET" && rest.length === 1) {
          const bucket = buckets.get(rest[0]);
          return bucket ? json(res, 200, bucket) : problem(res, 404, "Bucket not found", "Bucket not found");
        }
        if (req.method === "POST" && rest.length === 0) {
          const body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
          if (buckets.has(body.id)) return problem(res, 409, "Duplicate", "The resource already exists");
          if (body.file_size_limit && body.file_size_limit > globalLimit) return problem(res, 413, "Payload too large", "The maximum allowed file size is 50MB");
          buckets.set(body.id, { id: body.id, name: body.name, public: !!body.public, file_size_limit: body.file_size_limit ?? null, allowed_mime_types: body.allowed_mime_types ?? null });
          return json(res, 200, { name: body.name });
        }
      }

      if (kind === "object" && rest.length >= 2) {
        const [bucketId, ...pathParts] = rest;
        const objectPath = pathParts.join("/");
        const bucket = buckets.get(bucketId);
        if (!bucket) {
          req.resume();
          return problem(res, 404, "Bucket not found", "Bucket not found");
        }
        const stored = objects.get(`${bucketId}/${objectPath}`);
        if (req.method === "HEAD") {
          if (!stored) { res.writeHead(options.legacyErrors ? 400 : 404); return res.end(); }
          res.writeHead(200, { "content-type": stored.type, "content-length": stored.body.length, "cache-control": stored.cache });
          return res.end();
        }
        if (req.method === "POST") {
          const body = await readBody(req);
          const type = String(req.headers["content-type"] ?? "").split(";")[0];
          if (!KEY_RULE.test(objectPath)) return problem(res, 400, "InvalidKey", `Invalid key: ${objectPath}`);
          if (bucket.allowed_mime_types && !bucket.allowed_mime_types.includes(type)) return problem(res, 415, "invalid_mime_type", `mime type ${type} is not supported`);
          if (bucket.file_size_limit && body.length > bucket.file_size_limit) return problem(res, 413, "Payload too large", "The object exceeded the maximum allowed size");
          if (stored && req.headers["x-upsert"] !== "true") return problem(res, 409, "Duplicate", "The resource already exists");
          objects.set(`${bucketId}/${objectPath}`, {
            body, type, cache: req.headers["cache-control"] ?? "no-cache", etag: createHash("md5").update(body).digest("hex"),
          });
          return json(res, 200, { Id: randomUUID(), Key: `${bucketId}/${objectPath}` });
        }
      }
      req.resume();
      return problem(res, 404, "not_found", `no route for ${req.method} ${url.pathname}`);
    } catch (error) {
      return json(res, 500, { message: String(error?.message || error) });
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const origin = `http://127.0.0.1:${port}`;
  return {
    url: origin,
    key,
    buckets,
    objects,
    requests,
    faults,
    /** Answer the next `times` matching requests with `status` before the normal handling. */
    fail(status, { times = 1, method, pathIncludes, body } = {}) { faults.push({ status, times, method, pathIncludes, body }); },
    /** Put an object in directly (a bucket is created public if needed). */
    put(bucketId, objectPath, body, type = "application/octet-stream") {
      if (!buckets.has(bucketId)) buckets.set(bucketId, { id: bucketId, name: bucketId, public: true, file_size_limit: null, allowed_mime_types: null });
      objects.set(`${bucketId}/${objectPath}`, { body, type, cache: "max-age=3600", etag: createHash("md5").update(body).digest("hex") });
    },
    count(method, pathPart = "") { return requests.filter((r) => r.method === method && r.path.includes(pathPart)).length; },
    close() { return new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve); }); },
  };
}
