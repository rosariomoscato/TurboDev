import React, { useState, useMemo } from 'react';
import { Box, Text, Newline, useInput } from 'ink';
import path from 'path';
import {
  detectProjectType,
  getAvailableSections,
  generateTemplate,
  generateSectionContent,
  ProjectInfo,
} from '../context/agents-template.js';
import {
  agentsMdExists,
  writeAgentsMd,
  appendToAgentsMd,
} from '../context/agents-md.js';

type WizardStep = 'detecting' | 'choose-mode' | 'select-sections' | 'done';

interface Props {
  cwd: string;
  onComplete: () => void;
}

export default function InitWizard({ cwd, onComplete }: Props) {
  const projectInfo = useMemo(() => detectProjectType(cwd), [cwd]);
  const allSections = useMemo(() => getAvailableSections(), []);

  const exists = useMemo(() => agentsMdExists(cwd), [cwd]);

  const [step, setStep] = useState<WizardStep>(
    exists ? 'choose-mode' : 'select-sections'
  );
  const [mode, setMode] = useState<'overwrite' | 'append'>('overwrite');
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    () => new Set(allSections.filter((s) => s.default).map((s) => s.id))
  );
  const [cursor, setCursor] = useState(0);
  const [filePath, setFilePath] = useState('');

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      onComplete();
      return;
    }

    if (step === 'choose-mode') {
      if (key.upArrow || input === 'k') {
        setCursor(0);
      } else if (key.downArrow || input === 'j') {
        setCursor(1);
      } else if (key.return) {
        setMode(cursor === 0 ? 'overwrite' : 'append');
        setCursor(0);
        setStep('select-sections');
      } else if (key.escape || input === 'q') {
        onComplete();
      }
      return;
    }

    if (step === 'select-sections') {
      if (key.upArrow || input === 'k') {
        setCursor((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow || input === 'j') {
        setCursor((prev) => Math.min(allSections.length - 1, prev + 1));
      } else if (input === ' ') {
        setSelectedSections((prev) => {
          const next = new Set(prev);
          const sectionId = allSections[cursor].id;
          if (next.has(sectionId)) {
            next.delete(sectionId);
          } else {
            next.add(sectionId);
          }
          return next;
        });
      } else if (key.return && selectedSections.size > 0) {
        handleGenerate();
      } else if (key.escape || input === 'q') {
        onComplete();
      }
      return;
    }

    if (step === 'done') {
      if (key.return || key.escape || input === 'q') {
        onComplete();
      }
    }
  });

  const handleGenerate = () => {
    const sectionIds = Array.from(selectedSections);
    const template = generateTemplate(sectionIds, projectInfo);

    if (mode === 'append' && exists) {
      const newSectionsOnly = sectionIds
        .map((id) => generateSectionContent(id, projectInfo))
        .filter(Boolean);
      appendToAgentsMd(cwd, '\n\n' + newSectionsOnly.join('\n\n'));
    } else {
      writeAgentsMd(cwd, template);
    }

    setFilePath(path.join(cwd, 'AGENTS.md'));
    setStep('done');
  };

  if (step === 'detecting') {
    return (
      <Box flexDirection="column">
        <Text color="cyan">Detecting project type...</Text>
      </Box>
    );
  }

  if (step === 'choose-mode') {
    return (
      <Box flexDirection="column">
        <Text color="yellow" bold>
          AGENTS.md already exists in this project.
        </Text>
        <Newline />
        <Text>What would you like to do?</Text>
        <Newline />
        <Box>
          <Text color={cursor === 0 ? 'cyan' : 'gray'}>
            {cursor === 0 ? '>' : ' '} 1. Overwrite completely (start fresh)
          </Text>
        </Box>
        <Box>
          <Text color={cursor === 1 ? 'cyan' : 'gray'}>
            {cursor === 1 ? '>' : ' '} 2. Append new sections to existing file
          </Text>
        </Box>
        <Newline />
        <Text color="gray">
          ↑/k ↓/j navigate · Enter select · Esc cancel
        </Text>
      </Box>
    );
  }

  if (step === 'select-sections') {
    const detectedLabel =
      projectInfo.type !== 'unknown'
        ? `${projectInfo.language} detected`
        : 'Unknown project type';

    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>
          Initialize AGENTS.md
        </Text>
        <Newline />
        <Text color="green">{detectedLabel}</Text>
        {projectInfo.frameworks.length > 0 && (
          <Text color="gray">
            {' '}
            · Frameworks: {projectInfo.frameworks.join(', ')}
          </Text>
        )}
        <Newline />
        <Text>Select sections to include:</Text>
        <Newline />
        {allSections.map((section, index) => {
          const isSelected = selectedSections.has(section.id);
          const isHighlighted = index === cursor;
          return (
            <Box key={section.id}>
              <Text
                color={isHighlighted ? 'cyan' : undefined}
                bold={isHighlighted}
              >
                {isHighlighted ? '>' : ' '}{' '}
                [{isSelected ? 'x' : ' '}] {section.label}
              </Text>
            </Box>
          );
        })}
        <Newline />
        <Text color="gray">
          ↑/k ↓/j navigate · Space toggle · Enter confirm · Esc cancel
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green" bold>
        AGENTS.md created successfully!
      </Text>
      <Newline />
      <Text>File: {filePath}</Text>
      <Text color="gray">
        Sections: {Array.from(selectedSections).join(', ')}
      </Text>
      <Newline />
      <Text>Press Enter to continue...</Text>
    </Box>
  );
}
