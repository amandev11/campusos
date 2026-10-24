/**
 * Static markup guard.
 *
 * Nested interactive elements — an `<a>` inside an `<a>`, or a `<button>` inside
 * an `<a>` — are invalid HTML: browsers silently split the markup, keyboard focus
 * order breaks and screen readers announce the wrong thing. React only warns at
 * runtime, and only for the routes a test happens to visit.
 *
 * This scans every component file, works out which components render a link of
 * their own, and fails when one of them is used inside another link. Use
 * `StretchedLink` from `@/features/shared` for cards whose whole surface should
 * be clickable.
 *
 *   npm run check:markup
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

const LINK_TAGS = new Set(['Link', 'NavLink', 'a']);
const INTERACTIVE_TAGS = new Set(['button', 'select', 'textarea', 'input']);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx$/.test(full)) out.push(full);
  }
  return out;
}

const files = walk(SRC).sort();

/** Span of a JSX element starting at `start`, matching nested same-name tags. */
function elementSpan(source, name, start) {
  const isAnchorName = name === 'a';
  const open = new RegExp(`<${isAnchorName ? 'a' : name}\\b`, 'g');
  const tag = new RegExp(`</?${isAnchorName ? 'a' : name}\\b`, 'g');
  let depth = 0;
  let cursor = start;
  for (;;) {
    tag.lastIndex = cursor;
    const match = tag.exec(source);
    if (!match) return null;
    if (match[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) return { start, open, end: match.index };
    } else {
      depth += 1;
    }
    cursor = match.index + match[0].length;
  }
}

/** Names of components that render a link somewhere inside their own body. */
const linkComponents = new Set();

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/export function ([A-Z][A-Za-z0-9]*)/g)) {
    const name = match[1];
    const bodyStart = match.index;
    const nextExport = source.indexOf('\nexport ', bodyStart + 1);
    const body = source.slice(bodyStart, nextExport === -1 ? source.length : nextExport);
    if (/<Link\b|<NavLink\b|<a\s|<StretchedLink\b/.test(body)) linkComponents.add(name);
  }
  for (const match of source.matchAll(/export const ([A-Z][A-Za-z0-9]*) = \(/g)) {
    const nextExport = source.indexOf('\nexport ', match.index + 1);
    const body = source.slice(match.index, nextExport === -1 ? source.length : nextExport);
    if (/<Link\b|<NavLink\b|<StretchedLink\b/.test(body)) linkComponents.add(match[1]);
  }
  // Components imported from elsewhere that we know render links.
  if (/<SaveButton\b/.test(source)) linkComponents.add('SaveButton');
}

const violations = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');

  for (const name of [...LINK_TAGS, ...INTERACTIVE_TAGS]) {
    const pattern = new RegExp(`<${name}\\b`, 'g');
    for (const match of source.matchAll(pattern)) {
      const span = elementSpan(source, name, match.index);
      if (!span) continue;
      const inner = source.slice(span.start, span.end);
      const line = source.slice(0, span.start).split('\n').length;

      // A link inside a link.
      if (LINK_TAGS.has(name)) {
        for (const nested of inner.matchAll(/<([A-Za-z][A-Za-z0-9]*)\b/g)) {
          const child = nested[1];
          if (child === name) continue;
          if (LINK_TAGS.has(child)) {
            violations.push({
              file,
              line,
              message: `<${child}> nested inside <${name}>`,
            });
          } else if (linkComponents.has(child) && child !== 'StretchedLink') {
            violations.push({
              file,
              line,
              message: `<${child}> renders its own link, nested inside <${name}>`,
            });
          }
        }
      }

      // Button or form control inside a link.
      if (LINK_TAGS.has(name)) {
        for (const nested of inner.matchAll(/<([A-Za-z][A-Za-z0-9]*)\b/g)) {
          const child = nested[1];
          if (INTERACTIVE_TAGS.has(child)) {
            violations.push({ file, line, message: `<${child}> nested inside <${name}>` });
          } else if (child === 'Button' || child === 'IconButton') {
            violations.push({
              file,
              line,
              message: `<${child}> nested inside <${name}>`,
            });
          }
        }
      }
    }
  }
}

const unique = [...new Map(violations.map((v) => [`${v.file}:${v.line}:${v.message}`, v])).values()];

if (unique.length === 0) {
  console.log(`✓ markup check passed (${files.length} component files scanned)`);
} else {
  console.log(`✗ ${unique.length} nested interactive element(s):`);
  for (const violation of unique) {
    console.log(`  ${relative(ROOT, violation.file)}:${violation.line} — ${violation.message}`);
  }
  process.exitCode = 1;
}
