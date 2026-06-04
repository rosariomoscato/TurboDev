import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, Newline, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { checkGhAuth } from '../tools/github.js';

type WizardStep =
  | 'checking'
  | 'choose_method'
  | 'browser_login'
  | 'token_login'
  | 'verifying'
  | 'done'
  | 'error';

interface Props {
  onComplete: (authenticated: boolean) => void;
}

/**
 * GithubAuthWizard guides the user through GitHub CLI authentication.
 *
 * Flow:
 *  1. Check if `gh` is installed and already authenticated.
 *  2. If not authenticated, offer browser login, token login, or cancel.
 *  3. Execute the chosen auth method.
 *  4. Verify the result and call onComplete.
 */
export default function GithubAuthWizard({ onComplete }: Props) {
  const { exit } = useApp();

  const [step, setStep] = useState<WizardStep>('checking');
  const [username, setUsername] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [methodChoice, setMethodChoice] = useState<number>(0);

  // --- Step 1: Check gh auth status on mount ---
  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const status = await checkGhAuth();

        if (!mounted) return;

        if (!status.ghInstalled) {
          // gh CLI not installed at all
          setStep('error');
          setErrorMessage(
            'gh CLI is not installed. Install from https://cli.github.com',
          );
          return;
        }

        if (status.authenticated) {
          // Already authenticated — skip to done
          setUsername(status.username ?? null);
          setStep('done');
          return;
        }

        // Installed but not authenticated — let the user choose a method
        setStep('choose_method');
      } catch {
        if (!mounted) return;
        setStep('error');
        setErrorMessage('Failed to check GitHub authentication status.');
      }
    };

    check();
    return () => {
      mounted = false;
    };
  }, []);

  // --- Verification helper (re-used after every auth attempt) ---
  const verifyAuth = useCallback(async () => {
    setStep('verifying');
    try {
      const status = await checkGhAuth();
      if (status.authenticated) {
        setUsername(status.username ?? null);
        setStep('done');
      } else {
        setStep('error');
        setErrorMessage(
          'Authentication did not succeed. You can retry or cancel.',
        );
      }
    } catch {
      setStep('error');
      setErrorMessage(
        'Could not verify authentication. Please try again.',
      );
    }
  }, []);

  // --- Browser login: Ink cannot run interactive gh auth, so show instructions ---
  const startBrowserLogin = useCallback(() => {
    setStep('browser_login');
  }, []);

  // --- Run token-based login (pipe token to gh auth login --with-token) ---
  const startTokenLogin = useCallback(
    (token: string) => {
      setStep('verifying');

      const child = spawn('gh', ['auth', 'login', '--with-token'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (!child.stdin || !child.stderr) {
        setStep('error');
        setErrorMessage('Failed to open gh process streams.');
        return;
      }

      try {
        child.stdin.write(token);
        child.stdin.end();
      } catch {
        setStep('error');
        setErrorMessage('Failed to write token to gh process.');
        return;
      }

      let stderr = '';
      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          verifyAuth();
        } else {
          setStep('error');
          setErrorMessage(
            stderr.trim() ||
              `Token login failed (exit code ${code}). Check your token and try again.`,
          );
        }
      });

      child.on('error', (err) => {
        setStep('error');
        setErrorMessage(`Failed to run gh auth login: ${err.message}`);
      });
    },
    [verifyAuth],
  );

  // --- Global key input handler ---
  useInput((input, key) => {
    // Ctrl+C always exits the entire app
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }

    // Error screen — any key triggers onComplete(false)
    if (step === 'error') {
      // Allow retrying with 'r' (go back to choose_method)
      if (input === 'r') {
        setErrorMessage(null);
        setStep('choose_method');
        return;
      }
      // Any other key dismisses
      onComplete(false);
      return;
    }

    // Done screen — already authenticated or just became authenticated
    if (step === 'done') {
      if (key.return || key.escape || input === 'q') {
        onComplete(username !== null);
      }
      return;
    }

    // Choose method screen
    if (step === 'choose_method') {
      if (key.upArrow || input === 'k') {
        setMethodChoice((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow || input === 'j') {
        setMethodChoice((prev) => Math.min(2, prev + 1));
      } else if (key.return) {
        if (methodChoice === 0) {
          startBrowserLogin();
        } else if (methodChoice === 1) {
          setStep('token_login');
        } else {
          // Cancel
          onComplete(false);
        }
      } else if (key.escape) {
        onComplete(false);
      }
      return;
    }

    // Browser login in progress — Esc cancels back to method choice
    if (step === 'browser_login') {
      if (key.return || key.escape) {
        setStep('choose_method');
      }
      return;
    }

    // Token input screen — Esc goes back to method choice
    if (step === 'token_login') {
      if (key.escape) {
        setTokenInput('');
        setStep('choose_method');
      }
      return;
    }
  });

  // --- Token submission handler ---
  const handleTokenSubmit = () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) return;
    startTokenLogin(trimmed);
  };

  // --- Render ---

  // Checking initial auth status
  if (step === 'checking') {
    return (
      <Box flexDirection="column">
        <Text color="cyan">
          <Spinner type="dots" /> Checking GitHub authentication...
        </Text>
      </Box>
    );
  }

  // Choosing an authentication method
  if (step === 'choose_method') {
    const options = [
      'Login with web browser (gh auth login -w)',
      'Login with token (gh auth login --with-token)',
      'Cancel',
    ];

    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>
          GitHub Authentication
        </Text>
        <Newline />
        <Text>Options:</Text>
        {options.map((opt, i) => (
          <Box key={opt}>
            <Text color={methodChoice === i ? 'cyan' : 'gray'}>
              {methodChoice === i ? '>' : ' '} {i + 1}. {opt}
            </Text>
          </Box>
        ))}
        <Newline />
        <Text color="gray">
          {'↑/k ↓/j navigate · Enter select · Esc cancel'}
        </Text>
      </Box>
    );
  }

  // Browser login in progress
  if (step === 'browser_login') {
    return (
      <Box flexDirection="column">
        <Text color="yellow" bold>
          Browser login is not available inside TurboDev
        </Text>
        <Newline />
        <Text>To authenticate with your browser:</Text>
        <Newline />
        <Text color="cyan">  1. Exit TurboDev (type /exit)</Text>
        <Text color="cyan">  2. Run: gh auth login</Text>
        <Text color="cyan">  3. Follow the instructions in your browser</Text>
        <Text color="cyan">  4. Relaunch TurboDev</Text>
        <Newline />
        <Text color="gray">Press Enter to go back</Text>
      </Box>
    );
  }

  // Token input screen
  if (step === 'token_login') {
    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>
          GitHub Authentication — Token Login
        </Text>
        <Newline />
        <Text>Paste your GitHub Personal Access Token:</Text>
        <TextInput
          value={tokenInput}
          onChange={setTokenInput}
          onSubmit={handleTokenSubmit}
          placeholder="ghp_..."
          showCursor={false}
        />
        {tokenInput.length > 0 && (
          <Text color="gray">{'•'.repeat(tokenInput.length)}</Text>
        )}
        <Newline />
        <Text color="gray">
          Press Enter to submit · Esc to go back
        </Text>
      </Box>
    );
  }

  // Verifying after an auth attempt
  if (step === 'verifying') {
    return (
      <Box flexDirection="column">
        <Text color="cyan">
          <Spinner type="dots" /> Verifying authentication...
        </Text>
      </Box>
    );
  }

  // Error screen (gh not installed, auth failed, etc.)
  if (step === 'error') {
    return (
      <Box flexDirection="column">
        <Text color="red" bold>
          Error
        </Text>
        <Newline />
        <Text color="red">{errorMessage}</Text>
        <Newline />
        <Text color="gray">Press 'r' to retry · Any other key to go back</Text>
      </Box>
    );
  }

  // Done — successfully authenticated (or was already authenticated)
  if (username) {
    return (
      <Box flexDirection="column">
        <Text color="green" bold>
          Already authenticated as {username}
        </Text>
        <Newline />
        <Text color="gray">Press Enter to continue...</Text>
      </Box>
    );
  }

  // Fallback done state
  return (
    <Box flexDirection="column">
      <Text color="green" bold>
        GitHub Authentication Complete
      </Text>
      <Newline />
      <Text color="gray">Press Enter to continue...</Text>
    </Box>
  );
}
