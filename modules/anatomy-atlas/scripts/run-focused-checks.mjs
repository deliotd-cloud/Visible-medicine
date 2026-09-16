#!/usr/bin/env node

import { access, mkdir, open, readFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const SAFE_NAME = /^(?:[a-z0-9][a-z0-9-]*:)*(?:test|check)$/;

export function parseArgs(args, scripts) {
  let list = false;
  let dryRun = false;
  const names = [];
  for (const arg of args) {
    if (arg === "--list") list = true;
    else if (arg === "--dry-run") dryRun = true;
    else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    else names.push(arg);
  }
  if (list && (dryRun || names.length)) throw new Error("--list cannot be combined with selections or --dry-run");
  if (!list && names.length === 0) throw new Error("Select at least one test/check script (or use --list)");
  const duplicate = names.find((name, index) => names.indexOf(name) !== index);
  if (duplicate) throw new Error(`Duplicate script: ${duplicate}`);
  for (const name of names) {
    if (!SAFE_NAME.test(name) || !Object.hasOwn(scripts, name)) throw new Error(`Unknown or unsafe script: ${name}`);
  }
  return { list, dryRun, names };
}

async function findNpmCli(env = process.env) {
  const candidates = [
    env.npm_execpath,
    resolve(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js"),
    resolve(dirname(process.execPath), "../lib/node_modules/npm/bin/npm-cli.js"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {}
  }
  throw new Error("Could not locate npm-cli.js; run through npm or install npm beside Node.js");
}

async function runChild(name, { cwd, npmCli, spawnImpl, log }) {
  await log.write(`\n===== ${name} =====\n`);
  return new Promise((resolveChild, rejectChild) => {
    const started = Date.now();
    let child;
    let settled = false;
    const finish = async (code, signal, error) => {
      if (settled) return;
      settled = true;
      try {
        if (error) await log.write(`[spawn error] ${error.message}\n`);
        resolveChild({
          name, status: code === 0 && !signal && !error ? "pass" : "fail",
          exitCode: code, signal: signal ?? null, error: error?.message,
          durationMs: Date.now() - started,
        });
      } catch (logError) {
        rejectChild(logError);
      }
    };
    try {
      child = spawnImpl(process.execPath, [npmCli, "run", "--silent", name], {
        cwd,
        env: process.env,
        shell: false,
        windowsHide: true,
        stdio: ["ignore", log.fd, log.fd],
      });
    } catch (error) {
      void finish(null, null, error);
      return;
    }
    child.once("error", (error) => void finish(null, null, error));
    child.once("close", (code, signal) => void finish(code, signal, null));
  });
}

async function reserveRunFiles(cwd, openImpl) {
  const logDir = resolve(cwd, ".local", "test-logs");
  await mkdir(logDir, { recursive: true });
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const id = `${new Date().toISOString().replaceAll(":", "-")}-${process.pid}-${randomUUID().slice(0, 8)}`;
    const manifestPath = resolve(logDir, `${id}.json`);
    const logPath = resolve(logDir, `${id}.log`);
    let manifest;
    try {
      manifest = await openImpl(manifestPath, "wx");
      const log = await openImpl(logPath, "wx");
      return { logDir, logPath, manifestPath, manifest, log };
    } catch (error) {
      if (manifest) {
        await manifest.close();
        await unlink(manifestPath).catch(() => {});
      }
      if (error.code !== "EEXIST" || attempt === 9) throw error;
    }
  }
}

export async function runFocusedChecks({
  argv = process.argv.slice(2), cwd = process.cwd(), spawnImpl = spawn,
  stdout = process.stdout, stderr = process.stderr, npmCli, openImpl = open,
} = {}) {
  let paths;
  try {
    const packageJson = JSON.parse(await readFile(resolve(cwd, "package.json"), "utf8"));
    const scripts = packageJson.scripts ?? {};
    const options = parseArgs(argv, scripts);
    const allowed = Object.keys(scripts).filter((name) => SAFE_NAME.test(name)).sort();
    if (options.list) {
      stdout.write(`${allowed.join("\n")}\n`);
      return 0;
    }
    if (options.dryRun) {
      for (const name of options.names) stdout.write(`DRY ${name}: ${scripts[name]}\n`);
      return 0;
    }

    const cli = npmCli ?? await findNpmCli();
    paths = await reserveRunFiles(cwd, openImpl);
    const startedAt = new Date();
    const results = [];
    for (const name of options.names) {
      const result = await runChild(name, { cwd, npmCli: cli, spawnImpl, log: paths.log });
      results.push(result);
      stdout.write(`${result.status === "pass" ? "PASS" : "FAIL"} ${name} ${result.durationMs}ms\n`);
    }
    const finishedAt = new Date();
    const status = results.every((result) => result.status === "pass") ? "pass" : "fail";
    await paths.log.close();
    paths.log = null;
    const manifest = {
      status, startedAt: startedAt.toISOString(), finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt - startedAt, requested: options.names,
      scripts: Object.fromEntries(options.names.map((name) => [name, scripts[name]])),
      runtime: { node: process.version, cwd },
      log: relative(cwd, paths.logPath).replaceAll("\\", "/"), results,
    };
    await paths.manifest.writeFile(`${JSON.stringify(manifest, null, 2)}\n`);
    await paths.manifest.close();
    paths.manifest = null;
    stdout.write(`LOG ${manifest.log}\n`);
    return status === "pass" ? 0 : 1;
  } catch (error) {
    stderr.write(`ERROR ${error.message}\n`);
    return 2;
  } finally {
    await Promise.allSettled([paths?.log?.close(), paths?.manifest?.close()].filter(Boolean));
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await runFocusedChecks();
}
