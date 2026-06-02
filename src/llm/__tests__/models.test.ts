import { describe, it, expect } from 'vitest';
import { cacheContextLengths, getContextLength } from '../models.js';
import type { ModelInfo } from '../models.js';

describe('cacheContextLengths + getContextLength', () => {
  it('caches context lengths from model list', () => {
    const models: ModelInfo[] = [
      { id: 'test/model-a', name: 'Model A', contextLength: 128000 },
      { id: 'test/model-b', name: 'Model B', contextLength: 200000 },
    ];
    cacheContextLengths(models);
    expect(getContextLength('test/model-a')).toBe(128000);
    expect(getContextLength('test/model-b')).toBe(200000);
  });

  it('returns 128000 default for unknown model', () => {
    expect(getContextLength('nonexistent/model')).toBe(128000);
  });

  it('skips models without contextLength', () => {
    const models: ModelInfo[] = [
      { id: 'test/no-ctx', name: 'No Context' },
    ];
    cacheContextLengths(models);
    expect(getContextLength('test/no-ctx')).toBe(128000);
  });

  it('overwrites previous cache on re-cache', () => {
    cacheContextLengths([
      { id: 'test/up', name: 'UP', contextLength: 100000 },
    ]);
    expect(getContextLength('test/up')).toBe(100000);

    cacheContextLengths([
      { id: 'test/up', name: 'UP', contextLength: 200000 },
    ]);
    expect(getContextLength('test/up')).toBe(200000);
  });
});
