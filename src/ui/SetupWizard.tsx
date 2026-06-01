import React, { useState, useEffect } from 'react';
import { Box, Text, Newline, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { saveConfig } from '../config/store.js';
import { fetchAvailableModels, ModelInfo } from '../llm/models.js';

interface Props {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: Props) {
  const { exit } = useApp();
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (step === 2) {
      if (key.return) {
        onComplete();
      } else if (key.escape || (key.ctrl && input === 'c')) {
        exit();
      } else if (input === 'q') {
        exit();
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
        setModels(fetchedModels);
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
        <Text>Choose the model you want to use:</Text>
        <Newline />
        <SelectInput
          items={items}
          onSelect={handleModelSelect}
        />
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