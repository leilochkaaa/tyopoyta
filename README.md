# työpöytä — Espoo Live Sprints

**Meet over a real problem, not a CV.** Junction 2026 · City of Espoo challenge.

CVs are written by AI and read by AI. työpöytä turns Espoo's recruitment events into live 20-minute sprints: companies bring a real problem (or, for practical jobs, a hands-on *work taster*), participants pick the tables they want, and follow-ups happen only when both sides say yes.

## Run

```bash
npm install
npm run dev          # web on :5173, API on :8787
```

Keys go in `poyta/.env` or `junction/.env` (never committed):

| Variable | What it enables | Without it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Live Claude (`claude-opus-5-5`): company interview, job-seeker voice interview, skill extraction, shared summary | Scripted demo answers (header badge `AI demo`) |
| `ELEVENLABS_API_KEY` (+ optional `ELEVENLABS_VOICE_ID`, `ELEVENLABS_STT_MODEL`, `ELEVENLABS_TTS_MODEL`, `ELEVENLABS_BASE_URL` for EU residency) | ElevenLabs Scribe speech-to-text and natural voice for interview questions | Browser Web Speech API |
| `GEMINI_API_KEY` (+ optional `GEMINI_MODEL`, default `gemini-3.5-flash-lite`) | Live AI through Gemini when there is no Anthropic key | Scripted demo answers |
| `ORGANIZER_PASSWORD` | Password for the organiser workspace | Demo password `espoo2026`, shown on the login screen |
| `ELEVENLABS_ZERO_RETENTION=true` | ElevenLabs zero-retention mode (enterprise plans only) | Standard ElevenLabs retention |

Deploy anywhere that runs Docker (Render, Fly, Verda, …): `docker build -t tyopoyta . && docker run -p 8080:8080 --env-file .env tyopoyta. On Render, `render.yaml` sets it up: connect the repo, then fill in the keys`.

Production: `npm run build && npm start` (serves `dist/` + API on `$PORT`).

## Screens

| Route | What it shows |
|---|---|
| `#welcome` | Who are you? + demo tour |
| `#company` | 3-question AI interview (voice or text) → Challenge Card + follow-up promise, event day from the host's side |
| `#talent` | Voice interview → skills tied to quotes, pick 3 tables, self-declared must-haves, offline QR pass, event day (sprint → debrief → double opt-in → Sprint Record) |
| `#organizer` | Before: readiness, skills radar → invite companies / prepare people · Event day: blind lottery + fairness check · After: funnel to job |
| `#evidence` | Sourced numbers behind the design |
| `#trust` | EU AI Act design: what AI does, never does, data minimisation |

## Responsible AI

- AI only helps people **describe** (company needs, own experience, a recap). It never scores, ranks or filters individuals.
- Seat allocation is a deterministic blind lottery (`src/lib/seating.ts`) — it sees only codes and chosen tables.
- Pseudonymous codes until a mutual match; no CV, photo or birth date collected.
- All data is synthetic.
