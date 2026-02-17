# blumira-mcp

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server for the [Blumira Public API](https://api.blumira.com/public-api/v1/ui/). Use it with any MCP-compatible client (Cursor, Claude Desktop, etc.) to query Blumira findings, accounts, agent devices, and agent keys using natural language.

## Requirements

- Node.js 18 or later
- A Blumira JWT access token

## Installation

```bash
git clone https://gitlab.com/mkellar/blumira-mcp.git
cd blumira-mcp
npm install
npm run build
```

## Configuration

Set your Blumira access token as an environment variable:

```bash
export BLUMIRA_ACCESS_TOKEN="your-jwt-token-here"
```

## Usage

### Cursor

Add to your Cursor MCP settings (`.cursor/mcp.json`):

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

Add to your Claude Desktop config (`claude_desktop_config.json`):

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

### Direct / stdio

```bash
BLUMIRA_ACCESS_TOKEN="your-token" node dist/index.js
```

The server communicates via JSON-RPC over stdin/stdout.

## Available Tools

### Health

| Tool | Description |
|------|-------------|
| `blumira_health` | Check the health status of the Blumira API |

### MSP Accounts

| Tool | Description |
|------|-------------|
| `blumira_list_accounts` | List MSP accounts |
| `blumira_get_account` | Get a single MSP account by ID |

### MSP Account Findings

| Tool | Description |
|------|-------------|
| `blumira_list_account_findings` | List findings for a specific MSP account |
| `blumira_list_all_accounts_findings` | List findings across all MSP accounts |
| `blumira_get_account_finding` | Get a specific finding for an MSP account |
| `blumira_get_account_finding_comments` | List comments for a finding in an MSP account |

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

## Common Parameters

### Pagination (for list tools)

- `page` — page number (1-based)
- `page_size` — items per page (1–200)
- `order_by` — ordering expression, e.g. `created;desc`
- `return_all` — automatically fetch all pages (default: false)

### Finding Filters (for finding list tools)

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
npm run build
npm run lint     # type-check only
```

## License

MIT
