# Task 06: Setup Wizard

## Status

complete

## Wave

3

## Description

Implement a first-run setup wizard as an ink component that guides users through configuring TurboDev. The wizard asks for the OpenRouter API key, fetches available models from OpenRouter, lets the user select a model, and saves the configuration to `~/.turbodevrc`. This component will be shown when the user runs `turbodev` without existing configuration or when invoked with `--setup` flag.

## Dependencies

**Depends on:** task-02-config-store (loadConfig, saveConfig), task-04-llm-client (fetchAvailableModels)
**Blocks:** task-07-chat-ui (App component checks config and shows SetupWizard if needed)

**Context from dependencies:** Task-02 provides `loadConfig()` and `saveConfig()` functions. Task-04 provides `fetchAvailableModels()` that returns an array of models with id and name. The SetupWizard orchestrates these in a multi-step ink component.

## Files to Create

- `src/ui/SetupWizard.tsx` — Setup wizard ink component

## Files to Modify

- None

## Technical Details

### Implementation Steps

The SetupWizard is a multi-step wizard using ink components:
1. Step 1: API key input
2. Step 2: Fetch models and select model
3. Step 3: Confirmation and save

1. Import required ink components:
   - `Box`, `Text`, `Newline` from 'ink'
   - `TextInput` from 'ink-text-input'
   - `SelectInput` from 'ink-select-input'
   - `Spinner` from 'ink-spinner'
   - `useState`, `useEffect` from 'react'
   - `saveConfig` from config store
   - `fetchAvailableModels` from llm/models

2. Create component state:
   - `step` (number): current step (0 = API key, 1 = model selection, 2 = done)
   - `apiKey` (string): entered API key
   - `models` (ModelInfo[]): fetched models
   - `selectedModel` (string | undefined): selected model ID
   - `loading` (boolean): loading state for model fetch
   - `error` (string | null): error message
   - `onComplete` callback: called when setup is complete

3. Implement step rendering:
   - Step 0: Show welcome message, instructions for API key, TextInput for key entry, Enter to continue
   - Step 1: Show "Fetching models..." with spinner while loading, then SelectInput with model list, Enter to confirm
   - Step 2: Show success message, confirmation of saved config, press any key to continue

4. Handle API key submission:
   - Call `saveConfig({ apiKey })` to persist
   - Call `fetchAvailableModels(apiKey)` to get models
   - Transition to step 1

5. Handle model selection:
   - Call `saveConfig({ model: selectedModel })`
   - Transition to step 2 (completion)

6. Handle errors:
   - Show error message in red if API fetch fails
   - Allow retry with 'r' key or continue anyway

**Full src/ui/SetupWizard.tsx:**
```typescript
import React, { useState, useEffect } from 'react';
import { Box, Text, Newline, useApp } from 'ink';
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

  const handleModelSelect = (model: ModelInfo) => {
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
      <Box
        onKeyPress={(_input, key) => {
          if (key.return) {
            onComplete();
          } else if (key.escape || (key.ctrl && input === 'c')) {
            exit();
          } else if (input === 'q') {
            exit();
          }
        }}
        autoFocus
      />
    </Box>
  );
}
```

### Code Snippets

All code snippets are provided above in Implementation Steps.

### Environment Variables

- None

### API Endpoints

- `https://openrouter.ai/api/v1/models` — Fetched by task-04's fetchAvailableModels

## Acceptance Criteria

- [ ] SetupWizard shows welcome screen on render
- [ ] User can type API key and press Enter to submit
- [ ] Invalid API key shows error message
- [ ] After API key submission, models are fetched with loading spinner
- [ ] SelectInput displays available models from OpenRouter
- [ ] User can select a model and press Enter to confirm
- [ ] Configuration is saved to ~/.turbodevrc with both apiKey and model
- [ ] Completion screen shows confirmation of saved config
- [ ] Pressing Enter or any key after completion triggers `onComplete()` callback
- [ ] Error state displays error message and allows retry
- [ ] Component is renderable as an ink React component

## Notes

- The wizard is intentionally simple: API key → model selection → done
- Error handling focuses on network/API issues; invalid API keys are caught by OpenRouter
- The API key is partially masked in the confirmation screen for privacy
- The component is self-contained and doesn't depend on the chat UI
- When setup is complete, the parent (App component) will switch to the chat view
- The `useApp()` hook from ink provides access to exit functionality
- Models from OpenRouter have readable IDs like `anthropic/claude-3-haiku` which are used directly as display labels