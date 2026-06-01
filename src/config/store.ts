import fs from 'fs';
import path from 'path';
import os from 'os';

export interface TurboDevConfig {
  apiKey?: string;
  model?: string;
}

function getConfigPath(): string {
  return path.join(os.homedir(), '.turbodevrc');
}

export function loadConfig(): TurboDevConfig {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading config file:', error);
    return {};
  }
}

export function saveConfig(config: Partial<TurboDevConfig>): void {
  const configPath = getConfigPath();
  const existing = loadConfig();
  const merged = { ...existing, ...config };

  try {
    fs.writeFileSync(
      configPath,
      JSON.stringify(merged, null, 2),
      'utf-8'
    );
  } catch (error) {
    console.error('Error writing config file:', error);
    throw error;
  }
}