# blumira-mcp

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server for the [Blumira Public API](https://api.blumira.com/public-api/v1/ui/). Use it with any MCP-compatible client (Cursor, Claude Desktop, etc.) to query Blumira findings, accounts, agent devices, and agent keys using natural language.

## Requirements

- Node.js 18 or later
- A Blumira JWT access token

## Quick Start

```bash
git clone https://gitlab.com/mkellar/blumira-mcp.git
cd blumira-mcp
npm install
npm run build
```

Copy `.env.example` to `.env` and fill in your token:

```bash
cp .env.example .env
# Edit .env and set BLUMIRA_ACCESS_TOKEN
```

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BLUMIRA_ACCESS_TOKEN` | Yes | — | JWT access token for Bearer authentication |
| `BLUMIRA_BASE_URL` | No | `https://api.blumira.com/public-api/v1` | API base URL |
| `BLUMIRA_LOG_LEVEL` | No | `info` | Log level: debug, info, warn, error |

## Usage

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "blumira": {
      "command": "node",
      "args": ["/absolute/path/to/blumira-mcp/dist/index.js"],
      "env": {
        "BLUMIRA_ACCESS_TOKEN": "your-jwt-token-here"
      }
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "blumira": {
      "command": "node",
      "args": ["/absolute/path/to/blumira-mcp/dist/index.js"],
      "env": {
        "BLUMIRA_ACCESS_TOKEN": "your-jwt-token-here"
      }
    }
  }
}
```

### Docker

```bash
docker build -t blumira-mcp .
docker run --rm -i -e BLUMIRA_ACCESS_TOKEN="your-token" blumira-mcp
```

### Direct / stdio

```bash
BLUMIRA_ACCESS_TOKEN="your-token" node dist/index.js
```

## Architecture

The project follows a **tools vs libs** separation inspired by [SentinelOne's purple-mcp](https://github.com/Sentinel-One/purple-mcp):

```
src/
├── index.ts              # Entry point — boots server, validates config
├── config.ts             # Configuration from env vars (cached singleton)
├── errors.ts             # Typed error hierarchy (Auth, Network, Validation, API)
├── logger.ts             # Structured JSON logger with secret redaction
├── libs/
│   └── blumira-client.ts # Standalone API client — zero MCP dependency, explicit config
└── tools/
    ├── descriptions.ts   # Rich multi-line tool descriptions for LLM accuracy
    └── register.ts       # Thin MCP adapters that bridge libs → MCP protocol
```

**Key principles:**

- **libs/** contains standalone, reusable business logic with no global state and no MCP imports. All configuration is passed explicitly. Fully testable in isolation.
- **tools/** contains thin adapters that read settings, construct a client, delegate to the library, and format the result for MCP.
- **Structured errors** (`BlumiraAuthenticationError`, `BlumiraApiError`, etc.) give the LLM actionable context when things go wrong.
- **Secret redaction** ensures tokens never appear in log output.

## Available Tools (27 total)

### Health & Reference Data

| Tool | Description |
|------|-------------|
| `blumira_health` | Check the health status of the Blumira API |
| `blumira_list_resolutions` | Get available resolution options for findings (IDs and names) |

### MSP Accounts

| Tool | Description |
|------|-------------|
| `blumira_list_accounts` | List MSP accounts |
| `blumira_get_account` | Get a single MSP account by ID |

### MSP Account Users

| Tool | Description |
|------|-------------|
| `blumira_list_account_users` | List users for a specific MSP account |

### MSP Account Findings

| Tool | Description |
|------|-------------|
| `blumira_list_account_findings` | List findings for a specific MSP account |
| `blumira_list_all_accounts_findings` | List findings across all MSP accounts |
| `blumira_get_account_finding` | Get a specific finding for an MSP account |
| `blumira_get_account_finding_comments` | List comments for a finding in an MSP account |
| `blumira_resolve_account_finding` | **POST** — Resolve a finding for an MSP account |
| `blumira_assign_account_finding` | **POST** — Assign owners to a finding for an MSP account |
| `blumira_add_account_finding_comment` | **POST** — Add a comment to a finding for an MSP account |

### MSP Account Agent Devices

| Tool | Description |
|------|-------------|
| `blumira_list_account_agent_devices` | List agent devices for an MSP account |
| `blumira_get_account_agent_device` | Get a specific agent device for an MSP account |

### MSP Account Agent Keys

| Tool | Description |
|------|-------------|
| `blumira_list_account_agent_keys` | List agent keys for an MSP account |
| `blumira_get_account_agent_key` | Get a specific agent key for an MSP account |

### Org Users

| Tool | Description |
|------|-------------|
| `blumira_list_org_users` | List users for the current organization |

### Org Agent Devices

| Tool | Description |
|------|-------------|
| `blumira_list_org_agent_devices` | List agent devices for the current organization |
| `blumira_get_org_agent_device` | Get a specific agent device |

### Org Agent Keys

| Tool | Description |
|------|-------------|
| `blumira_list_org_agent_keys` | List agent keys for the current organization |
| `blumira_get_org_agent_key` | Get a specific agent key |

### Org Findings

| Tool | Description |
|------|-------------|
| `blumira_list_org_findings` | List findings for the current organization |
| `blumira_get_org_finding` | Get a specific finding |
| `blumira_get_org_finding_comments` | List comments for a finding |
| `blumira_get_org_finding_details` | Get detailed information for a finding |
| `blumira_resolve_org_finding` | **POST** — Resolve a finding |
| `blumira_assign_org_finding` | **POST** — Assign owners to a finding |
| `blumira_add_org_finding_comment` | **POST** — Add a comment to a finding |

## Common Parameters

### Pagination (list tools)

- `page` — page number (1-based)
- `page_size` — items per page (1–200)
- `order_by` — ordering expression, e.g. `created;desc`
- `return_all` — automatically fetch all pages (default: false)

### Finding Filters (finding list tools)

- `blocked` — filter by blocked status
- `category` — category ID
- `created_after` / `created_before` — ISO 8601 timestamps
- `created_by` — creator UUID
- `modified_after` / `modified_before` — ISO 8601 timestamps
- `modified_by` — modifier UUID
- `name` — exact finding name
- `priority` — priority (1–5)
- `resolution` — resolution ID
- `status` — status ID
- `status_modified_by` — UUID of status modifier
- `type` — type ID

## Development

```bash
npm install
npm run build    # compile TypeScript
npm run lint     # type-check only (tsc --noEmit)
```

## License

MIT
