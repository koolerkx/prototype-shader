@AGENTS.md

## Claude Code Setup
- `AGENTS.md` is the single source of project rules; edit it, not this file.
- Project skills: `.claude/skills/*` are symlinks to `.agents/skills/*`. Add a new skill under `.agents/skills/` and link it here.
- The `ponytail` plugin (`.agents/plugins/ponytail`) is served by the project marketplace in `.claude-plugin/marketplace.json` and enabled in `.claude/settings.json`. Its skills load from the plugin, so they have no link under `.claude/skills/`.
