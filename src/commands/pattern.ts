import { Command } from 'commander';
import { validateIntensity } from '../utils/validators';
import { buildConfig, executeCommitPlan, CommitPlan } from '../core/committer';
import {
  textToPattern,
  shapeToPattern,
  getTextWidth,
  patternFits,
  renderPatternPreview,
} from '../core/pattern-engine';
import { INTENSITY_MAP, SHAPES } from '../utils/constants';
import { addGlobalOptions } from './shared';
import { logger } from '../utils/logger';
import chalk from 'chalk';

export function registerPatternCommand(program: Command): void {
  const cmd = program
    .command('pattern')
    .description('Draw text or shapes on the GitHub contribution graph')
    .option('--text <string>', 'Text to render (A-Z, 0-9, basic punctuation)')
    .option(
      '--shape <name>',
      `Predefined shape (${Object.keys(SHAPES).join(', ')})`
    )
    .option('--year <number>', 'Target year', String(new Date().getFullYear()))
    .option(
      '--intensity <level>',
      'Commit intensity: low (1), medium (3), high (5), max (10)',
      'medium'
    )
    .option(
      '--offset <number>',
      'Week offset from the start of the year',
      '1'
    );

  addGlobalOptions(cmd);

  cmd.action(async (opts) => {
    if (!opts.text && !opts.shape) {
      logger.error('You must provide either --text or --shape');
      logger.info('Examples:');
      logger.info('  commit-bot pattern --text "HI" --year 2024');
      logger.info('  commit-bot pattern --shape heart --year 2024');
      process.exit(1);
    }

    if (opts.text && opts.shape) {
      logger.error('Use either --text or --shape, not both');
      process.exit(1);
    }

    validateIntensity(opts.intensity);
    const intensity = INTENSITY_MAP[opts.intensity];
    const year = parseInt(opts.year, 10);
    const offset = parseInt(opts.offset, 10);
    const config = buildConfig(opts);

    let cells;
    let label: string;

    if (opts.text) {
      // Check if text fits
      const width = getTextWidth(opts.text);
      if (!patternFits(width)) {
        logger.error(
          `Text "${opts.text}" is ${width} weeks wide — too wide for the GitHub graph (max ~51 weeks).`
        );
        logger.info('Try shorter text or abbreviations.');
        process.exit(1);
      }

      cells = textToPattern(opts.text, year, offset);
      label = `"${opts.text}"`;
    } else {
      cells = shapeToPattern(opts.shape, year, offset);
      label = `shape: ${opts.shape}`;
    }

    if (cells.length === 0) {
      logger.error('Pattern produced no active cells');
      process.exit(1);
    }

    logger.header(`commit-bot — Pattern`);
    logger.kv('Pattern', label);
    logger.kv('Year', year);
    logger.kv('Intensity', `${opts.intensity} (${intensity} commits/cell)`);
    logger.kv('Active cells', cells.length);
    logger.kv('Total commits', cells.length * intensity);
    logger.blank();

    // Show ASCII preview
    const preview = renderPatternPreview(cells);
    logger.info('Preview:');
    console.log();
    for (const row of preview) {
      console.log('  ' + chalk.green(row));
    }
    console.log();

    // Build commit plan
    // Group cells by date to avoid duplicate date entries
    const dateMap = new Map<number, number>();
    for (const cell of cells) {
      const key = cell.date.getTime();
      dateMap.set(key, (dateMap.get(key) || 0) + intensity);
    }

    const plan: CommitPlan[] = Array.from(dateMap.entries())
      .map(([timestamp, count]) => ({
        date: new Date(timestamp),
        count,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    try {
      const total = await executeCommitPlan(plan, config);
      if (!config.dryRun) {
        logger.blank();
        logger.success(`Done! ${total} commits — pattern "${label}" painted on ${year}`);
      }
    } catch (err: any) {
      logger.error(err.message);
      process.exit(1);
    }
  });
}
