#!/usr/bin/env node
// Checks a lesson JSON file before it is written to the notebook.
// Usage: node first-grade-notebook/validate-lesson.mjs first-grade-notebook/lessons/2026-10-08-sh-sound.json
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const SHOW = {
  emoji: ['value'], word: ['value'], sentence: ['value'], hear: ['value'],
  count: ['emoji', 'n'], equation: ['value'], sequence: ['values'],
  clock: ['h', 'm'], shape: ['name'], blocks: ['n'], dots: ['a'],
};
const SHAPES = ['circle', 'oval', 'triangle', 'square', 'rectangle', 'rhombus', 'trapezoid', 'pentagon', 'hexagon', 'octagon'];
const ID = /^[A-Za-z0-9_\-.~:@+]{1,200}$/;

let failed = 0;
for (const file of process.argv.slice(2)) {
  const errs = [], warn = [];
  let L;
  try { L = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.error(`${file}: not valid JSON (${e.message})`); failed++; continue; }
  const id = L.id || basename(file, '.json');
  if (!ID.test(id)) errs.push(`id "${id}" may only use letters, digits and _ - . ~ : @ +`);
  if (!L.title) errs.push('missing title');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(L.date || '')) errs.push('date must be YYYY-MM-DD');
  if (!Array.isArray(L.items) || !L.items.length) errs.push('items must be a non-empty array');
  const ids = new Set();
  (L.items || []).forEach((it, i) => {
    const at = `item ${i + 1}${it.id ? ` (${it.id})` : ''}`;
    if (!it.id) errs.push(`${at}: missing id (ids keep her progress attached to the question)`);
    else if (ids.has(it.id)) errs.push(`${at}: duplicate id`);
    ids.add(it.id);
    const kind = it.kind || (Array.isArray(it.choices) && it.choices.length >= 2 ? 'choice' : 'card');
    if (!['choice', 'card', 'check'].includes(kind)) errs.push(`${at}: kind must be choice, card or check`);
    if (!it.prompt && !it.show && !it.text) errs.push(`${at}: needs a prompt, text or show`);
    for (const s of [].concat(it.show || [])) {
      if (!SHOW[s.type]) { errs.push(`${at}: unknown show type "${s.type}"`); continue; }
      for (const f of SHOW[s.type]) if (s[f] === undefined) errs.push(`${at}: show "${s.type}" needs "${f}"`);
      if (s.type === 'shape' && !SHAPES.includes(String(s.name).toLowerCase())) errs.push(`${at}: shape must be one of ${SHAPES.join(', ')}`);
      if (s.type === 'count' && !(s.n >= 0 && s.n <= 20)) errs.push(`${at}: count n must be 0–20`);
      if (s.type === 'blocks' && !(s.n >= 0 && s.n <= 99)) errs.push(`${at}: blocks n must be 0–99`);
    }
    if (kind === 'choice') {
      const texts = (it.choices || []).map(c => typeof c === 'object' ? c.text : String(c));
      if (texts.length < 2 || texts.length > 6) errs.push(`${at}: needs 2–6 choices`);
      if (new Set(texts).size !== texts.length) errs.push(`${at}: choices must be different`);
      if (texts.filter(t => t === it.answer).length !== 1) errs.push(`${at}: answer "${it.answer}" must match exactly one choice`);
      if (!it.explain) warn.push(`${at}: no explain (shown after a wrong answer)`);
    }
  });
  for (const w of warn) console.log(`${file}: warning: ${w}`);
  if (errs.length) { failed++; for (const e of errs) console.error(`${file}: ${e}`); }
  else console.log(`${file}: ok (${L.items.length} items)`);
}
process.exit(failed ? 1 : 0);
