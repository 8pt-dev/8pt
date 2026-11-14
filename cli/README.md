# 8pt CLI

8pt makes any AI model ship professional-grade UI: curated components, full-page templates, themes, icons and Skills, delivered to Claude Code, Cursor, Codex and Trae through one MCP server and CLI.

Search and install 8pt components, templates, themes, icons and Skills from your terminal or coding agent. Requires Node.js 18+.

```bash
npm i -g @8pt-dev/cli
8pt login            # opens 8pt.dev to create an API Key, saves it locally
8pt init             # write 8pt design rules into AGENTS.md / CLAUDE.md / Cursor / Copilot
8pt install-skill    # teach Claude Code / Codex to use 8pt
8pt design "landing page for a budgeting app"
8pt search "pricing toggle"
8pt add <slug>
```

No global install: `npx @8pt-dev/cli <command>`. In CI or scripts skip login: `--api-key <key>` or `API_KEY_8PT=<key>`.

With `8pt init`, coding agents build every UI strictly from 8pt templates, components, one 8pt theme and 8pt icons.

Commands: init, design, rules, login, logout, status, search, add, prompt, templates, template, skills, skill, install-skill, theme, icons, mcp. Run `8pt --help`.

## MCP

Endpoint `https://8pt.dev/api/mcp` (Streamable HTTP), header `Authorization: Bearer <your 8pt API Key>`.

```bash
claude mcp add --transport http 8pt https://8pt.dev/api/mcp \
  --header "Authorization: Bearer <YOUR_8PT_API_KEY>"
```

Cursor / Trae / other clients:

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

`8pt mcp [claude|codex|cursor]` prints the config for your client.

## Links

- Website: https://8pt.dev
- Docs: https://8pt.dev/docs/
- GitHub: https://github.com/8pt-dev/8pt
- Support: support@8pt.dev
