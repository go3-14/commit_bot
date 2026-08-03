import { Command } from 'commander';
import { parsePositiveInt } from '../utils/validators';
import { buildConfig, executeCommitPlan, CommitPlan } from '../core/committer';
import { addGlobalOptions } from './shared';
import { logger } from '../utils/logger';
import { subDays, startOfDay, format } from 'date-fns';

export function registerRandomCommand(program: Command): void {
  const cmd = program
    .command('random')
    .description('Scatter commits randomly across a time window')
    .requiredOption(
      '-n, --total <number>',
      'Total number of commits to distribute'
    )
    .option(
      '--days <number>',
      'Number of past days to scatter commits across',
      '365'
    )
    .option(
      '--weekdays-only',
      'Only commit on weekdays (Mon–Fri)',
      false
    );

  addGlobalOptions(cmd);

  cmd.action(async (opts) => {
    const totalCommits = parsePositiveInt(opts.total, '--total');
    const numDays = parsePositiveInt(opts.days, '--days');
    const config = buildConfig(opts);

    const today = startOfDay(new Date());

    // Build a pool of candidate days
    let candidateDays: Date[] = [];
    for (let i = 0; i < numDays; i++) {
      const day = subDays(today, i);
      if (opts.weekdaysOnly) {
        const dow = day.getDay();
        if (dow === 0 || dow === 6) continue; // skip weekends
      }
      candidateDays.push(day);
    }

    if (candidateDays.length === 0) {
      logger.error('No valid days found in the specified range');
      process.exit(1);
    }

    // Distribute commits randomly across candidate days
    const commitMap = new Map<number, number>();
    for (let i = 0; i < totalCommits; i++) {
      const idx = Math.floor(Math.random() * candidateDays.length);
      const key = candidateDays[idx].getTime();
      commitMap.set(key, (commitMap.get(key) || 0) + 1);
    }

    // Convert to plan (sorted by date)
    const plan: CommitPlan[] = Array.from(commitMap.entries())
      .map(([timestamp, count]) => ({
        date: new Date(timestamp),
        count,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const daysUsed = plan.length;

    logger.header(`commit-bot — Random Scatter`);
    logger.kv('Total commits', totalCommits);
    logger.kv('Window', `last ${numDays} days`);
    logger.kv('Days with commits', daysUsed);
    if (opts.weekdaysOnly) logger.kv('Weekdays only', 'yes');
    logger.blank();

    try {
      const total = await executeCommitPlan(plan, config);
      if (!config.dryRun) {
        logger.blank();
        logger.success(
          `Done! ${total} commits scattered across ${daysUsed} days`
        );
      }
    } catch (err: any) {
      logger.error(err.message);
      process.exit(1);
    }
  });
}
