import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Text, Newline, useApp, useInput, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { loadConfig, saveConfig } from '../config/store.js';
import { fetchAvailableModels, ModelInfo } from '../llm/models.js';

interface Props {
  onComplete: () => void;
  onExit: () => void;
}

const POPULAR_MODEL_PREFIXES = [
  'anthropic/claude-3',
  'openai/gpt-4',
  'openai/gpt-3.5',
  'google/gemini-pro',
  'meta-llama/llama-3',
  'deepseek/deepseek',
  'glm/glm',
];

export default function SetupWizard({ onComplete, onExit }: Props) {
  const { exit } = useApp();
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const { stdout } = useStdout();
  const stepRef = useRef(step);
  stepRef.current = step;
  const readyRef = useRef(false);

  const visibleLimit = Math.max(5, (stdout?.rows ?? 24) - 8);

  useEffect(() => {
    const config = loadConfig();
    if (config.apiKey && !config.model) {
      setApiKey(config.apiKey);
      setLoading(true);
      fetchAvailableModels()
        .then(fetchedModels => {
          const popularModels = fetchedModels.filter(model =>
            POPULAR_MODEL_PREFIXES.some(prefix => model.id.startsWith(prefix))
          );
          setModels(popularModels);
          setStep(1);
        })
        .catch(err => {
          setError(`Failed to fetch models: ${err.message}`);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  useEffect(() => {
    if (step === 2) {
      const t = setTimeout(() => { readyRef.current = true; }, 1000);
      return () => clearTimeout(t);
    }
    readyRef.current = false;
  }, [step]);

  const confirmModel = useCallback((model: ModelInfo) => {
    setSelectedModel(model);
    saveConfig({ model: model.id });
    setStep(2);
  }, []);

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      onExit();
      return;
    }

    if (key.escape || input === 'q') {
      if (stepRef.current === 2) {
        onExit();
      } else {
        const config = loadConfig();
        if (config.apiKey) {
          onComplete();
        } else {
          onExit();
        }
      }
      return;
    }

    if (stepRef.current === 2 && readyRef.current) {
      onComplete();
      return;
    }

    if (stepRef.current === 1 && !loading && models.length > 0) {
      if (key.upArrow) {
        setCursor(prev => {
          const next = prev > 0 ? prev - 1 : models.length - 1;
          if (next < scrollOffset) setScrollOffset(next);
          else if (next >= scrollOffset + visibleLimit) setScrollOffset(next - visibleLimit + 1);
          return next;
        });
      } else if (key.downArrow) {
        setCursor(prev => {
          const next = prev < models.length - 1 ? prev + 1 : 0;
          if (next < scrollOffset) setScrollOffset(next);
          else if (next >= scrollOffset + visibleLimit) setScrollOffset(next - visibleLimit + 1);
          return next;
        });
      } else if (key.return) {
        confirmModel(models[cursor]);
      }
    }
  });

  const handleApiKeySubmit = () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    saveConfig({ apiKey });
    setLoading(true);
    setCursor(0);
    setScrollOffset(0);

    fetchAvailableModels()
      .then(fetchedModels => {
        const popularModels = fetchedModels.filter(model =>
          POPULAR_MODEL_PREFIXES.some(prefix => model.id.startsWith(prefix))
        );
        setModels(popularModels);
        setStep(1);
      })
      .catch(err => {
        setError(`Failed to fetch models: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (step === 0) {
    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>Welcome to TurboDev Setup</Text>
        <Newline />
        <Text>TurboDev needs an OpenRouter API key to work.</Text>
        <Text>Get one at: https://openrouter.ai/keys</Text>
        <Newline />
        <Text>Enter your OpenRouter API key:</Text>
        <TextInput
          value={apiKey}
          onChange={setApiKey}
          onSubmit={handleApiKeySubmit}
          placeholder="sk-or-..."
        />
        <Newline />
        {error && (
          <Box>
            <Text color="red">{error}</Text>
            <Newline />
            <Text color="gray">Press Enter to try again</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (step === 1) {
    if (loading) {
      return (
        <Box flexDirection="column">
          <Text color="cyan">Fetching available models...</Text>
          <Newline />
          <Text color="green">
            <Spinner type="dots" /> Loading
          </Text>
        </Box>
      );
    }

    const visibleModels = models.slice(scrollOffset, scrollOffset + visibleLimit);

    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>Select AI Model</Text>
        <Newline />
        <Text>Showing {models.length} popular models (filtered from all available).</Text>
        <Text>Use ↑/↓ arrows to navigate, Enter to select:</Text>
        <Newline />
        {visibleModels.map((model, i) => {
          const idx = scrollOffset + i;
          const isSelected = idx === cursor;
          return (
            <Box key={model.id}>
              <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
                {isSelected ? '❯ ' : '  '}{model.id}
              </Text>
            </Box>
          );
        })}
        <Newline />
        <Text color="gray">Press Ctrl+C to exit</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green" bold>Setup Complete!</Text>
      <Newline />
      <Text>Your TurboDev is configured:</Text>
      <Newline />
      <Text>  API Key: ••••••••••••••••••••••••••••</Text>
      <Text>  Model: {selectedModel?.id}</Text>
      <Newline />
      <Text color="cyan">Press any key to start TurboDev</Text>
      <Text color="gray">Press 'q' or Ctrl+C to exit</Text>
    </Box>
  );
}
