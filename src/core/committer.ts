import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';
import { logger } from '../utils/logger';
import { CONTRIBUTION_FILE, DEFAULT_MESSAGE, DAYS_PER_WEEK } from '../utils/constants';

/** A single entry in the commit plan: a date and how many commits to make */
export interface CommitPlan {
  date: Date;
  count: number;
}

/** Configuration for executing a commit plan */
export interface CommitConfig {
  repoPath: string;
  message: string;
  authorName?: string;
  authorEmail?: string;
  branch: string;
  push: boolean;
  dryRun: boolean;
  init: boolean;
  verbose: boolean;
}

/**
 * Extract a CommitConfig from Commander option values + defaults.
 */
export function buildConfig(opts: Record<string, any>): CommitConfig {
  return {
    repoPath: path.resolve(opts.repo || '.'),
    message: opts.message || DEFAULT_MESSAGE,
    authorName: opts.author,
    authorEmail: opts.email,
    branch: opts.branch || 'main',
    push: opts.push || false,
    dryRun: opts.dryRun || false,
    init: opts.init || false,
    verbose: opts.verbose || false,
  };
}

/**
 * Execute a commit plan — the core engine that drives every command.
 *
 * @param plan  - Array of { date, count } entries
 * @param config - Execution configuration
 * @returns Total number of commits created
 */
export async function executeCommitPlan(
  plan: CommitPlan[],
  config: CommitConfig
): Promise<number> {
  logger.setVerbose(config.verbose);

  // ── Dry run: just print the plan ──────────────────────────────
  if (config.dryRun) {
    printDryRun(plan);
    return 0;
  }

  const { repoPath, branch } = config;

  // ── Ensure repo exists ────────────────────────────────────────
  await ensureRepo(repoPath, branch, config.init);

  const filePath = path.join(repoPath, CONTRIBUTION_FILE);

  // Ensure the contribution file exists
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '# Contributions\n\n');
  }

  // ── Generate commits ──────────────────────────────────────────
  const totalCommits = plan.reduce((sum, p) => sum + p.count, 0);
  const spin = logger.spinner(
    `Creating ${totalCommits} commits across ${plan.length} days...`
  );
  spin.start();

  let completed = 0;

  for (const entry of plan) {
    for (let i = 0; i < entry.count; i++) {
      const commitDate = randomizeTime(entry.date);
      const dateStr = commitDate.toISOString();

      // Append a line to the contribution file
      const line = `${format(commitDate, 'yyyy-MM-dd HH:mm:ss')} | commit #${completed + 1}\n`;
      fs.appendFileSync(filePath, line);

      // Create a git instance with backdated env vars
      const commitGit = simpleGit({ baseDir: repoPath })
        .env('GIT_COMMITTER_DATE', dateStr)
        .env('GIT_AUTHOR_DATE', dateStr);

      await commitGit.add('.');

      const commitOpts: Record<string, string> = {
        '--date': dateStr,
      };

      if (config.authorName && config.authorEmail) {
        commitOpts['--author'] = `${config.authorName} <${config.authorEmail}>`;
      }

      await commitGit.commit(config.message, undefined, commitOpts);

      completed++;
      spin.text = `Creating commits... (${completed}/${totalCommits})`;
      logger.debug(`Committed: ${format(commitDate, 'yyyy-MM-dd HH:mm:ss')}`);
    }
  }

  spin.succeed(`Created ${completed} commits`);

  // ── Push if requested ─────────────────────────────────────────
  if (config.push) {
    const pushSpin = logger.spinner('Pushing to remote...');
    pushSpin.start();
    try {
      const git = simpleGit({ baseDir: repoPath });
      await git.push('origin', branch, ['--force']);
      pushSpin.succeed('Pushed to remote');
    } catch (err: any) {
      pushSpin.fail('Push failed: ' + err.message);
      logger.warn('You can push manually with: git push origin ' + branch + ' --force');
    }
  }

  return completed;
}

/**
 * Ensure the target path is a valid git repository.
 * Optionally initialize one if --init is set.
 */
async function ensureRepo(
  repoPath: string,
  branch: string,
  init: boolean
): Promise<void> {
  // Create directory if it doesn't exist
  if (!fs.existsSync(repoPath)) {
    if (init) {
      fs.mkdirSync(repoPath, { recursive: true });
    } else {
      logger.error(`Directory does not exist: ${repoPath}`);
      logger.info('Use --init to create it automatically');
      process.exit(1);
    }
  }

  const git = simpleGit({ baseDir: repoPath });
  const isRepo = await git.checkIsRepo();

  if (!isRepo) {
    if (init) {
      logger.info('Initializing new git repository...');
      await git.init();
      // Try to set the branch name
      try {
        await git.checkout(['-b', branch]);
      } catch {
        // Branch might already be the default
      }
      logger.success(`Initialized git repo at ${repoPath}`);
    } else {
      logger.error(`Not a git repository: ${repoPath}`);
      logger.info('Use --init to initialize one, or cd into an existing repo');
      process.exit(1);
    }
  }
}

/**
 * Add a random time-of-day to a date for more realistic-looking commits.
 * Generates times between 8:00 AM and 10:00 PM.
 */
function randomizeTime(date: Date): Date {
  const result = new Date(date);
  result.setHours(Math.floor(Math.random() * 14) + 8); // 8–22
  result.setMinutes(Math.floor(Math.random() * 60));
  result.setSeconds(Math.floor(Math.random() * 60));
  return result;
}

/**
 * Print a dry-run preview of the commit plan.
 */
function printDryRun(plan: CommitPlan[]): void {
  logger.header('DRY RUN — No commits will be created');

  const totalCommits = plan.reduce((sum, p) => sum + p.count, 0);
  logger.kv('Total days', plan.length);
  logger.kv('Total commits', totalCommits);

  // Print the table
  const rows = plan.map((p) => ({
    date: format(p.date, 'yyyy-MM-dd (EEE)'),
    commits: p.count,
  }));
  logger.table(rows);

  // Build and render a mini graph
  const grid: number[][] = Array.from({ length: DAYS_PER_WEEK }, () => []);
  const allDates = plan.map((p) => p.date.getTime());
  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));

  // Calculate the number of weeks spanned
  const msPerDay = 86400000;
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / msPerDay) + 1;
  const totalWeeks = Math.ceil(totalDays / 7) + 1;

  // Initialize grid
  for (let d = 0; d < DAYS_PER_WEEK; d++) {
    grid[d] = Array(totalWeeks).fill(0);
  }

  // Fill grid
  for (const entry of plan) {
    const dayOffset = Math.floor(
      (entry.date.getTime() - minDate.getTime()) / msPerDay
    );
    const week = Math.floor(dayOffset / 7);
    const day = entry.date.getDay(); // 0 = Sunday
    if (grid[day] && week < totalWeeks) {
      grid[day][week] = entry.count;
    }
  }

  logger.miniGraph(grid, minDate);
}

/**
 * Helper to generate a random integer between min and max (inclusive).
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
