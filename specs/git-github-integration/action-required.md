# Action Required: Git/GitHub Integration

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Install `simple-git` dependency** — Run `npm install simple-git` to add the Git library. The agent creating the git tool file will reference this import.
- [ ] **Ensure `gh` CLI is available** — The GitHub tool wraps `gh`. If developing on a machine without `gh`, the GitHub tool operations will return errors gracefully. No pre-installation required for development, but needed for testing GitHub features.

## After Implementation

- [ ] **Test git tool manually** — Open TurboDev, type `/git status` and `/git log` to verify the git tool works in your project
- [ ] **Test github auth wizard** — Type `/gh auth` and verify the wizard guides through `gh auth login`
- [ ] **Test slash commands** — Try `/commit`, `/push`, `/branch` to verify the full workflow
- [ ] **Run build** — Execute `npm run build` to verify no TypeScript errors

---

> These tasks are also referenced in context within the relevant task files.
