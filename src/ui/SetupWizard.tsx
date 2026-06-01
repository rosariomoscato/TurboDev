import React, { useState, useEffect } from 'react';
import { Box, Text, Newline, useApp, useInput, useStdoutDimensions } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { loadConfig, saveConfig } from '../config/store.js';
import { fetchAvailableModels, ModelInfo } from '../llm/models.js';

interface Props {
  onComplete: () => void;
}

// Popular models to show (filtered from OpenRouter's hundreds of models)
const POPULAR_MODEL_PREFIXES = [
  'anthropic/claude-3',
  'openai/gpt-4',
  'openai/gpt-3.5',
  'google/gemini-pro',
  'meta-llama/llama-3',
  'deepseek/deepseek',
  'glm/glm',
];

export default function SetupWizard({ onComplete }: Props) {
  const { exit } = useApp();
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if API key already exists and skip to model selection
  useEffect(() => {
    const config = loadConfig();
    if (config.apiKey && !config.model) {
      // API key exists but no model selected, fetch models and go to step 1
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

  // Global handler for Ctrl+C to exit at any time
  useInput((input, key) => {
    // Global handler for Ctrl+C to exit at any time
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }
    
    // Handle exit from setup (Esc or q)
    if (key.escape || input === 'q') {
      const config = loadConfig();
      if (config.apiKey) { // If apiKey exists, assume we can exit setup and proceed
        onComplete();
      } else { // Otherwise, exit the app entirely
        exit();
      }
      return; // Stop further processing
    }

    // Handle step-specific actions
    if (step === 0) {
      // API Key submission is handled by TextInput's onSubmit
    } else if (step === 1) {
      // Model selection handled by SelectInput's onSelect
    } else if (step === 2) { // Setup Complete screen
      if (key.return) {
        onComplete();
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

    fetchAvailableModels()
      .then(fetchedModels => {
        // Filter to popular models only (avoid overwhelming user with 500+ options)
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

  const handleModelSelect = (item: { label: string; value: ModelInfo }) => {
    const model = item.value;
    setSelectedModel(model);
    saveConfig({ model: model.id });
    setStep(2);
  };

  const handleExit = () => {
    onComplete();
    exit();
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

    const items = models.map(model => ({
      label: model.id,
      value: model
    }));

    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>Select AI Model</Text>
        <Newline />
        <Text>Showing {models.length} popular models (filtered from all available).</Text>
        <Text>Use ↑/↓ arrows to navigate, Enter to select:</Text>
        <Newline />
        <SelectInput
          items={items}
          onSelect={handleModelSelect}
        />
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
      <Text>Press any key to start using TurboDev...</Text>
      <Newline />
      <Text color="gray">Press 'q' to exit</Text>
    </Box>
  );
}