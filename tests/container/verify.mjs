// Separately invoked Docker acceptance. All backend values are synthetic and fixed.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const project = `codestartrack-check-${process.pid}`;
const image = `codestartrack-frontend:check-${process.pid}`;
const contextImage = `codestartrack-context:check-${process.pid}`;
const environment = {
  ...process.env,
  BACKEND_BASE_URL: "http://fixture-a:8080",
  FRONTEND_IMAGE: image,
  FRONTEND_PORT: "3300",
  FRONTEND_BIND_ADDRESS: "127.0.0.1",
  EXPECTED_SOLVED: "31",
  EXPECTED_FIXTURE: "fixture-a",
};
const composeArgs = [
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
function run(
  args,
  { quiet = false, env = environment, allowFailure = false } = {},
) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    for (const stream of [child.stdout, child.stderr])
      stream.on("data", (chunk) => {
        output += chunk.toString();
        if (!quiet) process.stdout.write(chunk);
      });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0 && !allowFailure)
        reject(
          new Error(
            `Docker ${args[0]} failed (${code}): ${output.slice(-3000)}`,
          ),
        );
      else resolve({ code, output });
    });
  });
}
const compose = (args, options) => run([...composeArgs, ...args], options);
const temporary = await mkdtemp(join(tmpdir(), "codestartrack-context-"));
try {
  const missing = await compose(["config", "--quiet"], {
    quiet: true,
    allowFailure: true,
    env: { ...environment, BACKEND_BASE_URL: "" },
  });
  assert.notEqual(missing.code, 0);
  assert.match(missing.output, /Set BACKEND_BASE_URL/);
  await compose(["config", "--quiet"]);
  // Audit the actual Docker context, including ignored local files on this machine.
  await writeFile(
    join(temporary, "Dockerfile"),
    "FROM node:24-alpine\nCOPY . /context\n",
  );
  await run([
    "build",
    "-f",
    join(temporary, "Dockerfile"),
    "-t",
    contextImage,
    ".",
  ]);
  await run([
    "run",
    "--rm",
    "--network",
    "none",
    contextImage,
    "node",
    "-e",
    `
    const fs = require('node:fs'); const assert = require('node:assert/strict');
    const paths = fs.readdirSync('/context', { recursive: true });
    assert.ok(paths.includes('src/app/page.tsx'));
    assert.ok(!paths.some(p => /(^|\\/)(\\.env[^/]*|\\.git|node_modules|tests|test-results|\\.next)(\\/|$)|\\.test\\.|\\.(pem|key)$/.test(p)));
    console.log('Docker context excludes local environments, dependencies, tests and build artifacts.');
  `,
  ]);
  await compose(["build", "frontend", "browser-check"]);
  await compose([
    "up",
    "-d",
    "--no-build",
    "--pull",
    "never",
    "--wait",
    "--wait-timeout",
    "90",
    "fixture-a",
    "fixture-b",
    "frontend",
  ]);
  let firstImage;
  const evidence = [];
  for (const [fixture, solved] of [
    ["fixture-a", "31"],
    ["fixture-b", "47"],
  ]) {
    environment.BACKEND_BASE_URL = `http://${fixture}:8080`;
    environment.EXPECTED_FIXTURE = fixture;
    environment.EXPECTED_SOLVED = solved;
    if (fixture === "fixture-b")
      await compose([
        "up",
        "-d",
        "--no-build",
        "--pull",
        "never",
        "--wait",
        "--wait-timeout",
        "90",
        "frontend",
      ]);
    const id = (
      await compose(["ps", "--quiet", "frontend"], { quiet: true })
    ).output.trim();
    const [{ Image: imageId, Config: config, HostConfig: host, State: state }] =
      JSON.parse((await run(["inspect", id], { quiet: true })).output);
    assert.equal(state.Health.Status, "healthy");
    assert.equal(config.User, "node");
    assert.deepEqual(config.Cmd, ["node", "server.js"]);
    assert.equal(host.RestartPolicy.Name, "unless-stopped");
    assert.equal(host.Binds, null);
    if (!firstImage) firstImage = imageId;
    assert.equal(imageId, firstImage);
    await compose([
      "exec",
      "-T",
      "frontend",
      "node",
      "-e",
      `
      const fs=require('node:fs');const assert=require('node:assert/strict');
      assert.notEqual(process.getuid(),0);
      for(const path of ['.env','.env.local','src','tests','node_modules/vitest','node_modules/@playwright','node_modules/typescript'])assert.ok(!fs.existsSync(path),path);
      assert.ok(fs.existsSync('server.js'));assert.ok(fs.existsSync('.next/static'));assert.ok(fs.existsSync('public'));
    `,
    ]);
    const result = await compose(["run", "--rm", "--no-deps", "browser-check"]);
    const line = result.output
      .split("\n")
      .find((line) => line.startsWith("CONTAINER_EVIDENCE "));
    assert.ok(line, "Browser container must provide completed evidence");
    evidence.push(JSON.parse(line.slice("CONTAINER_EVIDENCE ".length)));
  }
  assert.deepEqual(evidence[0].assets, evidence[1].assets);
  const [imageConfig] = JSON.parse(
    (await run(["image", "inspect", image], { quiet: true })).output,
  );
  assert.ok(
    !imageConfig.Config.Env.some((value) =>
      value.startsWith("BACKEND_BASE_URL="),
    ),
  );
  assert.doesNotMatch(
    (await run(["history", "--no-trunc", image], { quiet: true })).output,
    /BACKEND_BASE_URL|fixture-[ab]|\.env\.local/,
  );
  await compose(["stop", "fixture-a", "fixture-b"]);
  // Health still succeeds when there is no listening backend, without repair.
  await compose([
    "exec",
    "-T",
    "frontend",
    "node",
    "-e",
    `
    const assert=require('node:assert/strict');
    (async()=>{assert.equal((await fetch('http://127.0.0.1:3000/api/health')).status,200);
    assert.equal((await fetch('http://127.0.0.1:3000/api/training/profile')).status,502);
    assert.equal((await fetch('http://127.0.0.1:3000/api/health')).status,200);})().catch(e=>{console.error(e);process.exit(1)});
  `,
  ]);
  await mkdir("test-results", { recursive: true });
  await writeFile(
    "test-results/container-evidence.json",
    JSON.stringify({ imageId: firstImage, evidence }, null, 2),
  );
  console.log(
    `Container acceptance passed with the same image ${firstImage}; evidence: test-results/container-evidence.json`,
  );
} finally {
  await compose(["down", "--volumes", "--remove-orphans"], {
    allowFailure: true,
  });
  await run(["image", "rm", contextImage], { allowFailure: true, quiet: true });
  await rm(temporary, { recursive: true, force: true });
}
