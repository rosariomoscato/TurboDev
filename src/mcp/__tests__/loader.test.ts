import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadMcpConfig } from '../loader.js';
import type { MCPServerConfig } from '../types.js';

describe('loadMcpConfig', () => {
  let testDir: string;
  let configDir: string;
  let configPath: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'turbodev-test-'));
    configDir = path.join(testDir, '.turbodev');
    configPath = path.join(configDir, 'mcp.json');
  });

  afterEach(() => {
    // Clean up test directory
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('returns empty config when file is missing', () => {
    // Ensure no config file exists
    expect(fs.existsSync(configPath)).toBe(false);

    const result = loadMcpConfig(testDir);

    expect(result).toEqual({});
  });

  it('loads valid config with one server correctly', () => {
    const validConfig = {
      mcpServers: {
        filesystem: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
          env: {
            NODE_ENV: 'production'
          }
        }
      }
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(validConfig, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(result).toHaveProperty('filesystem');
    expect(result.filesystem).toEqual({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
      env: { NODE_ENV: 'production' }
    });
  });

  it('expands environment variables with $VAR syntax', () => {
    process.env.TEST_VAR = 'test-value';
    process.env.MY_PATH = '/custom/path';

    const configWithEnvVars = {
      mcpServers: {
        server1: {
          command: '$MY_PATH/bin/server',
          args: ['$TEST_VAR/arg'],
          env: {
            PATH: '$MY_PATH/bin'
          }
        }
      }
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(configWithEnvVars, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(result.server1.command).toBe('/custom/path/bin/server');
    expect(result.server1.args).toEqual(['test-value/arg']);
    expect(result.server1.env?.PATH).toBe('/custom/path/bin');

    // Cleanup
    delete process.env.TEST_VAR;
    delete process.env.MY_PATH;
  });

  it('expands environment variables with ${VAR} syntax', () => {
    process.env.TEST_VAR = 'test-value';
    process.env.MY_PATH = '/custom/path';

    const configWithBracedVars = {
      mcpServers: {
        server1: {
          command: '${MY_PATH}/bin/server',
          args: ['${TEST_VAR}/arg'],
          env: {
            PATH: '${MY_PATH}/bin'
          }
        }
      }
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(configWithBracedVars, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(result.server1.command).toBe('/custom/path/bin/server');
    expect(result.server1.args).toEqual(['test-value/arg']);
    expect(result.server1.env?.PATH).toBe('/custom/path/bin');

    // Cleanup
    delete process.env.TEST_VAR;
    delete process.env.MY_PATH;
  });

  it('expands ~ to home directory', () => {
    const homeDir = os.homedir();

    const configWithHomeDir = {
      mcpServers: {
        server1: {
          command: '~/bin/server',
          args: ['~/data/file.txt'],
          env: {
            HOME_DIR: '~/workspace'
          }
        }
      }
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(configWithHomeDir, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(result.server1.command).toBe(`${homeDir}/bin/server`);
    expect(result.server1.args).toEqual([`${homeDir}/data/file.txt`]);
    expect(result.server1.env?.HOME_DIR).toBe(`${homeDir}/workspace`);
  });

  it('handles multiple servers with env expansion', () => {
    process.env.CUSTOM_PATH = '/my/custom/path';
    process.env.NODE_ENV = 'development';

    const multiServerConfig = {
      mcpServers: {
        filesystem: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '$CUSTOM_PATH/data'],
        },
        github: {
          command: '${CUSTOM_PATH}/bin/github-server',
          env: {
            TOKEN: '~/.github/token'
          }
        },
        postgres: {
          command: '~/bin/postgres-server',
          args: ['--port', '5432']
        }
      }
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(multiServerConfig, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);
    const homeDir = os.homedir();

    expect(Object.keys(result)).toHaveLength(3);

    expect(result.filesystem).toEqual({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/my/custom/path/data']
    });

    expect(result.github).toEqual({
      command: '/my/custom/path/bin/github-server',
      env: { TOKEN: `${homeDir}/.github/token` }
    });

    expect(result.postgres).toEqual({
      command: `${homeDir}/bin/postgres-server`,
      args: ['--port', '5432']
    });

    // Cleanup
    delete process.env.CUSTOM_PATH;
    delete process.env.NODE_ENV;
  });

  it('returns empty config for malformed JSON', () => {
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, '{"mcpServers": {invalid json}}', 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(result).toEqual({});
  });

  it('skips entry with missing command field', () => {
    const configWithMissingCommand = {
      mcpServers: {
        validServer: {
          command: 'npx',
          args: ['-y', 'server']
        },
        invalidServer: {
          args: ['-y', 'server']
        } as any // Missing command field
      }
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(configWithMissingCommand, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(Object.keys(result)).toHaveLength(1);
    expect(result).toHaveProperty('validServer');
    expect(result.validServer).toEqual({
      command: 'npx',
      args: ['-y', 'server']
    });
  });

  it('skips entry with non-string command field', () => {
    const configWithInvalidCommand = {
      mcpServers: {
        validServer: {
          command: 'npx',
          args: ['-y', 'server']
        },
        invalidServer: {
          command: 123, // Non-string command
          args: ['-y', 'server']
        } as any
      }
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(configWithInvalidCommand, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(Object.keys(result)).toHaveLength(1);
    expect(result).toHaveProperty('validServer');
    expect(result.validServer).toEqual({
      command: 'npx',
      args: ['-y', 'server']
    });
  });

  it('skips entry with empty string command field', () => {
    const configWithEmptyCommand = {
      mcpServers: {
        validServer: {
          command: 'npx',
          args: ['-y', 'server']
        },
        invalidServer: {
          command: '   ', // Empty string (whitespace only)
          args: ['-y', 'server']
        } as any
      }
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(configWithEmptyCommand, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(Object.keys(result)).toHaveLength(1);
    expect(result).toHaveProperty('validServer');
    expect(result.validServer).toEqual({
      command: 'npx',
      args: ['-y', 'server']
    });
  });

  it('skips entry with non-string args array', () => {
    const configWithInvalidArgs = {
      mcpServers: {
        validServer: {
          command: 'npx',
          args: ['-y', 'server']
        },
        invalidServer: {
          command: 'npx',
          args: ['valid', 123, 'args'] as any // Non-string element in args
        }
      }
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(configWithInvalidArgs, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(Object.keys(result)).toHaveLength(1);
    expect(result).toHaveProperty('validServer');
    expect(result.validServer).toEqual({
      command: 'npx',
      args: ['-y', 'server']
    });
  });

  it('skips entry with non-array args field', () => {
    const configWithNonArrayArgs = {
      mcpServers: {
        validServer: {
          command: 'npx',
          args: ['-y', 'server']
        },
        invalidServer: {
          command: 'npx',
          args: '-y' as any // String instead of array
        }
      }
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(configWithNonArrayArgs, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(Object.keys(result)).toHaveLength(1);
    expect(result).toHaveProperty('validServer');
    expect(result.validServer).toEqual({
      command: 'npx',
      args: ['-y', 'server']
    });
  });

  it('skips entry with non-object env field', () => {
    const configWithInvalidEnv = {
      mcpServers: {
        validServer: {
          command: 'npx',
          args: ['-y', 'server']
        },
        invalidServer: {
          command: 'npx',
          env: 'invalid' as any // String instead of object
        }
      }
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(configWithInvalidEnv, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(Object.keys(result)).toHaveLength(1);
    expect(result).toHaveProperty('validServer');
    expect(result.validServer).toEqual({
      command: 'npx',
      args: ['-y', 'server']
    });
  });

  it('skips entry with non-string value in env', () => {
    const configWithInvalidEnvValue = {
      mcpServers: {
        validServer: {
          command: 'npx',
          args: ['-y', 'server']
        },
        invalidServer: {
          command: 'npx',
          env: {
            VALID: 'value',
            INVALID: 123 as any // Non-string value
          }
        }
      }
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(configWithInvalidEnvValue, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(Object.keys(result)).toHaveLength(1);
    expect(result).toHaveProperty('validServer');
    expect(result.validServer).toEqual({
      command: 'npx',
      args: ['-y', 'server']
    });
  });

  it('strips unknown fields from server config', () => {
    const configWithExtraFields = {
      mcpServers: {
        server1: {
          command: 'npx',
          args: ['-y', 'server'],
          env: { NODE_ENV: 'production' },
          unknownField: 'should be stripped',
          anotherUnknown: 123,
          extraNested: { foo: 'bar' }
        } as any
      }
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(configWithExtraFields, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(result.server1).toEqual({
      command: 'npx',
      args: ['-y', 'server'],
      env: { NODE_ENV: 'production' }
    });

    // Verify unknown fields are not present
    expect(result.server1).not.toHaveProperty('unknownField');
    expect(result.server1).not.toHaveProperty('anotherUnknown');
    expect(result.server1).not.toHaveProperty('extraNested');
  });

  it('handles server config with only required fields', () => {
    const minimalConfig = {
      mcpServers: {
        minimalServer: {
          command: 'npx'
        }
      }
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(minimalConfig, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(result.minimalServer).toEqual({
      command: 'npx'
    });
    expect(result.minimalServer).not.toHaveProperty('args');
    expect(result.minimalServer).not.toHaveProperty('env');
  });

  it('replaces unset environment variables with empty string', () => {
    // Ensure these variables are not set
    delete process.env.UNSET_VAR;
    delete process.env.ANOTHER_UNSET;

    const configWithUnsetVars = {
      mcpServers: {
        server1: {
          command: '$UNSET_VAR/bin/server',
          args: ['${ANOTHER_UNSET}/file']
        }
      }
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(configWithUnsetVars, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(result.server1.command).toBe('/bin/server');
    expect(result.server1.args).toEqual(['/file']);
  });

  it('handles empty mcpServers object', () => {
    const emptyConfig = {
      mcpServers: {}
    };

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(emptyConfig, null, 2), 'utf-8');

    const result = loadMcpConfig(testDir);

    expect(result).toEqual({});
  });
});