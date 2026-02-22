/**
 * Isolated Test Environment for OpenClaw
 *
 * Creates a completely isolated OpenClaw environment that won't interfere
 * with your real OpenClaw configuration.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Options for creating an isolated test environment
 */
export interface TestEnvOptions {
  /** Base directory for test environments (default: /tmp/openclaw-test-env) */
  baseDir?: string;
  /** Unique identifier for this test environment (random if not provided) */
  envId?: string;
  /** Whether to create the directory if it doesn't exist */
  createDir?: boolean;
}

/**
 * Isolated test environment
 */
export interface TestEnv {
  /** Unique environment ID */
  envId: string;
  /** State directory (OPENCLAW_STATE_DIR) */
  stateDir: string;
  /** Config file path (OPENCLAW_CONFIG_PATH) */
  configPath: string;
  /** Sessions directory */
  sessionsDir: string;
  /** Credentials directory */
  credentialsDir: string;
  /** Environment variables to set */
  env: Record<string, string>;
  /** Cleanup function to remove the environment */
  cleanup: () => Promise<void>;
  /** Write config to the environment */
  writeConfig: (config: unknown) => Promise<void>;
  /** Read config from the environment */
  readConfig: () => Promise<unknown>;
}

/**
 * Create an isolated OpenClaw test environment
 */
export function createTestEnv(options: TestEnvOptions = {}): TestEnv {
  const {
    baseDir = path.join(os.tmpdir(), "openclaw-test-env"),
    envId = crypto.randomUUID().slice(0, 8),
    createDir = true,
  } = options;

  const stateDir = path.join(baseDir, envId);
  const configPath = path.join(stateDir, "openclaw.json");
  const sessionsDir = path.join(stateDir, "sessions");
  const credentialsDir = path.join(stateDir, "credentials");

  if (createDir) {
    fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    fs.mkdirSync(sessionsDir, { recursive: true, mode: 0o700 });
    fs.mkdirSync(credentialsDir, { recursive: true, mode: 0o700 });
  }

  const env: Record<string, string> = {
    OPENCLAW_STATE_DIR: stateDir,
    OPENCLAW_CONFIG_PATH: configPath,
    OPENCLAW_HOME: stateDir,
    // Disable channels by default for testing
    OPENCLAW_SKIP_CHANNELS: "1",
  };

  const cleanup = async () => {
    if (fs.existsSync(stateDir)) {
      await fs.promises.rm(stateDir, { recursive: true, force: true });
    }
  };

  const writeConfig = async (config: unknown) => {
    await fs.promises.writeFile(
      configPath,
      JSON.stringify(config, null, 2),
      { mode: 0o600 }
    );
  };

  const readConfig = async () => {
    if (!fs.existsSync(configPath)) {
      return undefined;
    }
    const content = await fs.promises.readFile(configPath, "utf-8");
    return JSON.parse(content);
  };

  return {
    envId,
    stateDir,
    configPath,
    sessionsDir,
    credentialsDir,
    env,
    cleanup,
    writeConfig,
    readConfig,
  };
}

/**
 * Create a minimal test configuration
 */
export function createMinimalConfig(): Record<string, unknown> {
  return {
    models: {
      default: "test-model",
      providers: {
        // Minimal config with no real API keys
        test: {
          apiKey: "test-key",
        },
      },
    },
    session: {
      scope: "per-sender",
      store: "sessions",
    },
    tools: {
      // Disable dangerous tools by default
      exec: {
        allow: false,
        ask: true,
      },
      fs_write: {
        allow: false,
      },
    },
    // Disable all channels
    channels: {
      whatsapp: { enabled: false },
      telegram: { enabled: false },
      discord: { enabled: false },
      slack: { enabled: false },
    },
  };
}

/**
 * Create a config with some tools enabled (for attack testing)
 */
export function createAttackTestConfig(): Record<string, unknown> {
  return {
    models: {
      default: "test-model",
      providers: {
        test: {
          apiKey: "test-key",
        },
      },
    },
    session: {
      scope: "per-sender",
      store: "sessions",
      mainKey: "test-session",
    },
    tools: {
      // Enable more tools for attack testing (in a safe way)
      exec: {
        allow: true,
        ask: false, // For testing - normally this should be true!
      },
      fs_read: {
        allow: true,
      },
      fs_write: {
        allow: true,
      },
      web_fetch: {
        allow: true,
      },
    },
    channels: {
      // Disable all channels
      whatsapp: { enabled: false },
      telegram: { enabled: false },
      discord: { enabled: false },
      slack: { enabled: false },
    },
  };
}

/**
 * Run a function in the context of a test environment
 */
export async function withTestEnv<T>(
  fn: (env: TestEnv) => Promise<T>,
  options: TestEnvOptions = {}
): Promise<T> {
  const env = createTestEnv(options);
  try {
    return await fn(env);
  } finally {
    await env.cleanup();
  }
}

/**
 * Get a summary of existing test environments
 */
export function listTestEnvs(baseDir?: string): Array<{
  envId: string;
  stateDir: string;
  createdAt: Date;
  sizeBytes: number;
}> {
  const dir = baseDir ?? path.join(os.tmpdir(), "openclaw-test-env");
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results: Array<{
    envId: string;
    stateDir: string;
    createdAt: Date;
    sizeBytes: number;
  }> = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(dir, entry.name);
    const stat = fs.statSync(fullPath);
    results.push({
      envId: entry.name,
      stateDir: fullPath,
      createdAt: stat.birthtime,
      sizeBytes: stat.size,
    });
  }

  return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Cleanup old test environments
 */
export function cleanupOldTestEnvs(
  olderThanHours: number = 24,
  baseDir?: string
): number {
  const envs = listTestEnvs(baseDir);
  const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000;
  let cleaned = 0;

  for (const env of envs) {
    if (env.createdAt.getTime() < cutoff) {
      try {
        fs.rmSync(env.stateDir, { recursive: true, force: true });
        cleaned++;
      } catch {
        // Ignore errors
      }
    }
  }

  return cleaned;
}
