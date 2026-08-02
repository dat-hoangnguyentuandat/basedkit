---
name: app-debug
description: "Debugs EasyChatGPT app issues by reading server logs via Log Viewer API (curl) and querying databases via SSH scripts. Activates when user pastes console.easyaichat.app URLs, staging.console.easyaichat.app URLs, Log Viewer URLs containing /logs?file=, error messages, stack traces, cURL errors, or asks to debug, investigate, check conversation, or evaluate app behavior."
---

# App Debug

NEVER use WebFetch on console URLs. Extract params from URL → call Log Viewer API via `curl` in Bash.

## Environment detection

| URL contains | Env | DB script | Log API base | API key env var |
|---|---|---|---|---|
| `staging.console.` | staging | `bash .claude/scripts/db-staging-query.sh` | `https://staging.console.easyaichat.app/logs/api` | `STAGING_MICROSERVICE_API_KEY` |
| `console.easyaichat.app` | prod | `bash .claude/scripts/db-prod-query.sh` | `https://console.easyaichat.app/logs/api` | `PROD_MICROSERVICE_API_KEY` |
| `localhost` | local | `bash .claude/scripts/db-local-query.sh` | `http://localhost/logs/api` | `MICROSERVICE_API_KEY` |

Read key: `grep {VAR_NAME} .env | cut -d= -f2` → append `?api_key={KEY}` to all API calls.

## Routing

**Conversation URL** (`/workspaces/{ws}/conversations?handle={handle}#{number}`)
→ DB queries: see [db-queries.md](db-queries.md)

**Log Viewer URL** (`/logs?file={id}.log&query=log-index%3A{N}`)
→ Extract `file` + decode `log_index` → call Log API below

**Error/exception text** → Search logs below, then DB if API-related

**General debug** → DB for data, Logs for errors, source code for logic

## Log Viewer API

```bash
# List log files
curl -s "{BASE}/logs/api/files?api_key={KEY}"

# Read logs (newest first)
curl -s "{BASE}/logs/api/logs?file={ID}&per_page=20&direction=desc&api_key={KEY}"

# Jump to exact index (from URL log-index param) — use query param, NOT log_index
curl -s "{BASE}/logs/api/logs?file={ID}&query=log-index%3A{N}&per_page=1&api_key={KEY}"

# Search logs
curl -s "{BASE}/logs/api/logs?file={ID}&query={TERM}&api_key={KEY}"
```

Params: `file` (required), `per_page` (1-100), `direction` (asc/desc), `log_index`, `level` (error/warning/info/debug), `query`.

Response per entry: `index`, `level`, `datetime`, `message`, `context`, `full_text`.

### Which file to check

| Issue | File pattern |
|---|---|
| Exceptions, cURL errors | `laravel-{date}` |
| Chat/AI responses | `chat_flow-{date}`, `bot_function-{date}` |
| Webhooks | `webhook_log-{date}`, `messenger_log`, `zalo_log`, `instagram_log` |
| Scheduled tasks | `schedule-{date}` |
| Performance | `performance-{date}` |
| Workflows | `workflow_log-{date}` |

## DB queries

See [db-queries.md](db-queries.md) for SQL templates.

## Schema

See [schema.md](schema.md) for table structures and relationships.

## Safety

- DB scripts: read-only (SELECT only), `block-db-write.cjs` hook enforces this
- Always `SUBSTRING()` on payload/response columns
- Log API: read-only
