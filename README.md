# Headstart product

**Speed up your AI startup.** The private, signed-in side of a healthcare startup: an assistant people can type to, talk to and show photos, filled in like a form from the terminal or through MCP.

- React Router 8 (framework mode, server rendered on Cloudflare Workers), Tailwind 4, TypeScript, in the same calm warm-neutral style as the landing: a serif wordmark, dark glossy buttons, bordered rows, a framed chat panel and a pixel-art welcome.
- Multimodal from the first run: text, voice in (record, then transcribe), voice out (Read aloud), and photos or handwriting by upload, camera, paste or drop. Streams replies from any OpenAI-compatible API (OpenAI, Groq, OpenRouter, Together, DeepInfra, Fireworks, your own).
- No passcode: first-time visitors get a short welcome (a name and three questions you write as blanks), and the answers go to the assistant with every message. Chats stay on the device, and there is a `/brand` page that shows every color token in every format with its contrast table.
- Every word and secret is a blank in `blanks.json`. An empty blank renders as `REQUIRED: Assistant name`, and `pnpm build` refuses to run until every blank holds a real answer. Secrets go to `.env`, never into git.
- Pairs with [headstart-landing](https://github.com/brandonmlicea/headstart-landing). Brand and links fill both at once, and one brand color in any CSS format becomes the same AA-checked palette on both.

## Start

```bash
mkdir my-startup && cd my-startup
git clone --depth 1 https://github.com/brandonmlicea/headstart-landing landing
git clone --depth 1 https://github.com/brandonmlicea/headstart-product product
cd product && pnpm install
./fill list                  # every blank still REQUIRED
./fill --from answers.json   # fill them all at once (agents)
./fill                       # or walk the form by hand (people, in a terminal)
pnpm dev                     # http://localhost:5173
```

Or press **Use this template** on GitHub for your own copy.

## The form

```bash
./fill list                          # what is still REQUIRED, with hints and limits
./fill assistant.name="Wren"         # fill one or more blanks
./fill env.key="sk-..."              # secrets land in .env
./fill --from answers.json           # fill many at once
./fill check                         # ready to build?
./fill sync                          # pull brand and links from the landing beside it
./fill contrast "#999" "#fff"        # WCAG + APCA, with the nearest passing fix
./fill export answers.json     # save your answers (before pulling template updates)
./fill map                           # which file uses which blank
```

## MCP

`.mcp.json` registers the server for Claude Code when you open the folder. For any other client:

```json
{ "mcpServers": { "headstart": { "command": "node", "args": ["/path/to/product/kit/mcp.mjs"] } } }
```

Tools: `blanks`, `fill`, `check`, `map`, `sync`, `palette`, `convert`, `contrast`. They reach the paired landing too.

## Deploy

The app is a Cloudflare Worker (React Router's Cloudflare setup: `workers/app.ts`, `wrangler.json`, `@cloudflare/vite-plugin`), so `pnpm dev` already runs in the Workers runtime.

```bash
pnpm wrangler login                    # once
pnpm run deploy                        # ./fill check, build, wrangler deploy to <name>.<subdomain>.workers.dev
pnpm wrangler secret put AI_API_KEY    # and AI_BASE_URL, AI_MODEL, AI_TRANSCRIBE_MODEL
```

Change `name` in `wrangler.json` first. `./fill` writes `.env` for your own computer only; the deployed Worker reads its secrets (`wrangler secret put`, or `wrangler secret bulk .env` to send them all). `pnpm start` serves the last build locally in the Workers runtime. The app has no sign-in, so anyone with the URL can use your AI key: put it behind Cloudflare Access, or add real accounts, before you share it widely or store real patient data.

## For agents

Read [AGENTS.md](AGENTS.md).

## License

MIT
