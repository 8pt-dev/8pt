<p align="center">
  <a href="https://8pt.dev"><img src="assets/logo.png" width="72" height="72" alt="8pt"></a>
</p>

<h1 align="center">8pt</h1>

<p align="center"><b>Make any AI model ship professional-grade UI.</b></p>

<p align="center">
  <a href="https://8pt.dev">Website</a> ·
  <a href="https://8pt.dev/docs/mcp/">MCP docs</a> ·
  <a href="https://8pt.dev/docs/cli/">CLI docs</a> ·
  <a href="https://www.npmjs.com/package/@8pt-dev/cli">npm</a>
</p>

8pt makes any AI model ship professional-grade UI: curated components, full-page templates, themes, icons and Skills, delivered to Claude Code, Cursor, Codex and Trae through one MCP server and CLI.

中文：8pt 让任何大模型交出专业级作品：精选 UI 组件、整页模板、主题、图标与 Skill，通过一个 MCP 与 CLI 接入 Claude Code、Cursor、Codex、Trae。

## What's in the library

- **Components** — buttons, cards, inputs, navigation, pricing, data display, hero sections, backgrounds and motion. Each one runs live and ships with full HTML/CSS/JS source plus an integration prompt the model follows.
- **Templates** — full pages (hero, features, pricing, FAQ) to start from.
- **Themes** — one block of CSS variables (colors, radius, fonts, shadows) restyles a whole site.
- **Icons** — original line icons on a 24px grid, `stroke="currentColor"`.
- **Skills** — `SKILL.md` workflows that tell a model which steps and standards to follow.

## CLI

Requires Node.js 18+.

```bash
npm i -g @8pt-dev/cli
8pt login                      # opens 8pt.dev to create an API Key and saves it locally
8pt init                       # write 8pt design rules into AGENTS.md / CLAUDE.md / Cursor / Copilot
8pt install-skill              # teach Claude Code / Codex to use 8pt
8pt design "landing page for a budgeting app"
8pt search "pricing toggle"
8pt add pricing-toggle         # installs into components/8pt/pricing-toggle/
```

No global install: `npx @8pt-dev/cli <command>`.
In CI or scripts, skip login with `--api-key <key>` or the `API_KEY_8PT` environment variable.

| Command | What it does |
| --- | --- |
| `8pt search <query>` | Search components |
| `8pt add <slug>` | Install a component (source + integration prompt) |
| `8pt prompt <slug>` | Print a component's integration prompt |
| `8pt templates` / `8pt template <slug>` | List or fetch templates |
| `8pt skills` / `8pt skill <slug>` | List or install Skills (`--target claude\|codex\|cursor\|agents`) |
| `8pt theme [slug]` | Fetch theme variables (`--out theme.css`) |
| `8pt icons <name>` | Fetch icon SVGs (`--out dir`) |
| `8pt init` / `8pt design <brief>` / `8pt rules` | Write, query or print the 8pt design rules |
| `8pt mcp [claude\|codex\|cursor]` | Print MCP config |
| `8pt status` / `8pt logout` | Show or clear local login |

## MCP server

- Endpoint: `https://8pt.dev/api/mcp` (Streamable HTTP)
- Auth: `Authorization: Bearer <your 8pt API Key>` — create one at 8pt.dev → Settings → API Key (Builder plan).

### Claude Code

```bash
claude mcp add --transport http 8pt https://8pt.dev/api/mcp \
  --header "Authorization: Bearer <YOUR_8PT_API_KEY>"
```

### Cursor — `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "8pt": {
      "url": "https://8pt.dev/api/mcp",
      "headers": { "Authorization": "Bearer <YOUR_8PT_API_KEY>" }
    }
  }
}
```

### Codex — `~/.codex/config.toml`

```toml
# export EIGHTPT_API_KEY=<YOUR_8PT_API_KEY>
[mcp_servers.8pt]
url = "https://8pt.dev/api/mcp"
bearer_token_env_var = "EIGHTPT_API_KEY"
```

### Trae and other clients

Trae: Settings → MCP → Add manually (JSON). Any client that supports Streamable HTTP:

```json
{
  "mcpServers": {
    "8pt": {
      "url": "https://8pt.dev/api/mcp",
      "headers": { "Authorization": "Bearer <YOUR_8PT_API_KEY>" }
    }
  }
}
```

Ready-to-copy files are in [`examples/`](examples/). The CLI source is in [`cli/`](cli/) (published to npm as `@8pt-dev/cli`).

### Tools

| Tool | What it does |
| --- | --- |
| `design_ui` | Call before building any UI: returns design rules plus matching templates, components and theme |
| `search_components` | Search components by description (English or Chinese) |
| `get_component` | Full source and integration prompt for one component |
| `list_templates` / `get_template` | List or fetch full-page templates |
| `list_skills` / `get_skill` | List Skills or fetch all files of one Skill |
| `get_theme` | Theme CSS variables |
| `search_icons` | Icons as 24px `currentColor` SVG |
| `submit_component` | Submit a native HTML/CSS/JS component to your account for review |

Then just ask your agent, e.g. *"Use 8pt to find a pricing toggle and put it on the home page."*

## Plans

Browsing and live previews need a sign-in. Copying prompts, full source, MCP and CLI need the Builder plan. See [8pt.dev/pricing](https://8pt.dev/pricing/).

## Links

- Website: https://8pt.dev
- Docs: https://8pt.dev/docs/
- npm: https://www.npmjs.com/package/@8pt-dev/cli
- Support: support@8pt.dev

Third-party product names are trademarks of their respective owners and do not imply endorsement.
