import fs from "fs";
import path from "path";

export interface ProjectInfo {
  type: "node" | "python" | "rust" | "go" | "unknown";
  language: string;
  packageManager: string;
  scripts: Record<string, string>;
  frameworks: string[];
  hasLintConfig: boolean;
  hasTestFramework: boolean;
  testCommand: string;
  readmeContent: string | null;
}

const NODE_FRAMEWORKS = [
  "react",
  "next",
  "express",
  "vue",
  "svelte",
  "angular",
  "fastify",
  "nestjs",
  "hono",
];

const NODE_LINT_FILES = [
  ".eslintrc",
  ".eslintrc.js",
  ".eslintrc.json",
  ".eslintrc.yml",
  "biome.json",
  ".prettierrc",
];

const NODE_TEST_FRAMEWORKS = ["jest", "vitest", "mocha"];

function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function detectNodeProject(cwd: string): ProjectInfo {
  const packageJsonPath = path.join(cwd, "package.json");
  const raw = readFileSafe(packageJsonPath);
  const pkg = raw ? JSON.parse(raw) : {};

  const scripts: Record<string, string> = pkg.scripts ?? {};

  const deps: Record<string, string> = pkg.dependencies ?? {};
  const devDeps: Record<string, string> = pkg.devDependencies ?? {};
  const allDeps = { ...deps, ...devDeps };

  const frameworks = NODE_FRAMEWORKS.filter((fw) => fw in allDeps);

  let packageManager = "npm";
  if (fileExists(path.join(cwd, "pnpm-lock.yaml"))) {
    packageManager = "pnpm";
  } else if (fileExists(path.join(cwd, "yarn.lock"))) {
    packageManager = "yarn";
  } else if (fileExists(path.join(cwd, "bun.lockb"))) {
    packageManager = "bun";
  }

  const hasLintConfig = NODE_LINT_FILES.some((f) =>
    fileExists(path.join(cwd, f)),
  );

  const testFramework = NODE_TEST_FRAMEWORKS.find((tf) => tf in allDeps);
  const hasTestFramework = testFramework !== undefined;

  let testCommand = "";
  if (scripts.test && scripts.test !== "echo \\\"Error: no test specified\\\" && exit 1") {
    testCommand = `npm test`;
  } else if (testFramework === "vitest") {
    testCommand = "npx vitest run";
  } else if (testFramework === "jest") {
    testCommand = "npx jest";
  } else if (testFramework === "mocha") {
    testCommand = "npx mocha";
  } else {
    testCommand = "npm test";
  }

  const readmePath = path.join(cwd, "README.md");
  const readmeRaw = readFileSafe(readmePath);
  const readmeContent = readmeRaw
    ? readmeRaw.slice(0, 500)
    : null;

  return {
    type: "node",
    language: "TypeScript/JavaScript",
    packageManager,
    scripts,
    frameworks,
    hasLintConfig,
    hasTestFramework,
    testCommand,
    readmeContent,
  };
}

function detectPythonProject(cwd: string): ProjectInfo {
  let packageManager = "pip";
  if (fileExists(path.join(cwd, "uv.lock"))) {
    packageManager = "uv";
  }

  const pyprojectRaw = readFileSafe(path.join(cwd, "pyproject.toml"));
  const requirementsRaw = readFileSafe(path.join(cwd, "requirements.txt"));

  const combined = `${pyprojectRaw ?? ""}\n${requirementsRaw ?? ""}`;

  const hasTestFramework = /pytest/.test(combined);

  const hasLintConfig =
    /ruff/.test(pyprojectRaw ?? "") ||
    fileExists(path.join(cwd, ".flake8"));

  const testCommand = hasTestFramework ? "pytest" : "python -m pytest";

  const readmePath = path.join(cwd, "README.md");
  const readmeRaw = readFileSafe(readmePath);
  const readmeContent = readmeRaw ? readmeRaw.slice(0, 500) : null;

  return {
    type: "python",
    language: "Python",
    packageManager,
    scripts: {},
    frameworks: [],
    hasLintConfig,
    hasTestFramework,
    testCommand,
    readmeContent,
  };
}

function detectRustProject(cwd: string): ProjectInfo {
  const readmePath = path.join(cwd, "README.md");
  const readmeRaw = readFileSafe(readmePath);
  const readmeContent = readmeRaw ? readmeRaw.slice(0, 500) : null;

  return {
    type: "rust",
    language: "Rust",
    packageManager: "cargo",
    scripts: {},
    frameworks: [],
    hasLintConfig: true,
    hasTestFramework: true,
    testCommand: "cargo test",
    readmeContent,
  };
}

