# Data And Migrations

Use a plugin table for submissions, leads, logs, orders, bookings, history or growing/filterable business data. Use `PluginSetting` for small plugin-wide configuration and `$block->settings` for one layout block.

Place migrations in `plugins/{slug}/database/migrations/`. Core activates them with the plugin migration flow; verify the actual command and status in the current CMS.

Rules:

- Keep migration Laravel-compatible and idempotent.
- Guard or avoid MySQL-only SQL when tests use SQLite.
- Do not rollback/delete data on deactivate.
- Reinstall/update must preserve existing rows and handle new columns safely.
- Validate authorization, input and ownership in plugin routes/controllers.

For development reinstall guards, use `Schema::hasTable()` only when it matches the project's migration conventions; do not hide migration failures in production.
