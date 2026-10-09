// Local static-export server. Production uses nginx with the same API boundary.
import { createServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { pathToFileURL } from "node:url";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
const apiBodyLimit = 2 * 1024 * 1024;

function apiCacheControl(value) {
  const upstreamControl = (
    Array.isArray(value) ? value.join(", ") : (value ?? "")
  ).trim();
  // Quoted extension values may contain commas and directive-like text.
  const directives = upstreamControl
    .replace(/"(?:\\.|[^"\\])*"?/g, '""')
    .split(",");
  return directives.some(
    (directive) => directive.trim().toLowerCase() === "no-store",
  )
    ? upstreamControl
    : [upstreamControl, "no-store"].filter(Boolean).join(", ");
}

async function readApiBody(request, response) {
  function rejectBody() {
    response
      .writeHead(413, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      })
      .end("Request body is too large");
    request.resume();
  }
  if (Number(request.headers["content-length"]) > apiBodyLimit) {
    rejectBody();
    return null;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > apiBodyLimit) {
      rejectBody();
      return null;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

export function createFrontendServer({
  upstream = process.env.BACKEND_BASE_URL || "http://backend:8081",
  directory = "out",
} = {}) {
  const root = resolve(directory);
  const target = new URL(upstream);
  if (
    !["http:", "https:"].includes(target.protocol) ||
    target.username ||
    target.password ||
    target.pathname !== "/" ||
    target.search ||
    target.hash
  )
    throw new Error("BACKEND_BASE_URL must be an HTTP(S) origin");
  return createServer(async (request, response) => {
    const requestUrl = new URL(request.url, "http://frontend");
    const pathname = requestUrl.pathname;
    if (pathname === "/healthz") {
      response
        .writeHead(200, { "Content-Type": "application/json" })
        .end('{"status":"ok"}');
      return;
    }
    if (pathname.startsWith("/api/v1/")) {
      let body;
      try {
        // Validate the complete body before forwarding a potentially mutating request.
        body = await readApiBody(request, response);
      } catch {
        if (!response.destroyed) response.writeHead(400).end();
        return;
      }
      if (body === null) return;
      const proxy = (target.protocol === "https:" ? httpsRequest : httpRequest)(
        new URL(`${pathname}${requestUrl.search}`, target),
        {
          method: request.method,
          headers: {
            ...request.headers,
            host: request.headers.host,
            "x-forwarded-for": request.socket.remoteAddress,
          },
        },
        (incoming) => {
          response.writeHead(incoming.statusCode, {
            ...incoming.headers,
            "cache-control": apiCacheControl(incoming.headers["cache-control"]),
          });
          incoming.pipe(response);
        },
      );
      proxy.setTimeout(30_000, () =>
        proxy.destroy(new Error("Upstream timeout")),
      );
      proxy.on("error", () => {
        if (!response.headersSent)
          response.writeHead(502, { "Content-Type": "application/json" });
        response.end();
      });
      response.on("close", () => proxy.destroy());
      proxy.end(body);
      return;
    }
    if (pathname.startsWith("/api/")) {
      response.writeHead(404).end();
      return;
    }
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405).end();
      return;
    }
    let decoded;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      response.writeHead(400).end();
      return;
    }
    const path = resolve(root, `.${decoded}`);
    if (path !== root && !path.startsWith(`${root}/`)) {
      response.writeHead(404).end();
      return;
    }
    if (pathname !== "/" && pathname.endsWith("/")) {
      try {
        if ((await stat(`${path}.html`)).isFile()) {
          response
            .writeHead(308, {
              Location: `${pathname.replace(/^\/+/, "/").slice(0, -1)}${requestUrl.search}`,
              "Cache-Control": "no-cache",
            })
            .end();
          return;
        }
      } catch {
        /* A missing page may still have an exported directory index. */
      }
    }
    const candidates = (
      path === root
        ? [resolve(root, "index.html")]
        : [`${path}.html`, path, resolve(path, "index.html")]
    ).map((candidate) => [candidate, 200]);
    if (!pathname.startsWith("/_next/"))
      candidates.push([resolve(root, "404.html"), 404]);
    for (const [candidate, status] of candidates) {
      try {
        if (!(await stat(candidate)).isFile()) continue;
        const content = await readFile(candidate);
        response.writeHead(status, {
          "Content-Type":
            mime[extname(candidate)] || "application/octet-stream",
          "Cache-Control": pathname.startsWith("/_next/static/")
            ? "public, max-age=31536000, immutable"
            : "no-cache",
        });
        response.end(request.method === "HEAD" ? undefined : content);
        return;
      } catch {
        /* Try the next static route form. */
      }
    }
    response.writeHead(404).end();
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const port = Number(process.env.PORT || 3000);
  createFrontendServer().listen(port, process.env.HOSTNAME || "127.0.0.1", () =>
    console.log(`Static frontend listening on ${port}`),
  );
}
