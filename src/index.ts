#!/usr/bin/env node

import { Command } from 'commander';
import { registerDateCommand } from './commands/date';
import { registerGridCommand } from './commands/grid';
import { registerRangeCommand } from './commands/range';
import { registerRandomCommand } from './commands/random';
import { registerPatternCommand } from './commands/pattern';
import { registerFillCommand } from './commands/fill';
import { registerWipeCommand } from './commands/wipe';
import { registerImageCommand } from './commands/image';

const program = new Command();

program
  .name('commit-bot')
  .description(
    '🟩 Paint your GitHub contribution graph green — a CLI tool for generating backdated commits'
  )
  .version('1.0.0')
  .addHelpText(
    'after',
    `
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
`
  );

registerDateCommand(program);
registerGridCommand(program);
registerRangeCommand(program);
registerRandomCommand(program);
registerPatternCommand(program);
registerFillCommand(program);
registerImageCommand(program);
registerWipeCommand(program);

program.parse(process.argv);
