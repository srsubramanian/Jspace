#!/usr/bin/env node
// Lists the lines the notebook will speak for a lesson, so each can be recorded in the ElevenLabs voice.
//   node first-grade-notebook/voice-lines.mjs lessons/<id>.json            -> [{t, f}] still to record
//   node first-grade-notebook/voice-lines.mjs --common                     -> shared lines (cheers, review, all done)
//   node first-grade-notebook/voice-lines.mjs lessons/<id>.json --apply    -> writes "audio" into the lesson for files that exist
// Text must match what index.html says exactly, so these rules mirror it.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const page = readFileSync(join(here, 'index.html'), 'utf8');
const recorded = new Map(Function('return ' + page.match(/const COMMON_AUDIO = (\[[\s\S]*?\n\]);/)[1])());
const praise = Function('return ' + page.match(/const PRAISE = (\[.*?\]);/)[1])();
const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const common = [...praise, 'Remember these? A few questions from before.', 'All done! Great work today. See you tomorrow!']
  .map(t => [t, recorded.get(t) || `audio/common/${slug(t)}.mp3`, recorded.has(t)]);
const commonTexts = new Set(common.map(c => c[0]));

const args = process.argv.slice(2);
if (args.includes('--common')) {
  // "inPage": already listed in COMMON_AUDIO; add newly recorded ones there by hand
  console.log(JSON.stringify(common.map(([t, f, inPage]) => ({ t, f, have: existsSync(join(here, f)), inPage })), null, 2));
  process.exit(0);
}
const file = args.find(a => a.endsWith('.json'));
if (!file) { console.error('usage: voice-lines.mjs <lesson.json> [--apply] | --common'); process.exit(2); }
const L = JSON.parse(readFileSync(file, 'utf8'));
const id = L.id || basename(file, '.json');

const texts = [];
const add = t => { if (typeof t === 'string' && t && !commonTexts.has(t) && !texts.includes(t)) texts.push(t); };
for (const it of L.items) {
  const choices = (it.choices || []).map(c => typeof c === 'object' ? c.text : String(c));
  const kind = it.kind === 'card' || it.kind === 'check' ? it.kind : choices.length >= 2 ? 'choice' : 'card';
  add(it.say || it.prompt);
  if (kind === 'choice' && choices.filter(c => c === it.answer).length === 1) add('Not quite. ' + (it.explain || `The answer is ${it.answer}.`));
  for (const s of [].concat(it.show || [])) if (s && (s.type === 'sentence' || s.type === 'hear')) add(String(s.value));
}
const lines = texts.map((t, i) => ({ t, f: `audio/${id}/${String(i + 1).padStart(2, '0')}.mp3` }));

if (args.includes('--apply')) {
  const have = lines.filter(l => existsSync(join(here, l.f)));
  L.audio = have.map(({ t, f }) => ({ t, f }));
  writeFileSync(file, JSON.stringify(L, null, 2) + '\n');
  console.log(`${file}: audio for ${have.length} of ${lines.length} lines`);
} else {
  console.log(JSON.stringify(lines.map(l => ({ ...l, have: existsSync(join(here, l.f)) })), null, 2));
}
