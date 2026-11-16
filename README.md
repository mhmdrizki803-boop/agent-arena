# Agent Arena 🏟️

[![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg)](https://pollinations.ai/?ref=badge)

Several AI agents answer the **same prompt**. A judge model scores each answer.
You watch them compete — and every request is billed to **your own Pollen** (BYOP).

Built on [Pollinations](https://pollinations.ai) — dozens of models, one API.

## How a match works

1. **You write one prompt** — a spicy question works best ("Is a hot dog a sandwich?").
2. **You pick the agents** — up to 3 models, each from a different lab.
3. All agents answer **in parallel**.
4. A **judge model** scores every answer on clarity, correctness and directness (0–100).
5. Highest score wins. The full transcript stays on screen.

## Run it

Live: **https://mhmdrizki803-boop.github.io/agent-arena/**

Or clone and open `index.html` — no build step, no server.

```bash
git clone https://github.com/mhmdrizki803-boop/agent-arena.git
cd agent-arena && open index.html
```

## BYOP — Bring Your Own Pollen

No pasted keys. Click **Pollinations Connect**, approve a scoped key on the consent
screen (5 Pollen max, 7 days), and every agent turn plus the judge call is billed to
*your* account. Revoke any time from your Keys page.

A full 3-agent match is **4 chat completions**: 3 agents + 1 judge.

## Models

Agents and judge are selectable from the dropdown — all model IDs are real entries
from [`/models`](https://gen.pollinations.ai/models). Defaults are cheap flash-tier
models so a match costs a fraction of a Pollen.

## License

MIT
