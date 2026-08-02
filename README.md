# BasedKit

BasedKit installs a shared engineering toolkit for Claude Code, Codex, or all
supported providers.
It provides agents, reusable skills, commands, workflows, hooks, project rules,
and supporting scripts while preserving existing project customizations.

## Quick Start

Install the launcher once:

```sh
curl -fsSL https://raw.githubusercontent.com/dat-hoangnguyentuandat/basedkit/main/install.sh | sh
```

Open a new terminal, enter any project, and run:

```sh
basedkit
```

The interactive launcher detects the current project and lets you choose:

1. Claude Code
2. Codex
3. All
4. Check for Updates
5. Exit

Use the arrow keys and Enter, or press a number to select an option.

## Windows

Install the launcher once from PowerShell:

```powershell
irm https://raw.githubusercontent.com/dat-hoangnguyentuandat/basedkit/main/install.ps1 | iex
```

Open a new terminal, change to a project directory, and run `basedkit`.

## Launcher Commands

The menu is the default experience, but direct commands are available for
scripts and automation:

```sh
basedkit claude
basedkit codex
basedkit all
basedkit codex --bundles base,cms
basedkit update
basedkit update --check
basedkit codex --target /path/to/project
basedkit --help
basedkit --version
```

The target defaults to the current working directory. The launcher requires
Node.js 18 or newer. The POSIX bootstrap also requires `curl` and `tar`.

## Bundle Selection

Interactive provider choices open a bundle selection page. Base is always
selected and additional bundles can be toggled with Space or Enter:

- **Base**: Core agents, commands, hooks, workflows, and general engineering
  skills. Base excludes every skill owned by an optional bundle.
- **UI/UX**: Advanced interface design direction and implementation taste.
  Currently provides `hallmark`.
- **CMS**: CMS plugins, themes, widgets, sitemaps, and production SEO. Currently
  provides `io-sitemap`, `plugin-cms`, `seo`, `theme-cms`, `website-sitemap`, and
  `widget-cms`.

Running Base again after previously selecting an optional bundle removes that
bundle's unmodified managed files. Customized files are preserved.

### Adding Bundles and Skills

The launcher discovers optional bundles from the repository at runtime:

```text
bundles/
  my-bundle/
    bundle.json
    skills/
      my-skill/
        SKILL.md
```

`bundle.json` defines `id`, `name`, `description`, and optional `order` fields.
The folder name must match `id`. To add a skill to an existing choice, place its
complete skill folder under that bundle's `skills/` directory. To create a new
launcher choice, create another bundle folder with the same structure; no
launcher code change is required.

## Installation Behavior

BasedKit does not require `.claude` or `.codex` to exist beforehand. It creates
missing provider directories and merges into existing ones.

Every provider installation records managed file hashes in a manifest. On a
later run:

- Unmodified BasedKit files are updated.
- Existing user files are preserved.
- User-modified BasedKit files are not overwritten.
- Incoming conflicting files are written under `.basedkit/conflicts` for review.
- Generated settings blocks are merged idempotently instead of duplicated.

Earlier managed installations are migrated to the BasedKit paths on the next
project install. Modified project files remain protected by the same conflict
rules.

### Claude Code Layout

Claude Code receives:

- Agents, commands, hooks, rules, workflows, scripts, and skills in `.claude/`.
- BasedKit configuration in `.claude/.basedkit.json`.
- BasedKit ignore patterns in `.claude/.basedkitignore`.
- Hook registrations and the status line merged into `.claude/settings.json`.
- Installation state in `.claude/.basedkit/manifest.json`.

### Codex Layout

Codex receives:

- Converted agent TOML files in `.codex/agents/`.
- Agent registrations merged into `.codex/config.toml`.
- Repository skills and converted command skills in `.agents/skills/`.
- Rules and workflows merged into the repository `AGENTS.md`.
- Supporting payload files in `.codex/basedkit/`.
- Installation state in `.codex/.basedkit/manifest.json`.

## Updating BasedKit

Each bootstrap records the exact installed Git commit. When the interactive
launcher starts, it compares that revision with the latest commit on GitHub and
shows an update warning when they differ. Update checks are cached for 15
minutes and time out quickly, so an offline or rate-limited GitHub request does
not block project installation.

The update choice opens a dedicated status page. It stays open after checking,
shows an **Update Now** action only when a newer revision exists, and includes a
**Back** action to return to the launcher. The same operations are available as
commands:

```sh
basedkit update --check
basedkit update
```

The first command only reports status. The second runs the platform bootstrap
and installs the latest launcher and bundled kit. Then run `basedkit` inside each
project that should receive the updated files. Project customizations continue
to follow the conflict rules above.

Re-running the original bootstrap command remains a supported recovery path.

The previous launcher payload is retained as `app.previous` under the BasedKit
user installation directory during an update.

## Development

Run the installer and launcher test suites with Node.js:

```sh
node --test tests/*.test.mjs
```

Test the launcher directly from a checkout:

```sh
node bin/basedkit.mjs
node bin/basedkit.mjs codex --target ./example-project
```

## Licensing and Attribution

BasedKit combines original launcher code, adapted toolkit material, and
third-party skills under different licenses. No single license should be
assumed to cover every file in the repository.

See [NOTICE](NOTICE) for copyright ownership, upstream attribution, excluded
proprietary materials, and the license location for each bundled component.
