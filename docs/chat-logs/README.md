# AI Chat Logs

Raw Claude Code (Opus 4.6) conversation transcripts exported from `~/.claude/projects/`.

> **Note:** The `.jsonl` files are gitignored because they contain environment secrets (Supabase keys etc.) embedded in session transcripts. They are kept locally in this directory for reference. See the session index below for what each file contains.

## Sessions

| File | Size | Messages | Date Range | Description |
|------|------|----------|------------|-------------|
| `5128efd2-...jsonl` | 971B | 2 | Feb 27 | Initial setup / test |
| `fd4765d4-...jsonl` | 29KB | 31 | Feb 27 | Early Day 1 session (MCP setup, Linear integration) |
| `875bca8c-...jsonl` | 34KB | 40 | Feb 27 | Day 1 session (project setup, planning) |
| `c8ad808e-...jsonl` | 14MB | 4,633 | Feb 27–28 | **Primary session** — all implementation across both days |

## Format

Each file is newline-delimited JSON (JSONL). Each line is a message object with `type` (user/assistant/tool), `timestamp`, and `message` content.

## Tool

All sessions used **Claude Code (Opus 4.6)** via the CLI with:
- **Linear MCP** — ticket creation, status updates, project management
- **Paper.design MCP** — UI design mockups, screenshot reviews, HTML-to-canvas rendering
