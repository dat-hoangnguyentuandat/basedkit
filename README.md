# BaseKit

BaseKit installs a shared engineering toolkit for Claude Code, Codex, or both.
It provides agents, reusable skills, commands, workflows, hooks, project rules,
and supporting scripts while preserving existing project customizations.

## Quick Start

Install the launcher once:

```sh
curl -fsSL https://raw.githubusercontent.com/dat-hoangnguyentuandat/basekit/main/install.sh | sh
```

Open a new terminal, enter any project, and run:

```sh
basekit
```

The interactive launcher detects the current project and lets you choose:

1. Claude Code
2. Codex
3. Both
4. Check for Updates, or Update BaseKit when a newer revision is available
5. Exit

Use the arrow keys and Enter, or press a number to select an option.

## Windows

Install the launcher once from PowerShell:

```powershell
irm https://raw.githubusercontent.com/dat-hoangnguyentuandat/basekit/main/install.ps1 | iex
```

Open a new terminal, change to a project directory, and run `basekit`.

## Launcher Commands

The menu is the default experience, but direct commands are available for
scripts and automation:

```sh
basekit claude
basekit codex
basekit both
basekit update
basekit update --check
basekit codex --target /path/to/project
basekit --help
basekit --version
```

The target defaults to the current working directory. The launcher requires
Node.js 18 or newer. The POSIX bootstrap also requires `curl` and `tar`.

## Installation Behavior

BaseKit does not require `.claude` or `.codex` to exist beforehand. It creates
missing provider directories and merges into existing ones.

Every provider installation records managed file hashes in a manifest. On a
later run:

- Unmodified BaseKit files are updated.
- Existing user files are preserved.
- User-modified BaseKit files are not overwritten.
- Incoming conflicting files are written under `.basekit/conflicts` for review.
- Generated settings blocks are merged idempotently instead of duplicated.

### Claude Code Layout

Claude Code receives:

- Agents, commands, hooks, rules, workflows, scripts, and skills in `.claude/`.
- BaseKit configuration in `.claude/.bk.json`.
- BaseKit ignore patterns in `.claude/.bkignore`.
- Hook registrations and the status line merged into `.claude/settings.json`.
- Installation state in `.claude/.basekit/manifest.json`.

### Codex Layout

Codex receives:

- Converted agent TOML files in `.codex/agents/`.
- Agent registrations merged into `.codex/config.toml`.
- Repository skills and converted command skills in `.agents/skills/`.
- Rules and workflows merged into the repository `AGENTS.md`.
- Supporting payload files in `.codex/basekit/`.
- Installation state in `.codex/.basekit/manifest.json`.

## Updating BaseKit

Each bootstrap records the exact installed Git commit. When the interactive
launcher starts, it compares that revision with the latest commit on GitHub and
shows an update warning when they differ. Update checks are cached for 15
minutes and time out quickly, so an offline or rate-limited GitHub request does
not block project installation.

Select the update item in the menu or run:

```sh
basekit update --check
basekit update
```

The first command only reports status. The second runs the platform bootstrap
and installs the latest launcher and bundled kit. Then run `basekit` inside each
project that should receive the updated files. Project customizations continue
to follow the conflict rules above.

Re-running the original bootstrap command remains a supported recovery path.

The previous launcher payload is retained as `app.previous` under the BaseKit
user installation directory during an update.

## Development

Run the installer and launcher test suites with Node.js:

```sh
node --test tests/*.test.mjs
```

Test the launcher directly from a checkout:

```sh
node bin/basekit.mjs
node bin/basekit.mjs codex --target ./example-project
```

## Licensing and Attribution

BaseKit combines original launcher code, adapted toolkit material, and
third-party skills under different licenses. No single license should be
assumed to cover every file in the repository.

See [NOTICE](NOTICE) for copyright ownership, upstream attribution, excluded
proprietary materials, and the license location for each bundled component.
Detailed dependency notices are retained in
[`engineer/skills/THIRD_PARTY_NOTICES.md`](engineer/skills/THIRD_PARTY_NOTICES.md).
