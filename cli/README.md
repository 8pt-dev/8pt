# 8pt CLI

Search and install 8pt components, templates, themes, icons and Skills from your terminal or coding agent.

```bash
npm i -g @8pt-dev/cli
8pt login            # opens 8pt.dev to create an API Key, saves it locally
8pt init             # write 8pt design rules into AGENTS.md / CLAUDE.md / Cursor / Copilot
8pt install-skill    # teach Claude Code / Codex to use 8pt
8pt design "landing page for a budgeting app"
8pt search "pricing toggle"
8pt add <slug>
```

In CI or scripts skip login: `--api-key <key>` or `API_KEY_8PT=<key>`.

With `8pt init`, coding agents build every UI strictly from 8pt templates, components, one 8pt theme and 8pt icons.

Commands: init, design, rules, login, logout, status, search, add, prompt, templates, template, skills, skill, install-skill, theme, icons, mcp. Run `8pt --help`.

https://8pt.dev
