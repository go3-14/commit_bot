import { Command } from 'commander';
import { parseNonNegativeInt, parsePositiveInt, validateGridCoords } from '../utils/validators';
import { gridToDate } from '../core/grid-mapper';
import { buildConfig, executeCommitPlan, CommitPlan } from '../core/committer';
import { addGlobalOptions } from './shared';
import { logger } from '../utils/logger';
import { format } from 'date-fns';

export function registerGridCommand(program: Command): void {
  const cmd = program
    .command('grid')
    .description('Create commits at a specific (week, day) on the GitHub graph')
    .requiredOption('-w, --week <number>', 'Week column (0 = oldest, 52 = current)')
    .requiredOption('-d, --day <number>', 'Day row (0 = Sun, 1 = Mon, ... 6 = Sat)')
    .option('-n, --commits <number>', 'Number of commits to create', '1');

  addGlobalOptions(cmd);

  cmd.action(async (opts) => {
    const week = parseNonNegativeInt(opts.week, '--week');
    const day = parseNonNegativeInt(opts.day, '--day');
    const numCommits = parsePositiveInt(opts.commits, '--commits');
    const config = buildConfig(opts);

    validateGridCoords(week, day);

    const targetDate = gridToDate(week, day);

    logger.header(`commit-bot — Grid Coordinate`);
    logger.kv('Position', `(week: ${week}, day: ${day})`);
    logger.kv('Maps to', format(targetDate, 'yyyy-MM-dd (EEEE)'));
    logger.kv('Commits', numCommits);
    logger.blank();

    const plan: CommitPlan[] = [{ date: targetDate, count: numCommits }];

    try {
      const total = await executeCommitPlan(plan, config);
      if (!config.dryRun) {
        logger.blank();
        logger.success(`Done! ${total} commit(s) at grid (${week}, ${day})`);
      }
    } catch (err: any) {
      logger.error(err.message);
      process.exit(1);
    }
  });
}
