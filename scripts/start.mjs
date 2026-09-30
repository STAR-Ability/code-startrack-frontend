// The standalone server needs its static/public assets beside server.js.
// Docker copies these at build time; local production starts prepare them here.
import { cp } from "node:fs/promises";

await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
await cp("public", ".next/standalone/public", { recursive: true });
await import("../.next/standalone/server.js");
