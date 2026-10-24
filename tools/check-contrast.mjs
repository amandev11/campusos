/**
 * WCAG 2.2 AA contrast audit for the CampusOS design tokens.
 *
 * Reads the dark and light token blocks out of `src/styles/index.css`, resolves
 * translucent colours against the surface they actually sit on, and checks the
 * pairs the interface really renders. Glass materials are approximated by
 * compositing them over the page canvas — the layer beneath the ambient
 * gradients — which is the honest simplification available to a static check.
 *
 * Thresholds follow WCAG 1.4.3: 4.5:1 for normal text, 3:1 for large text and
 * for non-text UI such as focus indicators (1.4.11).
 *
 *   npm run check:contrast
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CSS = readFileSync(join(ROOT, 'src/styles/index.css'), 'utf8');

function themeBlock(selector) {
  const start = CSS.indexOf(selector);
  if (start === -1) throw new Error(`token block not found: ${selector}`);
  const open = CSS.indexOf('{', start);
  const close = CSS.indexOf('\n}', open);
  return CSS.slice(open + 1, close);
}

function parseTokens(source) {
  const tokens = new Map();
  for (const match of source.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    tokens.set(match[1], match[2].trim());
  }
  return tokens;
}

function toColor(value) {
  const text = String(value).trim();
  const rgba = text.match(/^rgba?\(([^)]+)\)$/);
  if (rgba) {
    const parts = rgba[1].split(',').map((part) => Number.parseFloat(part));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let channel = hex[1];
    if (channel.length === 3) channel = channel.split('').map((c) => c + c).join('');
    return {
      r: Number.parseInt(channel.slice(0, 2), 16),
      g: Number.parseInt(channel.slice(2, 4), 16),
      b: Number.parseInt(channel.slice(4, 6), 16),
      a: 1,
    };
  }
  return null;
}

/** `fg` painted over `bg` (source-over). */
function blend(fg, bg) {
  if (fg.a >= 1) return fg;
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  };
}

