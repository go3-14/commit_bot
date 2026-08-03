# 📖 `commit-bot` CLI Reference & Command Permutations

This document contains a reference of all available commands, options, and useful parameter combinations for `commit-bot`.

---

## 🌐 Global Options

These flags apply to **all subcommands** (`date`, `grid`, `range`, `random`, `pattern`, `fill`, `wipe`):

| Flag | Short | Description | Default | Example |
|---|---|---|---|---|
| `--repo` | | Path to the target Git repository | `.` | `--repo ./my-repo` |
| `--author` | | Override git author name | Git config | `--author "Jane Doe"` |
| `--email` | | Override git author email | Git config | `--email "jane@example.com"` |
| `--message` | `-m` | Custom commit message | `chore: update` | `-m "feat: contribution"` |
| `--push` | | Auto force-push to remote after committing | `false` | `--push` |
| `--branch` | | Target git branch | `main` | `--branch master` |
| `--dry-run` | | Preview output & ASCII graph without making changes | `false` | `--dry-run` |
| `--init` | | Auto-initialize git repo if missing | `false` | `--init` |
| `--verbose` | | Print debug logs during execution | `false` | `--verbose` |

---

## 1. `date` — Specific Date Commits

Create commits on a specific calendar date (`YYYY-MM-DD`).

### Syntax
```bash
commit-bot date -d <YYYY-MM-DD> [options]
```

### Permutations & Examples

```bash
# 1. Single commit on a specific date (preview only)
commit-bot date -d 2024-03-15 --dry-run

# 2. 5 commits on a specific date in the current repository
commit-bot date -d 2024-03-15 -n 5

# 3. 10 commits on a date, automatically initializing a new repository in a custom folder
commit-bot date --date 2024-12-25 --commits 10 --init --repo ./green-vault

# 4. Create commits with custom author identity and commit message
commit-bot date -d 2024-05-01 -n 3 --author "Bot User" --email "bot@example.com" -m "docs: backdated log"

# 5. Create commits and immediately force-push to remote main branch
commit-bot date -d 2024-08-15 -n 8 --push --branch main
```

---

## 2. `grid` — Target Contribution Graph Coordinates

Target a specific cell in the 53×7 GitHub contribution graph grid.
- **Week (`-w`)**: `0` (oldest / 52 weeks ago) to `52` (current week)
- **Day (`-d`)**: `0` (Sunday) to `6` (Saturday)

### Syntax
```bash
commit-bot grid -w <0-52> -d <0-6> [options]
```

### Permutations & Examples

```bash
# 1. Preview 1 commit on Week 10, Wednesday (Day 3)
commit-bot grid -w 10 -d 3 --dry-run

# 2. 4 commits at top-left corner of the graph (Week 0, Sunday)
commit-bot grid -w 0 -d 0 -n 4

# 3. 8 commits at current week, Saturday (Week 52, Day 6)
commit-bot grid -w 52 -d 6 -n 8

# 4. Target specific coordinate in a separate repo and auto-push
commit-bot grid -w 25 -d 1 -n 5 --repo ./graph-repo --push
```

---

## 3. `range` — Continuous Date Range

Fill a continuous date range with backdated commits. Supports variable commit counts and weekday filters.

### Syntax
```bash
commit-bot range -f <YYYY-MM-DD> -t <YYYY-MM-DD> [options]
```

### Permutations & Examples

```bash
# 1. Fill entire date range with default 1–3 commits per day (dry-run preview)
commit-bot range -f 2024-01-01 -t 2024-06-30 --dry-run

# 2. Custom commit density (between 3 and 10 commits daily)
commit-bot range -f 2024-03-01 -t 2024-03-31 --min 3 --max 10

# 3. Commit only on weekdays (Monday through Friday), skipping weekends
commit-bot range -f 2024-01-01 -t 2024-12-31 --min 1 --max 4 --weekdays-only

# 4. Fill date range in a newly initialized repo and push to GitHub
commit-bot range -f 2024-05-01 -t 2024-05-15 --init --repo ./spring-commits --push
```

---

## 4. `random` — Random Commit Scatter

Distribute a fixed number of commits randomly across a past time window.

### Syntax
```bash
commit-bot random -n <total_commits> [options]
```

### Permutations & Examples

```bash
# 1. Scatter 200 commits randomly across the last 365 days (dry-run)
commit-bot random -n 200 --days 365 --dry-run

# 2. Scatter 50 commits across the last 30 days
commit-bot random --total 50 --days 30

# 3. Scatter 150 commits across the last 180 days, restricting to weekdays only
commit-bot random -n 150 --days 180 --weekdays-only

# 4. Scatter commits with custom commit message and custom author details
commit-bot random -n 100 --days 90 --author "Ghost Committer" --email "ghost@dev.null" -m "chore: activity log"
```

