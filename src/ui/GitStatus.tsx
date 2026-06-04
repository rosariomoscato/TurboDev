import { useState, useEffect } from 'react';
import { getGitStatus } from '../tools/git.js';
import type { GitStatusInfo } from '../tools/git.js';

export type { GitStatusInfo };

/**
 * React hook that polls git status for the given working directory.
 *
 * Refreshes every 5 seconds so the StatusBar always shows up-to-date
 * branch / dirty / staged / ahead-behind information.
 */
export function useGitStatus(cwd: string): GitStatusInfo {
  const [status, setStatus] = useState<GitStatusInfo>({
    branch: null,
    dirty: 0,
    staged: 0,
    ahead: 0,
    behind: 0,
    isRepo: false,
  });

  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      try {
        const info = await getGitStatus(cwd);
        if (mounted) setStatus(info);
      } catch {
        // Silently ignore — the repo might be temporarily unavailable
        // (e.g. mid-rebase). The next poll cycle will retry.
      }
    };

    // Initial fetch
    poll();

    // Poll every 5 seconds
    const interval = setInterval(poll, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [cwd]);

  return status;
}
