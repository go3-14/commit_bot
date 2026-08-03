import { Command } from 'commander';
import { parseDate, parsePositiveInt } from '../utils/validators';
import { buildConfig, executeCommitPlan, CommitPlan } from '../core/committer';
import { addGlobalOptions } from './shared';
import { logger } from '../utils/logger';

export function registerDateCommand(program: Command): void {
  const cmd = program
    .command('date')
    .description('Create commits on a specific date')
    .requiredOption('-d, --date <date>', 'Target date (YYYY-MM-DD)')
    .option('-n, --commits <number>', 'Number of commits to create', '1');

  addGlobalOptions(cmd);

  cmd.action(async (opts) => {
    const targetDate = parseDate(opts.date, '--date');
    const numCommits = parsePositiveInt(opts.commits, '--commits');
    const config = buildConfig(opts);

    logger.header(`commit-bot — Single Date`);
    logger.kv('Date', opts.date);
    logger.kv('Commits', numCommits);
    logger.blank();

    const plan: CommitPlan[] = [{ date: targetDate, count: numCommits }];

    try {
      const total = await executeCommitPlan(plan, config);
      if (!config.dryRun) {
        logger.blank();
        logger.success(`Done! ${total} commit(s) created for ${opts.date}`);
      }
    } catch (err: any) {
      logger.error(err.message);
      process.exit(1);
    }
  });
}