---

## 5. `pattern` — Pixel Art & Text Rendering

Render custom text or predefined shapes onto the contribution graph using a 5×7 pixel font.

### Intensity Options
- `low`: 1 commit per active pixel
- `medium`: 3 commits per active pixel *(default)*
- `high`: 5 commits per active pixel
- `max`: 10 commits per active pixel

### Predefined Shapes
`heart` | `smiley` | `check` | `star` | `skull` | `wave` | `diamond`

### Syntax
```bash
commit-bot pattern [--text <string> | --shape <shape_name>] [options]
```

### Permutations & Examples

```bash
# 1. Render text "HI" for year 2024 (dry-run preview ASCII art)
commit-bot pattern --text "HI" --year 2024 --dry-run

# 2. Render text "2024" with high intensity (dark green pixels)
commit-bot pattern --text "2024" --year 2024 --intensity high

# 3. Render heart shape on year 2025 graph
commit-bot pattern --shape heart --year 2025 --intensity max

# 4. Render skull shape offset by 5 weeks from year start
commit-bot pattern --shape skull --year 2024 --offset 5

# 5. Draw smiley shape, auto-initialize repo, and push
commit-bot pattern --shape smiley --year 2025 --init --repo ./art-repo --push
```

---

## 6. `image` — Image to ASCII Art Rendering

Render images (like logos or pixel art) directly onto the contribution graph by converting image pixels to GitHub commits.

### Rendering Modes
- `grayscale`: Maps image brightness to the 5 GitHub green intensity levels. Best for pixel art and shaded images.
- `binary`: Strict on/off pixel mapping using a threshold. Best for crisp logos and silhouettes.

### Options
- `--file`, `-f <path>`: Path to the image file (required).
- `--year <YYYY>`: Target year.
- `--mode <grayscale|binary>`: Rendering mode (default: `grayscale`).
- `--width <number>`: Max width in weeks (1-53, default: 52).
- `--invert`: Invert brightness (dark becomes light and vice versa).
- `--threshold <0-255>`: Brightness cutoff for binary mode (default: 128).
- `--offset <number>`: Week offset from the start of the year (default: 0).

### Syntax
```bash
commit-bot image -f <path_to_image> [options]
```

### Permutations & Examples

```bash
# 1. Preview a logo rendering with binary thresholding
commit-bot image -f logo.png --mode binary --threshold 150 --dry-run

# 2. Render shaded pixel art for a specific year
commit-bot image -f mario.png --mode grayscale --year 2024

# 3. Render an inverted image (white foreground on black background)
commit-bot image -f apple_logo.png --mode binary --invert

# 4. Limit width to 20 weeks and add a 5 week offset
commit-bot image -f small_icon.png --width 20 --offset 5
```

---

## 7. `fill` — Solid Year Wall

Blanket an entire year (Jan 1 – Dec 31) with commits to create a solid green activity wall.

### Syntax
```bash
commit-bot fill --year <YYYY> [options]
```

### Permutations & Examples

```bash
# 1. Dry-run preview filling year 2024
commit-bot fill --year 2024 --dry-run

# 2. Solid wall with 2 to 6 commits per day
commit-bot fill --year 2024 --min 2 --max 6

# 3. Fill entire year for weekdays only (leaves weekends gray)
commit-bot fill --year 2024 --weekdays-only --min 1 --max 5

# 4. Fill past year (2023) in a dedicated repo and auto-push
commit-bot fill --year 2023 --repo ./year-wall --init --push
```

---

## 8. `wipe` — Repository Reset

Destructively clear bot commits and reinitialize the repository. Requires `--confirm` as a safety guard.

### Syntax
```bash
commit-bot wipe --confirm [options]
```

### Permutations & Examples

```bash
# 1. Attempt wipe (displays safety warning prompt)
commit-bot wipe

# 2. Confirmed local wipe & git re-initialization
commit-bot wipe --confirm

# 3. Confirmed wipe and force-push clean state to remote
commit-bot wipe --confirm --push

# 4. Wipe specific repository directory
commit-bot wipe --confirm --repo ./my-old-repo --push --branch main
```

---

## ⚡ Useful Execution Combinations

| Goal | Command Combination |
|---|---|
| **Preview a heart pattern** | `commit-bot pattern --shape heart --year 2025 --dry-run` |
| **Quick 1-liner test repo** | `commit-bot date -d 2025-01-01 -n 5 --init --repo ./test-repo --push` |
| **Realistic weekday activity** | `commit-bot random -n 250 --days 365 --weekdays-only` |
| **High contrast text** | `commit-bot pattern --text "CODE" --year 2024 --intensity max` |
| **Render a logo** | `commit-bot image -f logo.png --mode binary --threshold 128` |
| **Reset everything** | `commit-bot wipe --confirm --push` |
