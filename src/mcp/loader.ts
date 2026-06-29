// ---------------------------------------------------------------------------
// MCP Module — Config Loader
// ---------------------------------------------------------------------------
// Reads `.turbodev/mcp.json` with environment variable and home directory
// expansion, validates against the Claude Desktop-compatible schema, and
// returns the parsed config.  Errors are logged but do not block application
// startup (graceful degradation).
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { MCPServerConfig } from './types.js';

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Validate a single MCP server config entry.
 *
 * Required fields:
 *   - command: non-empty string
 *   - args: optional array of strings
 *   - env: optional record of string to string
 *
 * Returns `true` when valid, `false` otherwise.
 */
function isValidServerConfig(config: unknown): config is MCPServerConfig {
  if (typeof config !== 'object' || config === null) return false;

  const entry = config as Record<string, unknown>;

  // command is required and must be a non-empty string
  if (typeof entry.command !== 'string' || entry.command.trim().length === 0) {
    return false;
  }

  // args must be an array of strings if present
  if (entry.args !== undefined && !Array.isArray(entry.args)) {
    return false;
  }
  if (Array.isArray(entry.args) && entry.args.some((arg) => typeof arg !== 'string')) {
    return false;
  }

  // env must be a record of strings if present
  if (entry.env !== undefined && typeof entry.env !== 'object') {
    return false;
  }
  if (entry.env && typeof entry.env === 'object' && !Array.isArray(entry.env)) {
    for (const value of Object.values(entry.env)) {
      if (typeof value !== 'string') return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Environment variable and home directory expansion
// ---------------------------------------------------------------------------

/**
 * Expand environment variables of the form `$VAR` or `${VAR}` in a string.
 *
 * If a variable is not set, it is replaced with an empty string.
 * Does not support recursive expansion (e.g., `$HOME/$USER` works but
 * `$PREFIX/$SUBDIR` where $SUBDIR contains another variable does not).
 *
 * @param str - String containing variable references.
 * @returns String with variables replaced by their values.
 */
function expandEnvVars(str: string): string {
  return str.replace(
    /\$(\w+)|\$\{([^}]+)\}/g,
    (match, simpleVar, bracedVar) => {
      const varName = simpleVar || bracedVar;
      return process.env[varName] ?? '';
    }
  );
}

/**
 * Expand `~` to the user's home directory in a string.
 *
 * @param str - String possibly containing `~`.
 * @returns String with `~` replaced by the home directory.
 */
function expandHomeDir(str: string): string {
  if (str === '~' || str.startsWith('~/')) {
    return os.homedir() + str.slice(1);
  }
  return str;
}

/**
 * Apply both home directory and environment variable expansion to a string.
 *
 * This is the public expansion helper referenced by the spec acceptance
 * criteria. It handles `$VAR`, `${VAR}`, and leading `~` in a single pass.
 *
 * @param value - String to expand.
 * @returns Fully expanded string.
 */
export function expandEnvValue(value: string): string {
  const homeExpanded = expandHomeDir(value);
  return expandEnvVars(homeExpanded);
}

/** Internal alias kept for readability within this module. */
function expandPath(str: string): string {
  return expandEnvValue(str);
}

/**
 * Expand all values in a server config (command, args, env values).
 *
 * Returns a new config object with all strings expanded.
 *
 * @param config - Server config to expand.
 * @returns Expanded config object.
 */
function expandServerConfig(config: MCPServerConfig): MCPServerConfig {
  const result: MCPServerConfig = {
    command: expandPath(config.command),
  };

  if (config.args) {
    result.args = config.args.map(expandPath);
  }

  if (config.env) {
    result.env = {};
    for (const [key, value] of Object.entries(config.env)) {
      result.env[key] = expandPath(value);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load and parse the MCP servers configuration file.
 *
 * The function:
 *   1. Reads `.turbodev/mcp.json` from the specified working directory.
 *   2. Expands environment variables and home directory paths.
 *   3. Validates the schema against `MCPServersConfig`.
 *   4. Returns the expanded config, or an empty config on errors.
 *
 * Errors are logged to stderr but do not throw — the application continues
 * with no MCP servers available.
 *
 * @param cwd - The working directory to load the config from.
 * @returns A `Record<string, MCPServerConfig>` object (may have no servers).
 */
export function loadMcpConfig(cwd: string): Record<string, MCPServerConfig> {
  const configPath = path.join(cwd, '.turbodev', 'mcp.json');

  // --- Config file does not exist (not an error, just no MCP servers) -----
  if (!fs.existsSync(configPath)) {
    return {};
  }

  // --- Read and parse JSON -------------------------------------------------
  let raw: string;
  try {
    raw = fs.readFileSync(configPath, 'utf-8');
  } catch (e) {
    console.error(`[MCP] Failed to read ${configPath}: ${e}`);
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error(`[MCP] Failed to parse ${configPath}: ${e}`);
    return {};
  }

  // --- Validate top-level structure ----------------------------------------
  if (typeof parsed !== 'object' || parsed === null) {
    console.error(`[MCP] Invalid config in ${configPath}: root must be an object`);
    return {};
  }

  const obj = parsed as Record<string, unknown>;

  // mcpServers is required
  if (!obj.mcpServers || typeof obj.mcpServers !== 'object' || Array.isArray(obj.mcpServers)) {
    console.error(`[MCP] Invalid config in ${configPath}: mcpServers must be an object`);
    return {};
  }

  const servers = obj.mcpServers as Record<string, unknown>;

  // --- Process each server entry, validating individually --------------------
  const result: Record<string, MCPServerConfig> = {};

  for (const [serverName, serverConfig] of Object.entries(servers)) {
    // Validate this specific server entry
    if (!isValidServerConfig(serverConfig)) {
      console.warn(`[MCP] Skipping invalid server entry "${serverName}" in ${configPath}`);
      continue;
    }

    // Expand environment variables and home directory
    try {
      result[serverName] = expandServerConfig(serverConfig);
    } catch (e) {
      console.error(`[MCP] Failed to expand config for server "${serverName}": ${e}`);
      // Skip this server but continue with others
    }
  }

  return result;
}