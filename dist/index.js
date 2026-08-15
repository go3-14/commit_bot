#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const date_1 = require("./commands/date");
const grid_1 = require("./commands/grid");
const range_1 = require("./commands/range");
const random_1 = require("./commands/random");
const pattern_1 = require("./commands/pattern");
const fill_1 = require("./commands/fill");
const wipe_1 = require("./commands/wipe");
const image_1 = require("./commands/image");
const program = new commander_1.Command();
program
    .name('commit-bot')
    .description('🟩 Paint your GitHub contribution graph green — a CLI tool for generating backdated commits')
    .version('1.0.0')
    .addHelpText('after', `
Examples:
  $ commit-bot date -d 2024-03-15 -n 5           # 5 commits on March 15
  $ commit-bot grid -w 10 -d 3 -n 4              # 4 commits at week 10, Wednesday
  $ commit-bot range -f 2024-01-01 -t 2024-06-30  # Fill Jan–June 2024
  $ commit-bot random -n 200 --days 365           # 200 random commits in the last year
  $ commit-bot pattern --text "HI" --year 2024    # Write "HI" on the 2024 graph
  $ commit-bot pattern --shape heart --year 2024  # Draw a heart on the 2024 graph
  $ commit-bot fill --year 2024                   # Solid green wall for 2024
  $ commit-bot image -f logo.png --year 2024       # Render an image on the graph
  $ commit-bot wipe --confirm                     # Reset and start over
`);
(0, date_1.registerDateCommand)(program);
(0, grid_1.registerGridCommand)(program);
(0, range_1.registerRangeCommand)(program);
(0, random_1.registerRandomCommand)(program);
(0, pattern_1.registerPatternCommand)(program);
(0, fill_1.registerFillCommand)(program);
(0, image_1.registerImageCommand)(program);
(0, wipe_1.registerWipeCommand)(program);
program.parse(process.argv);
//# sourceMappingURL=index.js.map