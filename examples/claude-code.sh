#!/bin/sh
# Add the 8pt MCP server to Claude Code
claude mcp add --transport http 8pt https://8pt.dev/api/mcp \
  --header "Authorization: Bearer ${EIGHTPT_API_KEY:?set EIGHTPT_API_KEY first}"