function detectGoProject(cwd: string): ProjectInfo {
  const readmePath = path.join(cwd, "README.md");
  const readmeRaw = readFileSafe(readmePath);
  const readmeContent = readmeRaw ? readmeRaw.slice(0, 500) : null;

  const hasLintConfig = fileExists(path.join(cwd, ".golangci.yml"));

  return {
    type: "go",
    language: "Go",
    packageManager: "go",
    scripts: {},
    frameworks: [],
    hasLintConfig,
    hasTestFramework: true,
    testCommand: "go test ./...",
    readmeContent,
  };
}

export function detectProjectType(cwd: string): ProjectInfo {
  if (fileExists(path.join(cwd, "package.json"))) {
    return detectNodeProject(cwd);
  }
  if (
    fileExists(path.join(cwd, "pyproject.toml")) ||
    fileExists(path.join(cwd, "requirements.txt")) ||
    fileExists(path.join(cwd, "setup.py"))
  ) {
    return detectPythonProject(cwd);
  }
  if (fileExists(path.join(cwd, "Cargo.toml"))) {
    return detectRustProject(cwd);
  }
  if (fileExists(path.join(cwd, "go.mod"))) {
    return detectGoProject(cwd);
  }
  return {
    type: "unknown",
    language: "Unknown",
    packageManager: "",
    scripts: {},
    frameworks: [],
    hasLintConfig: false,
    hasTestFramework: false,
    testCommand: "",
    readmeContent: null,
  };
}

export function getAvailableSections(): Array<{
  id: string;
  label: string;
  default: boolean;
}> {
  return [
    { id: "overview", label: "Project Overview", default: true },
    { id: "setup", label: "Setup Commands", default: true },
    { id: "style", label: "Code Style", default: true },
    { id: "testing", label: "Testing Instructions", default: true },
    { id: "design", label: "Design", default: false },
    { id: "security", label: "Security Considerations", default: false },
    { id: "deployment", label: "Deployment Notes", default: false },
  ];
}

export function generateSectionContent(
  section: string,
  projectInfo: ProjectInfo,
): string {
  switch (section) {
    case "overview": {
      let content = "## Project Overview\n\n<!-- Describe your project here -->";
      if (projectInfo.readmeContent) {
        content += `\n\n> ${projectInfo.readmeContent}`;
      }
      return content;
    }
    case "setup": {
      const lines: string[] = ["## Setup Commands\n"];
      if (projectInfo.type === "node") {
        lines.push(
          `- Install dependencies: \`${projectInfo.packageManager} install\``,
        );
        if (projectInfo.scripts.dev) {
          lines.push(
            `- Start dev server: \`${projectInfo.packageManager} run dev\``,
          );
        }
        if (projectInfo.scripts.build) {
          lines.push(
            `- Build: \`${projectInfo.packageManager} run build\``,
          );
        }
        if (projectInfo.scripts.start) {
          lines.push(
            `- Start: \`${projectInfo.packageManager} run start\``,
          );
        }
      } else if (projectInfo.type === "python") {
        const installCmd =
          projectInfo.packageManager === "uv"
            ? "uv pip install -e ."
            : "pip install -r requirements.txt";
        lines.push(`- Install dependencies: \`${installCmd}\``);
      } else if (projectInfo.type === "rust") {
        lines.push("- Build: `cargo build`");
      } else if (projectInfo.type === "go") {
        lines.push("- Install dependencies: `go mod download`");
      } else {
        lines.push("<!-- Add setup commands here -->");
      }
      return lines.join("\n");
    }
    case "style": {
      let content = "## Code Style\n\n<!-- Add your code style guidelines here -->";
      if (projectInfo.hasLintConfig) {
        content +=
          "\n- Linting is configured (run lint checks before committing)";
      }
      return content;
    }
    case "testing": {
      const testCmd = projectInfo.testCommand || "<add test command>";
      return [
        "## Testing Instructions",
        "",
        `- Run tests: \`${testCmd}\``,
        "- Fix any test failures before committing",
      ].join("\n");
    }
    case "design": {
      return [
        "## Design",
        "",
        "<!-- Describe your design system, UI patterns, color palette, typography, and component conventions here -->",
      ].join("\n");
    }
    case "security": {
      return [
        "## Security Considerations",
        "",
        "<!-- Add security notes here -->",
        "- Never commit secrets or API keys",
        "- Review dependencies for known vulnerabilities",
      ].join("\n");
    }
    case "deployment": {
      return "## Deployment Notes\n\n<!-- Add deployment instructions here -->";
    }
    default:
      return "";
  }
}

export function generateTemplate(
  sections: string[],
  projectInfo: ProjectInfo,
): string {
  const header = "# AGENTS.md\n";
  const body = sections
    .map((section) => generateSectionContent(section, projectInfo))
    .filter((content) => content.length > 0)
    .join("\n\n");
  return header + "\n" + body + "\n";
}
