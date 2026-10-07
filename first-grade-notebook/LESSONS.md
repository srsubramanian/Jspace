# First Grade Notebook: how lessons work

Live notebook: https://claude.ai/artifact/YZdnQqYQ8CVLR5jYKDta4S

The page is an empty player. It shows one lesson per day and one question at a time.
Every lesson is planned with the parent in chat, then written into the artifact's database by Claude.
The page records her answers and brings earlier questions back for review.

## Daily routine (for Claude)

1. **Look at progress first.** Read the `progress` and `stats/main` collections with `ArtifactData`.
   Check what she missed, what is due, and how yesterday went.
   Suggest a next step that builds on that, but the parent decides the topic.
2. **Write the lesson** as `first-grade-notebook/lessons/<id>.json`.
   The id is `YYYY-MM-DD-short-topic`, for example `2026-10-08-sh-sound`.
   Keep it to 6–10 items: 1–2 `card` items to teach, then questions.
3. **Validate it** with `node first-grade-notebook/validate-lesson.mjs first-grade-notebook/lessons/<id>.json`.
4. **Publish it** with `ArtifactData` `set`, using `collection: "lessons"`, `doc_id: <id>` and `file_path` pointing to the JSON file.
   Leave the `id` field out of the document body, or keep it equal to `doc_id`.
5. **Commit** the JSON file so the repo keeps a history of every lesson.
6. **Record the voice** (see [Voice](#voice-elevenlabs) below). Do this before step 4 when you can, so the lesson goes in once with its recordings.

Never edit `progress/*` or `stats/main` by hand. The page owns them.
Never change an item `id` after a lesson has been used, because her progress is keyed by it.

## Which lesson shows

The page shows the lesson with the latest `date` that is not after today.
A lesson dated tomorrow stays hidden until tomorrow, so you can prepare it the night before.
If no lesson was added today, she keeps seeing the most recent one.

After the lesson, up to `settings/main.review` (default 3) questions from earlier lessons come back if they are due.

## Spacing

Each question has a level from 0 to 5.

- A right first try moves it up a level and schedules it 1, 3, 7, 14 or 30 days out.
- A miss drops it 2 levels, brings it back tomorrow, and repeats it once at the end of today's lesson.
- A second right answer on the same day does not raise the level again.

## Lesson format

```json
{
  "title": "The sh sound",
  "date": "2026-10-08",
  "cover": "🐑",
  "items": [
    { "id": "learn-sh", "kind": "card", "prompt": "s and h together say “sh”, like when you say be quiet.",
      "show": { "type": "word", "value": "sh" } },
    { "id": "ship", "prompt": "Which sound does it start with?", "say": "Ship. Which sound does ship start with?",
      "show": { "type": "emoji", "value": "🚢", "caption": "ship" },
      "choices": ["sh", "ch", "th", "s"], "answer": "sh", "explain": "Ship starts with sh." },
    { "id": "read-shop", "kind": "check", "prompt": "Read this word to a grown-up.",
      "show": { "type": "word", "value": "shop" } }
  ]
}
```

### Item fields

| Field | Meaning |
|---|---|
| `id` | Required and unique in the lesson. Never rename it after use. |
| `kind` | `choice` is tap an answer, and is the default when there are choices. `card` teaches something and has a Next button. `check` is open practice: a grown-up taps “Got it” or “Not yet”. |
| `prompt` | Shown big and read aloud. |
| `say` | Optional. Different words to read aloud, for example to say the word when the picture shouldn't show it. |
| `text` | Optional second line of smaller text. |
| `show` | One picture or a list of up to 3 (see below). |
| `choices` | 2–6 strings, or `{ "text", "emoji", "say" }` objects for picture answers. They are shuffled each time. |
| `answer` | Must equal exactly one choice's text. |
| `explain` | Shown and read after a wrong answer. |

A lesson can also carry `audio`: a list of `{ "t": exact text, "f": "audio/<lessonId>/NN.mp3" }` written by `voice-lines.mjs --apply`.

### Show types

| type | fields | renders |
|---|---|---|
| `emoji` | `value`, `caption?` | a big picture |
| `word` | `value` | a big word |
| `sentence` | `value` | a sentence with a “Read it to me” button |
| `hear` | `value` | a “Hear it” button only, for listening and sight-word questions |
| `count` | `emoji`, `n` (0–20) | ten-frames filled with the emoji |
| `pairs` | `emoji`, `n` (0–20) | the emoji in partner pairs; an odd one out sits next to a dashed empty spot (odd and even, doubles) |
| `equation` | `value` like `"3 + 4 = ?"` (tokens separated by spaces) | a big equation; `?` becomes a dashed box |
| `sequence` | `values` like `["2","4","?","8"]` | number boxes |
| `clock` | `h` (1–12), `m` (0–59) | an analog clock |
| `shape` | `name` (circle, oval, triangle, square, rectangle, rhombus, trapezoid, pentagon, hexagon, octagon) | the shape |
| `blocks` | `n` (0–99) | base-ten rods and cubes |
| `dots` | `a`, plus `b` to add a second color, or `cross` to cross some out | dots for adding or taking away |

## Voice (ElevenLabs)

The parent chose the ElevenLabs voice **Jessica** (`voice_id` `cgSgspJ2msm6clMCkdW9`), model `eleven_multilingual_v2`, **one take per line** (`generations_count: 1`).
Recordings are published with the page as files under `audio/`. They are not kept in git (`audio/` is in `.gitignore`); the artifact holds them.
Any line without a recording falls back to the device voice.

1. `node first-grade-notebook/voice-lines.mjs first-grade-notebook/lessons/<id>.json` lists every line the page will say (`t`) and its file (`f`).
   The text must match exactly, so always take it from this script.
2. Record each line with the ElevenLabs connector's `creative_generate_speech`, in the flow "First Grade Notebook – voice lines" (`W3SvrtMFoK0PZehdq4BG`).
   Poll `creative_get_flow_run_status`, then download each `content_url` to `first-grade-notebook/<f>`. The links expire after 2 hours.
3. `node first-grade-notebook/voice-lines.mjs first-grade-notebook/lessons/<id>.json --apply` adds an `audio` list to the lesson for the files that exist.
4. Publish `index.html` with `files` mapping each new `audio/...` path to its local file.
   Files from earlier lessons stay published automatically. Never pass `null` for them.
5. Write the lesson to the database (step 4 of the routine; pass `if_version` if it already exists).

`node first-grade-notebook/voice-lines.mjs --common` lists the shared lines (cheers, "Remember these?", "All done!").
When one of them is recorded, also add it to `COMMON_AUDIO` in `index.html`.

**Status (2026-10-07):** ElevenLabs disabled the account's free tier partway through recording ("unusual activity… upgrade to a paid subscription").
Still unrecorded: Odd and Even lines 04, 09, 10, 12 and 13, and the cheers "Yes!", "You got it!" and "Nice work!".

## Other documents

- `settings/main`: `{ "review": 3 }`. The parent can also change it on the Grown-ups page.
- `progress/<lessonId>` (written by the page): `{ title, runs, last, score, total, best, items: { <itemId>: { b, due, r, w, last } } }`.
  Here `b` is the level, `r` and `w` count right and wrong first tries, and `due` is the next review date.
- `stats/main` (written by the page): `{ days: [...], recent: [{ at, l, r, n, done }] }`.
