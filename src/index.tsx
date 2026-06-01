import { render } from 'ink';
import App from './ui/App.js';

const args = process.argv.slice(2);

if (args.includes('--setup')) {
  import('./ui/SetupWizard.js').then(({ default: SetupWizard }) => {
    render(<SetupWizard onComplete={() => process.exit(0)} />);
  });
} else {
  render(<App />);
}