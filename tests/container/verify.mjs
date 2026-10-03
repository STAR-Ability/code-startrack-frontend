// All writes are to an ephemeral fixture on an internal Docker network.
import { spawn } from "node:child_process";
const project = `codestartrack-check-${process.pid}`;
const suppliedImage = process.env.CONTAINER_TEST_IMAGE;
const environment = {
  ...process.env,
  FRONTEND_IMAGE:
    suppliedImage || `codestartrack-frontend:check-${process.pid}`,
  BACKEND_BASE_URL: "http://backend:8081",
  FRONTEND_PORT: "3300",
  FRONTEND_BIND_ADDRESS: "127.0.0.1",
};
const compose = [
  "compose",
  "--env-file",
  "/dev/null",
  "--project-name",
  project,
  "-f",
  "docker-compose.yml",
  "-f",
  "tests/container/compose.yml",
];
function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, { stdio: "inherit", env: environment });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`docker ${args[0]} failed (${code})`)),
    );
  });
}
// Fail before changing anything when Docker is unavailable.
await run(["info", "--format", "{{.ServerVersion}}"]);
if (suppliedImage)
  await run(["image", "inspect", suppliedImage, "--format", "{{.Id}}"]);
try {
  await run([...compose, "config", "--quiet"]);
  await run([
    ...compose,
    "build",
    ...(suppliedImage ? [] : ["frontend"]),
    "browser-check",
  ]);
  await run([
    ...compose,
    "up",
    "--no-build",
    "-d",
    "--wait",
    "--wait-timeout",
    "90",
    "backend",
    "frontend",
    "secure-frontend",
  ]);
  await run([
    ...compose,
    "exec",
    "-T",
    "frontend",
    "sh",
    "-c",
    "test -f /usr/share/nginx/html/dashboard.html && test -f /usr/share/nginx/html/product/profile.html && test -f /usr/share/nginx/html/about.html && test ! -d /usr/share/nginx/html/src && test ! -d /usr/share/nginx/html/storybook-static && test ! -f /usr/share/nginx/html/.env.local",
  ]);
  await run([...compose, "run", "--rm", "--no-deps", "browser-check"]);
  await run([...compose, "stop", "backend"]);
  await run([
    ...compose,
    "exec",
    "-T",
    "frontend",
    "wget",
    "-q",
    "-O",
    "/dev/null",
    "http://127.0.0.1/healthz",
  ]);
} catch (error) {
  await run([...compose, "logs", "--tail", "80"]).catch(() => {});
  throw error;
} finally {
  await run([...compose, "down"]);
}
