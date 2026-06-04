import { render } from 'ink';
import path from 'node:path';
import App from './ui/App.js';

const args = process.argv.slice(2);

function getArgValue(name: string): string | null {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] || null;
}

const cwdOverride = getArgValue('--cwd') || process.env.TURBODEV_CWD;
if (cwdOverride) {
  process.chdir(path.resolve(cwdOverride));
}

if (args.includes('--setup')) {
  import('./ui/SetupWizard.js').then(({ default: SetupWizard }) => {
    render(<SetupWizard onComplete={() => process.exit(0)} />);
  });
} else {
  render(<App />);
}
