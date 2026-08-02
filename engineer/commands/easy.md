---
description: 🚀 Easy AI team tools - check bugs, fix issues, notify Discord/Lark/GitHub
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebFetch, Task
argument-hint: [command] [args]
---

## Easy AI Team Tools

**Command**: $ARGUMENTS

## Available Commands

- `check` - Check all pending bugs/tasks from Discord, Lark, GitHub
- `check discord` - Check only Discord bugs
- `check lark` - Check only Lark tasks
- `check github` - Check only GitHub issues
- `fix <url>` - Fix bug from URL, auto-reply when done
- `whoami` - Show current identity and connections
- `setup` - Setup instructions

## Workflow

Based on the command provided in $ARGUMENTS:

### `check [platform]`
1. Load config from `~/.claude/easy.config.json`
2. Fetch pending items from platforms (Discord bugs, Lark tasks, GitHub issues)
3. Display aggregated report

### `fix <url>`
1. Parse URL to detect platform (Discord/Lark/GitHub)
2. Fetch bug/task content from URL
3. Analyze and search codebase for related code
4. Propose and apply fix
5. Commit and push changes
6. Reply/comment on original platform with fix details

### `whoami`
Show identity from `~/.claude/easy.config.json`

### `setup`
Show setup instructions for config file

## URL Patterns

| Platform | URL Pattern |
|----------|-------------|
| Discord | `discord.com/channels/{server}/{channel}/{message}` |
| Lark | `larksuite.com/...` or `feishu.cn/...` |
| GitHub | `github.com/{org}/{repo}/issues/{id}` |

**IMPORTANT:** After fixing, always reply/comment on the original platform.
**IMPORTANT:** Activate relevant skills (debugging, git-manager) as needed.

---

## Lark Check

Config: `~/.claude/easy.config.json`
```json
{
  "lark": {
    "app_id": "...",
    "app_secret": "...",
    "base_id": "...",
    "table_id": "...",
    "default_view": "vewM6jVP0Y",
    "filter_status": ["To-do"],
    "page_size": 50
  }
}
```

### API Flow

1. Get token:
```
POST https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal
Body: {"app_id": "...", "app_secret": "..."}
```

2. Fetch tasks (URL-encode filter):
```
GET /bitable/v1/apps/{base_id}/tables/{table_id}/records
  ?page_size=50
  &view_id={default_view}
  &filter=CurrentValue.[Status]="To-do"
Header: Authorization: Bearer {token}
```

### Output Format

Build record URLs: `https://jamstackvietnam.sg.larksuite.com/base/{base_id}?table={table_id}&view={view_id}&record={record_id}`

```markdown
## Lark Tasks - To-do ({total} total)

### By Project
| Project | Tasks | Bugs |
|---------|-------|------|
| EAI     | 30    | 5    |
| Ecomart | 15    | 8    |

### Do First (Bugs)
1. [Bug name...](lark_record_url) | Project | @PIC
2. ...

### Do Next (Tasks)
1. [Task name...](lark_record_url) | Project | @PIC
2. ...
```

### Priority Rules
- **Do First**: Type = Bug, has Discord link (customer reported)
- **Do Next**: Type = Task, Feedback, Backlog
