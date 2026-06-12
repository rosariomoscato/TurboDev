import { loadAllSkills, formatSkillMetadata } from '../registry.js';
import { loadSkillInstructions, loadSkillResource, parseSkillMarkdown, loadSkillsFromDir } from '../loader.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const builtinDir = path.join(__dirname, '..', 'builtin');

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}`);
    failed++;
  }
}

console.log('=== Skills Module Tests ===\n');
console.log(`Builtin dir: ${builtinDir}`);
console.log(`Exists: ${fs.existsSync(builtinDir)}`);

console.log('\n--- Loader: parseSkillMarkdown ---');
const reactSkill = parseSkillMarkdown(path.join(builtinDir, 'react-component', 'SKILL.md'), 'builtin');
assert(reactSkill !== null, 'Parses valid react-component SKILL.md');
assert(reactSkill?.name === 'react-component', 'Name matches directory name');
assert(reactSkill?.instructions === null, 'Instructions are null (metadata only)');
assert(reactSkill?.source === 'builtin', 'Source is builtin');
assert(reactSkill?.enabled === true, 'Enabled by default');
assert(reactSkill?.metadata.description.length > 0, 'Description is non-empty');
assert(reactSkill?.metadata.description.length <= 1024, 'Description under 1024 chars');

const apiSkill = parseSkillMarkdown(path.join(builtinDir, 'api-endpoint', 'SKILL.md'), 'builtin');
assert(apiSkill !== null, 'Parses valid api-endpoint SKILL.md');
assert(apiSkill?.name === 'api-endpoint', 'Name matches directory name');

console.log('\n--- Loader: validation ---');
const tmpDir = path.join(os.tmpdir(), 'turbodev-test-skills');
const badNameDir = path.join(tmpDir, 'BAD-NAME');
fs.mkdirSync(badNameDir, { recursive: true });
fs.writeFileSync(path.join(badNameDir, 'SKILL.md'), '---\nname: BAD-NAME\ndescription: test\n---\nbody');
assert(parseSkillMarkdown(path.join(badNameDir, 'SKILL.md'), 'project') === null, 'Rejects uppercase name');

const noDescDir = path.join(tmpDir, 'no-desc');
fs.mkdirSync(noDescDir, { recursive: true });
fs.writeFileSync(path.join(noDescDir, 'SKILL.md'), '---\nname: no-desc\ndescription: \n---\nbody');
assert(parseSkillMarkdown(path.join(noDescDir, 'SKILL.md'), 'project') === null, 'Rejects empty description');

const mismatchDir = path.join(tmpDir, 'mismatch');
fs.mkdirSync(mismatchDir, { recursive: true });
fs.writeFileSync(path.join(mismatchDir, 'SKILL.md'), '---\nname: wrong-name\ndescription: A description\n---\nbody');
assert(parseSkillMarkdown(path.join(mismatchDir, 'SKILL.md'), 'project') === null, 'Rejects name != directory name');

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log('\n--- Loader: loadSkillInstructions ---');
if (reactSkill) {
  const loaded = loadSkillInstructions(reactSkill);
  assert(loaded.instructions !== null, 'Instructions loaded');
  assert(loaded.instructions!.length > 0, 'Instructions non-empty');
  assert(loaded.instructions!.includes('React'), 'Instructions contain relevant content');
  
  const loadedAgain = loadSkillInstructions(loaded);
  assert(loadedAgain.instructions === loaded.instructions, 'Idempotent loading');
}

console.log('\n--- Loader: loadSkillResource ---');
if (reactSkill) {
  const resource = loadSkillResource(reactSkill, '../nonexistent.md');
  assert(resource === null, 'Returns null for nonexistent resource');
  const traversal = loadSkillResource(reactSkill, '../../../etc/passwd');
  assert(traversal === null, 'Blocks path traversal');
}

console.log('\n--- Loader: loadSkillsFromDir ---');
const builtinSkills = loadSkillsFromDir(builtinDir, 'builtin');
assert(builtinSkills.length === 2, `Found 2 built-in skills (got ${builtinSkills.length})`);
assert(builtinSkills.every(s => s.source === 'builtin'), 'All skills have builtin source');

const emptySkills = loadSkillsFromDir('/nonexistent/path', 'project');
assert(emptySkills.length === 0, 'Returns empty for nonexistent directory');

console.log('\n--- Registry: loadAllSkills ---');
const allSkills = loadAllSkills(process.cwd());
assert(allSkills.length >= 2, `At least 2 skills found (got ${allSkills.length})`);
assert(allSkills.some(s => s.name === 'react-component'), 'react-component found');
assert(allSkills.some(s => s.name === 'api-endpoint'), 'api-endpoint found');

console.log('\n--- Registry: formatSkillMetadata ---');
const metadata = formatSkillMetadata(allSkills);
assert(metadata.length > 0, 'Metadata string is non-empty');
assert(metadata.includes('react-component:'), 'Contains react-component');
assert(metadata.includes('api-endpoint:'), 'Contains api-endpoint');
assert(metadata.startsWith('- '), 'Lines start with "- "');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
