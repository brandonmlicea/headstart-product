# Headstart product: agent guide

This repo is a template for the private side of a healthcare startup: a signed-in app with an assistant people can type to, talk to and show photos (a rash, a pill bottle, a worksheet, handwriting). Every word it shows and every secret it needs is a blank in `blanks.json`. It will not build until each blank holds a real answer. Never type copy into a component: fill the blank.

## The loop

1. `./fill list` shows the blanks still REQUIRED: key, what to write (`ask`), a hint, the kind and the length limit. MCP tool: `blanks`.
2. Write every answer into one JSON file of `{"key": "value"}` and run `./fill --from answers.json`. MCP tool: `fill`.
3. Rejected answers come back with the reason. Generic filler (Lorem ipsum, John Doe, Acme, example.com, TBD, TODO, "optional", "REQUIRED:", `{{...}}`) is refused. Write the real thing, or ask the person.
4. `./fill check` until it prints `ready`. `pnpm build` runs the same check first.
5. `pnpm dev`, open http://localhost:5173 and answer the welcome questions. Running both sites locally, set `link.landing` to `http://localhost:4321`.
6. `pnpm check` runs the blanks check plus `react-router typegen` and `tsc`.

`/brand` (palette in every format and the contrast table) is linked from the rail only in `pnpm dev`; it stays reachable by URL in production.

## Secrets

Blanks under `env.*` are written to `.env` (git-ignored), never to `blanks.json`:

| Blank | .env | What |
| --- | --- | --- |
| `env.base` | `AI_BASE_URL` | An OpenAI-compatible API base ending in `/v1` |
| `env.key` | `AI_API_KEY` | Its key |
| `env.model` | `AI_MODEL` | A chat model that also reads images |
| `env.transcribe` | `AI_TRANSCRIBE_MODEL` | A speech-to-text model served at `/audio/transcriptions` |

`pnpm dev` and `pnpm start` both read `.env` on every request, so a changed key takes effect without a restart. In production set the same names as environment variables instead. Until they are set, the chat prints exactly which blank is missing.

## Welcome (onboarding)

There is no passcode. `/welcome` asks a first-time visitor six short steps, all written as blanks: `onboard.title` and `onboard.body` (welcome), `onboard.name` (their name), `onboard.1.*` (pick one), `onboard.2.*` (pick any), `onboard.3.*` (pick one), then `onboard.done` with the safety line (`assistant.disclaimer`) they must tick. The answers live in an `__profile` cookie (`app/lib/env.server.ts`): the shell sends anyone without it to `/welcome`, `/api/chat` and `/api/transcribe` refuse requests without it, and `/api/chat` adds the answers to the system prompt. The rail's name row reopens the answers; Start over clears them. Without sign-in anyone with the URL can use the AI key, so put a deployed app behind your host's protection or add accounts before sharing it.

## Taking template updates

Answers live inside `blanks.json`, so keep them in an answers file too: `./fill export answers.json` (secrets stay in `.env`). To update:

```bash
./fill export answers.json
git checkout -- blanks.json && git pull
./fill --from answers.json && ./fill list    # fills what you had, then shows any new blanks
```

## The pair

The landing (`headstart-landing`) is meant to sit beside this folder (`../landing` or any sibling with a `blanks.json` whose `site` is `landing`). Filling any `brand.*` or `link.*` blank here fills it there too and rewrites both sites' color tokens. `./fill sync` pulls them from the pair, `./fill sync --push` sends them. MCP tools take `site: "this" | "pair" | "both"`.

## Modalities

- Text: the composer (`app/components/composer.tsx`), Enter sends, Shift+Enter breaks a line.
- Voice in: the mic records with `MediaRecorder`, `POST /api/transcribe` forwards it to `AI_TRANSCRIBE_MODEL`, the words land in the composer.
- Voice out: Read aloud on every reply (`speechSynthesis`, no key needed).
- Images and handwriting: attach, camera (`capture="environment"` on phones), paste or drop. Photos are shrunk to 1280px JPEG in the browser and sent to `AI_MODEL` as `image_url` parts.
- Replies stream from `POST /api/chat` (`app/routes/api.chat.ts`), which adds `assistant.role` as the system prompt.

Chats live in the browser (`app/lib/chats.ts`, localStorage). Swap in a database there if the demo needs accounts.

## Colors

- `brand.color` takes any CSS color: hex, `rgb()`, `hsl()`, `oklch()`, `oklab()`, `lab()`, `lch()`, `color(srgb ...)`, `color(display-p3 ...)`; `brand.format` picks how tokens are written.
- `app/tokens.css` is generated (light and dark); never edit it, run `./fill tokens`. Every text pair passes WCAG 4.5:1 and APCA Lc 60. `/brand` shows the palette in every format with its contrast table.
- `./fill contrast "<text>" "<bg>"` measures a pair and gives the nearest passing fix; `./fill convert "<color>"` prints every format.
- The app is warm neutral (canvas, ink and greys stay the same for every brand); the brand color is the accent. The landing uses the same tokens, fonts and pieces, so both read as one product.
- Tailwind names: `bg-canvas`, `bg-surface`, `bg-raised`, `border-line`; text `text-ink`, `text-body`, `text-muted`; `text-quiet` only for headings 24px and up; `text-accent-ink`, `bg-accent-fill` with `text-on-accent`; status tints `bg-tone-1..5` with `text-tone-1-ink..5-ink`. Never add a raw color. Type: `font-sans` (Geist), `font-mono` (IBM Plex Mono), `font-serif` (the wordmark); sizes `text-hero`, `text-h2`, `text-h3`, `text-body`, `text-row`.
- Ready-made pieces: `btn btn-dark`, `btn btn-light`, `row`, `frame`, `dots`, `eyebrow`. Pixel-art scenes come from `kit/pixel.mjs` through `app/components/pixel.tsx` (`<Pixel scene="field" />`; scenes meadow, sky, field, grass, dawn, noon, dusk, night).
- `*stars*` in `assistant.greeting` set the second half in the lighter grey.

## Map

`./fill map` (MCP `map`) lists routes and which file reads which blank.

| Route | File |
| --- | --- |
| `/welcome` | `app/routes/welcome.tsx` (onboarding; the profile cookie lives in `app/lib/env.server.ts`), `/restart` clears it |
| `/`, `/c/:id` | `app/routes/home.tsx` (empty state, thread, composer) inside `app/routes/shell.tsx` (the rail) |
| `/brand` | `app/routes/brand.tsx` |
| `/api/chat`, `/api/transcribe` | `app/routes/api.chat.ts`, `app/routes/api.transcribe.ts` |

React Router is v8 in framework mode; its own agent guide is in `.agents/skills/react-router`. Routes are declared in `app/routes.ts`. Landmarks carry plain ids (`rail`, `rail-new-chat`, `composer`, `composer-mic`, `composer-send`, `chat-thread`, `page-brand`) so naming one finds its file with a grep.

## Adding a feature

1. Add its words as blanks in `blanks.json` (`ask`, `hint`, `kind`, `max`, `value: ""`).
2. Read them with `b("key")` from `app/lib/blanks.ts`.
3. `./fill check` fails on any `b("key")` that is not in `blanks.json`. `pnpm typecheck` must pass.
