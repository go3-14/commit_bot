import { Command } from 'commander';
import { parseDate, parsePositiveInt, validateDateRange } from '../utils/validators';
import { buildConfig, executeCommitPlan, randomInt, CommitPlan } from '../core/committer';
import { addGlobalOptions } from './shared';
import { logger } from '../utils/logger';
import { eachDayOfInterval, format } from 'date-fns';

export function registerRangeCommand(program: Command): void {
  const cmd = program
    .command('range')
    .description('Create commits across a date range')
    .requiredOption('-f, --from <date>', 'Start date (YYYY-MM-DD)')
    .requiredOption('-t, --to <date>', 'End date (YYYY-MM-DD)')
    .option('--min <number>', 'Minimum commits per day', '1')
    .option('--max <number>', 'Maximum commits per day', '3')
    .option(
      '--weekdays-only',
      'Only commit on weekdays (Mon–Fri)',
      false
    );

  addGlobalOptions(cmd);

  cmd.action(async (opts) => {
    const fromDate = parseDate(opts.from, '--from');
    const toDate = parseDate(opts.to, '--to');
    const min = parsePositiveInt(opts.min, '--min');
    const max = parsePositiveInt(opts.max, '--max');
    const config = buildConfig(opts);

    validateDateRange(fromDate, toDate);

    if (min > max) {
      logger.error('--min cannot be greater than --max');
      process.exit(1);
    }

    // Generate all days in the range
    let days = eachDayOfInterval({ start: fromDate, end: toDate });

    // Filter weekdays if requested
    if (opts.weekdaysOnly) {
      days = days.filter((d) => {
        const dow = d.getDay();
        return dow >= 1 && dow <= 5; // Mon=1 .. Fri=5
      });
    }

    const plan: CommitPlan[] = days.map((date) => ({
      date,
      count: randomInt(min, max),
    }));

    logger.header(`commit-bot — Date Range`);
    logger.kv('From', format(fromDate, 'yyyy-MM-dd'));
    logger.kv('To', format(toDate, 'yyyy-MM-dd'));
    logger.kv('Days', plan.length);
    logger.kv('Commits per day', `${min}–${max}`);
    if (opts.weekdaysOnly) logger.kv('Weekdays only', 'yes');
    logger.blank();

    try {
      const total = await executeCommitPlan(plan, config);
      if (!config.dryRun) {
        logger.blank();
        logger.success(
          `Done! ${total} commits across ${plan.length} days`
        );
      }
    } catch (err: any) {
      logger.error(err.message);
      process.exit(1);
    }
  });
}
