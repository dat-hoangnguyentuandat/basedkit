# EasyChatGPT App Debug

When user's message contains any of these:
- `console.easyaichat.app` or `staging.console.easyaichat.app` URLs
- Error messages, stack traces, cURL errors from the app
- Requests to debug, investigate, check conversation, or evaluate app behavior

Then:
1. NEVER use WebFetch/Fetch on console URLs — returns 403 (session auth required)
2. Read `.claude/skills/app-debug/SKILL.md` and follow its instructions
