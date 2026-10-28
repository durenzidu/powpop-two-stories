#!/usr/bin/env node
/**
 * Locale parity check for powpop-two-stories.
 *
 * The Chinese SKILL.md is canonical. Every file under locales/<lang>/SKILL.md
 * must describe exactly the same behaviour: same version, same tools, same
 * thresholds, same rule count, same hard numbers.
 *
 * Usage: node scripts/check-locales.mjs   (exit 0 = pass, 1 = drift)
 * No dependencies. Requires Node 16+.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_DIR = join(ROOT, 'skills', 'powpop-two-stories');
const CANON = join(SKILL_DIR, 'SKILL.md');

/** Tools the skill may call. Missing one in a translation means the translation is stale. */
const TOOLS = [
  'whoami',
  'geocode_place',
  'find_nearby',
  'get_post_detail',
  'prepare_post',
  'publish_post',
  'like_post',
];

/** Numbers that must appear in every locale: the data facts and thresholds. */
const NUMBERS = ['500', '1000', '657', '273', '97', '23%'];

/** Frontmatter keys every locale must carry. */
const REQUIRED_FM = ['name', 'description_en', 'description_zh', 'version', 'author'];

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return { fm: {}, body: text };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const hit = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (hit) fm[hit[1]] = hit[2].replace(/^['"]|['"]$/g, '').trim();
  }
  return { fm, body: text.slice(m[0].length) };
}

/** Count numbered hard rules inside the "硬规则 / Hard rules" section (heading number may shift). */
function countRules(body) {
  const m = body.match(/^##\s+[^\n]*(?:硬规则|Hard rules)[^\n]*$/m);
  if (!m) return -1;
  const rest = body.slice(m.index + m[0].length);
  const end = rest.search(/^##\s/m);
  const section = end === -1 ? rest : rest.slice(0, end);
  return (section.match(/^\d+\.\s+\*\*/gm) || []).length;
}

/** Count top-level sections (## N / ## 一 …) so translations don't drop a chapter. */
function countSections(body) {
  return (body.match(/^##\s+(?!语言)/gm) || []).length;
}

const problems = [];
const canonText = readFileSync(CANON, 'utf8');
const canon = parseFrontmatter(canonText);
const canonRules = countRules(canon.body);
const canonSections = countSections(canon.body);

if (canonRules < 1) problems.push(`canonical: could not read hard rules (got ${canonRules})`);

const localeRoot = join(SKILL_DIR, 'locales');
const langs = existsSync(localeRoot)
  ? readdirSync(localeRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
  : [];

if (langs.length === 0) problems.push('locales/: no language directories found');

const rows = [];
for (const lang of langs) {
  const file = join(localeRoot, lang, 'SKILL.md');
  if (!existsSync(file)) {
    problems.push(`${lang}: missing locales/${lang}/SKILL.md`);
    continue;
  }
  const text = readFileSync(file, 'utf8');
  const { fm, body } = parseFrontmatter(text);
  const rel = `locales/${lang}/SKILL.md`;

  for (const key of REQUIRED_FM) {
    if (!fm[key]) problems.push(`${rel}: frontmatter is missing "${key}"`);
  }
  if (fm.name && fm.name !== canon.fm.name) {
    problems.push(`${rel}: name="${fm.name}" but canonical is "${canon.fm.name}"`);
  }
  if (fm.version !== canon.fm.version) {
    problems.push(`${rel}: version ${fm.version || '(none)'} != canonical ${canon.fm.version}`);
  }
  if (fm.language && fm.language !== lang) {
    problems.push(`${rel}: language="${fm.language}" does not match directory "${lang}"`);
  }
  if (fm.canonical && !fm.canonical.includes('SKILL.md')) {
    problems.push(`${rel}: canonical should point at ../../SKILL.md`);
  }

  for (const tool of TOOLS) {
    if (!text.includes(tool)) problems.push(`${rel}: tool \`${tool}\` never mentioned`);
  }
  for (const n of NUMBERS) {
    if (!text.includes(n)) problems.push(`${rel}: hard number "${n}" missing`);
  }

  const rules = countRules(body);
  if (rules !== canonRules) {
    problems.push(`${rel}: ${rules} hard rules, canonical has ${canonRules}`);
  }
  const sections = countSections(body);
  if (sections !== canonSections) {
    problems.push(`${rel}: ${sections} top-level sections, canonical has ${canonSections}`);
  }

  rows.push({
    lang,
    version: fm.version || '-',
    rules,
    sections,
    bytes: Buffer.byteLength(text, 'utf8'),
  });
}

console.log(`canonical  zh-CN  v${canon.fm.version}  ${canonRules} rules  ${canonSections} sections  ${Buffer.byteLength(canonText, 'utf8')} B`);
for (const r of rows) console.log(`locale     ${r.lang.padEnd(6)} v${r.version}  ${r.rules} rules  ${r.sections} sections  ${r.bytes} B`);

if (problems.length) {
  console.log('\nDRIFT FOUND:');
  for (const p of problems) console.log('  - ' + p);
  process.exit(1);
}
console.log('\nOK: every locale matches the canonical skill.');