function luminance({ r, g, b }) {
  const channel = (value) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/**
 * Pairs the interface actually renders. `base` is where the background sits:
 * `canvas` for glass layers and page-wide surfaces, `surface` for badges and
 * anything drawn on a card.
 */
const CHECKS = [
  ['fg', 'canvas', 4.5, 'body copy on the page background', 'canvas'],
  ['fg', 'surface', 4.5, 'body copy on cards', 'surface'],
  ['fg', 'raised', 4.5, 'body copy on raised panels', 'surface'],
  ['fg', 'sunken', 4.5, 'body copy on sunken wells', 'surface'],
  ['fg-muted', 'canvas', 4.5, 'secondary copy on the page background', 'canvas'],
  ['fg-muted', 'surface', 4.5, 'secondary copy on cards', 'surface'],
  ['fg-muted', 'raised', 4.5, 'secondary copy on raised panels', 'surface'],
  ['fg-subtle', 'canvas', 4.5, 'metadata on the page background', 'canvas'],
  ['fg-subtle', 'surface', 4.5, 'metadata on cards', 'surface'],
  ['fg-subtle', 'raised', 4.5, 'metadata on raised panels', 'surface'],
  ['accent', 'canvas', 4.5, 'links on the page background', 'canvas'],
  ['accent', 'surface', 4.5, 'links and accents on cards', 'surface'],
  ['accent', 'raised', 4.5, 'links on raised panels', 'surface'],
  ['teal', 'canvas', 4.5, 'teal accents on the page background', 'canvas'],
  ['teal', 'surface', 4.5, 'teal accents on cards', 'surface'],
  ['danger', 'surface', 4.5, 'error copy on cards', 'surface'],
  ['warn', 'surface', 4.5, 'warning copy on cards', 'surface'],
  ['ok', 'surface', 4.5, 'success copy on cards', 'surface'],
  ['danger', 'danger-soft', 4.5, 'error copy inside its soft badge', 'surface'],
  ['warn', 'warn-soft', 4.5, 'warning copy inside its soft badge', 'surface'],
  ['ok', 'ok-soft', 4.5, 'success copy inside its soft badge', 'surface'],
  ['accent', 'accent-soft', 4.5, 'accent copy inside its soft badge', 'surface'],
  ['teal', 'teal-soft', 4.5, 'teal copy inside its soft badge', 'surface'],
  ['accent-ink', 'accent', 4.5, 'primary button label', 'surface'],
  ['teal-ink', 'teal', 4.5, 'teal button label', 'surface'],
  ['fg', 'glass-nav-bg', 4.5, 'navigation labels over nav glass', 'canvas'],
  ['fg-muted', 'glass-nav-bg', 4.5, 'navigation metadata over nav glass', 'canvas'],
  ['fg-subtle', 'glass-nav-bg', 4.5, 'navigation hints over nav glass', 'canvas'],
  ['fg', 'glass-panel-bg', 4.5, 'card copy over panel glass', 'canvas'],
  ['fg-muted', 'glass-panel-bg', 4.5, 'secondary copy over panel glass', 'canvas'],
  ['fg', 'glass-float-bg', 4.5, 'copy over floating glass', 'canvas'],
  ['fg', 'glass-modal-bg', 4.5, 'copy inside modal glass', 'canvas'],
  ['fg', 'glass-sheet-bg', 4.5, 'copy inside sheet glass', 'canvas'],
  ['fg', 'glass-input-bg', 4.5, 'input text', 'canvas'],
  ['fg-muted', 'glass-input-bg', 4.5, 'input placeholder text', 'canvas'],
  ['focus', 'canvas', 3, 'focus ring against the page background', 'canvas'],
  ['focus', 'surface', 3, 'focus ring against cards', 'surface'],
  ['focus', 'raised', 3, 'focus ring against raised panels', 'surface'],
  ['focus', 'glass-nav-bg', 3, 'focus ring inside navigation glass', 'canvas'],
];

const themes = [
  { name: 'dark', tokens: parseTokens(themeBlock(":root,\n[data-theme='dark'] {")) },
  { name: 'light', tokens: parseTokens(themeBlock("[data-theme='light'] {")) },
];

const failures = [];
let checked = 0;

for (const { name, tokens } of themes) {
  const canvas = toColor(tokens.get('--canvas'));
  const surface = toColor(tokens.get('--surface'));
  const bases = { canvas, surface };

  console.log(`\n${name} theme`);

  for (const [fgName, bgName, min, note, baseName] of CHECKS) {
    const rawBg = tokens.get(`--${bgName}`);
    const rawFg = tokens.get(`--${fgName}`);
    if (rawBg == null || rawFg == null) {
      failures.push(`[${name}] missing token --${rawBg == null ? bgName : fgName}`);
      continue;
    }

    const base = bases[baseName];
    const bg = toColor(rawBg);
    const fg = toColor(rawFg);
    if (!bg || !fg) {
      failures.push(`[${name}] --${bgName} / --${fgName} is not a plain colour`);
      continue;
    }

    const backdrop = blend(bg, base);
    const foreground = blend(fg, backdrop);
    const value = contrast(foreground, backdrop);
    checked += 1;

    if (value < min) {
      failures.push(
        `[${name}] --${fgName} on --${bgName} = ${value.toFixed(2)}:1, needs ${min}:1 — ${note}`,
      );
    }
    console.log(`  ${value >= min ? '✓' : '✗'} ${value.toFixed(2).padStart(6)}:1  ${fgName} on ${bgName} — ${note}`);
  }
}

console.log(`\n${checked} token pairs checked across both themes.`);
if (failures.length > 0) {
  console.log(`\n✗ ${failures.length} contrast failure(s):`);
  for (const failure of failures) console.log(`  ${failure}`);
  process.exitCode = 1;
} else {
  console.log('✓ contrast check passed (WCAG 2.2 AA)');
}
