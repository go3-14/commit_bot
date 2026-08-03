import { Command } from 'commander';
import { parsePositiveInt } from '../utils/validators';
import { buildConfig, executeCommitPlan, randomInt, CommitPlan } from '../core/committer';
import { addGlobalOptions } from './shared';
import { logger } from '../utils/logger';
import { eachDayOfInterval } from 'date-fns';

export function registerFillCommand(program: Command): void {
  const cmd = program
    .command('fill')
    .description('Fill an entire year with commits (solid green wall)')
    .option('--year <number>', 'Target year to fill', String(new Date().getFullYear()))
    .option('--min <number>', 'Minimum commits per day', '1')
    .option('--max <number>', 'Maximum commits per day', '5')
    .option(
      '--weekdays-only',
      'Only commit on weekdays (Mon–Fri)',
      false
    );

  addGlobalOptions(cmd);

  cmd.action(async (opts) => {
    const year = parseInt(opts.year, 10);
    const min = parsePositiveInt(opts.min, '--min');
    const max = parsePositiveInt(opts.max, '--max');
    const config = buildConfig(opts);

    if (min > max) {
      logger.error('--min cannot be greater than --max');
      process.exit(1);
    }

    if (isNaN(year) || year < 2005 || year > 2100) {
      logger.error('--year must be a valid year between 2005 and 2100');
      process.exit(1);
    }

    const startDate = new Date(year, 0, 1); // Jan 1
    const endDate = new Date(year, 11, 31); // Dec 31

    let days = eachDayOfInterval({ start: startDate, end: endDate });

    if (opts.weekdaysOnly) {
      days = days.filter((d) => {
        const dow = d.getDay();
        return dow >= 1 && dow <= 5;
      });
    }

    const plan: CommitPlan[] = days.map((date) => ({
      date,
      count: randomInt(min, max),
    }));

    const totalCommits = plan.reduce((sum, p) => sum + p.count, 0);

    logger.header(`commit-bot — Fill Year`);
    logger.kv('Year', year);
    logger.kv('Days', plan.length);
    logger.kv('Commits per day', `${min}–${max}`);
    logger.kv('Total commits', totalCommits);
    if (opts.weekdaysOnly) logger.kv('Weekdays only', 'yes');
    logger.blank();

    if (totalCommits > 500 && !config.dryRun) {
      logger.warn(
        `This will create ${totalCommits} commits. This may take a while.`
      );
    }

    try {
      const total = await executeCommitPlan(plan, config);
      if (!config.dryRun) {
        logger.blank();
        logger.success(`Done! ${total} commits — year ${year} is now solid green 🟩`);
      }
    } catch (err: any) {
      logger.error(err.message);
      process.exit(1);
    }
  });
}
