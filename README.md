# 🟩 commit-bot

A cross-platform CLI tool to paint your GitHub contribution graph green. Generate backdated commits to fill in your contribution graph with specific dates, patterns, shapes, or random scatter.

## Installation

```bash
# Use directly with npx (no install needed)
npx commit-bot --help

# Or install globally
npm install -g commit-bot
```

**Requirements:** Node.js 16+ and Git installed on your system.

## Quick Start

```bash
# Create a new repo and make 5 commits on a specific date
commit-bot date -d 2024-03-15 -n 5 --init

# Preview without making changes
commit-bot date -d 2024-03-15 -n 5 --dry-run

# Push to remote automatically
commit-bot date -d 2024-03-15 -n 5 --push
```

## Commands

### `date` — Single Date

Create commits on a specific calendar date.

```bash
commit-bot date -d 2024-03-15 -n 5
commit-bot date --date 2024-12-25 --commits 10
```

### `grid` — By (week, day) Coordinate

Target a specific cell on the GitHub contribution graph.
- **Week:** 0 = leftmost (oldest), 52 = rightmost (current)
- **Day:** 0 = Sunday, 1 = Monday, ..., 6 = Saturday

```bash
commit-bot grid -w 10 -d 3 -n 4
commit-bot grid --week 25 --day 0 --commits 8
```

### `range` — Date Range

Fill a continuous date range with commits. Supports variable commits per day.

```bash
commit-bot range -f 2024-01-01 -t 2024-06-30
commit-bot range --from 2024-01-01 --to 2024-12-31 --min 1 --max 5
commit-bot range -f 2024-01-01 -t 2024-06-30 --weekdays-only
```

### `random` — Random Scatter

Distribute N commits randomly across a time window.

```bash
commit-bot random -n 200 --days 365
commit-bot random --total 100 --days 90 --weekdays-only
```

### `pattern` — Draw on the Graph ⭐

Write text or draw shapes directly on the contribution graph.

```bash
# Write text
commit-bot pattern --text "HI" --year 2024
commit-bot pattern --text "2024" --year 2024 --intensity high

# Draw shapes
commit-bot pattern --shape heart --year 2024
commit-bot pattern --shape star --year 2024 --intensity max
```

**Available shapes:** `heart`, `smiley`, `check`, `star`, `skull`, `wave`, `diamond`

**Intensity levels:**
| Level | Commits per cell |
|-------|-----------------|
| `low` | 1 |
| `medium` | 3 (default) |
| `high` | 5 |
| `max` | 10 |

### `fill` — Fill Entire Year

Blanket an entire year with commits for a solid green wall.

```bash
commit-bot fill --year 2024
commit-bot fill --year 2023 --min 1 --max 8
commit-bot fill --year 2024 --weekdays-only
```

### `wipe` — Reset

Remove all bot-generated commits and start fresh. Requires `--confirm` as a safety guard.

```bash
commit-bot wipe --confirm
commit-bot wipe --confirm --push
```

## Global Options

These options work with all commands:

| Flag | Description | Default |
|---|---|---|
| `--repo <path>` | Path to the target git repo | `.` |
| `--author <name>` | Override commit author name | git config |
| `--email <email>` | Override commit author email | git config |
| `-m, --message <msg>` | Custom commit message | `chore: update` |
| `--push` | Auto-push to remote after committing | `false` |
| `--branch <name>` | Target branch | `main` |
| `--dry-run` | Preview without making commits | `false` |
| `--init` | Initialize a git repo if one doesn't exist | `false` |
| `--verbose` | Show detailed output | `false` |

## How It Works

Git allows setting custom dates for commits via the `GIT_AUTHOR_DATE` and `GIT_COMMITTER_DATE` environment variables. This tool automates the process of:

1. Modifying a file (`contributions.md`)
2. Staging the change
3. Creating a commit with a backdated timestamp
4. Optionally pushing to a remote

GitHub counts these commits toward your contribution graph as long as:
- The commit email matches your verified GitHub email
- The repository is not a fork
- The commits are on the default branch

## Tips

- **Always test with `--dry-run` first** to preview what will happen
- **Use a dedicated private repo** for graph painting
- **Set `--init`** to auto-create a new git repo
- **Use `--push`** to automatically push after commits are generated
- **Randomized times:** Commit times are randomized within each day (8 AM–10 PM) for realism

## License

MIT
