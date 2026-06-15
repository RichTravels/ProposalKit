import fs from "fs";
import path from "path";

function parseEnvFile(contents: string): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }

  return vars;
}

let envLocalCache: Record<string, string> | null | undefined;

function readEnvLocal(): Record<string, string> {
  if (envLocalCache !== undefined) return envLocalCache ?? {};

  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    envLocalCache = null;
    return {};
  }

  envLocalCache = parseEnvFile(fs.readFileSync(envPath, "utf8"));
  return envLocalCache;
}

/** Prefer project `.env.local` over inherited shell env (e.g. stale Cursor exports). */
export function getEnv(key: string): string | undefined {
  return readEnvLocal()[key] ?? process.env[key];
}

export function getRequiredEnv(key: string): string {
  const value = getEnv(key);
  if (!value) throw new Error(`${key} is not configured`);
  return value;
}
