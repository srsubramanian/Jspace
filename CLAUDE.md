# Jspace

`first-grade-notebook/` is a learning notebook for the user's first grader, published as a claude.ai artifact.
It is a blank, one-lesson-at-a-time player. Each day's lesson is planned with the parent and written into the artifact's database.

Before planning or writing a lesson, read `first-grade-notebook/LESSONS.md`.
It covers the routine, the lesson format and the validator.
Past lessons live in `first-grade-notebook/lessons/`.

`times-tables/` is a separate, standalone voice page for the user's 4th grader: 20 timed times-table questions answered out loud
(the browser's speech recognition; claude.ai artifacts can't use the microphone on this account). It adapts to slow facts on its own,
keeps progress in that device's localStorage, and has a "Copy results for Claude" button whose text the parent pastes into chat.
It is served by GitHub Pages from this repo's default branch at https://srsubramanian.github.io/Jspace/times-tables/.
