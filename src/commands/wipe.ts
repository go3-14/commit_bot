import { Command } from 'commander';
import simpleGit from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';
import { CONTRIBUTION_FILE } from '../utils/constants';

export function registerWipeCommand(program: Command): void {
  program
    .command('wipe')
    .description('Remove all bot-generated commits and reset the repository')
    .option('--repo <path>', 'Path to the target git repository', '.')
    .option(
      '--confirm',
      'Skip confirmation prompt (required to actually wipe)',
      false
    )
    .option('--push', 'Force-push the reset to remote', false)
    .option('--branch <name>', 'Target branch', 'main')
    .action(async (opts) => {
      const repoPath = path.resolve(opts.repo || '.');

      if (!opts.confirm) {
        logger.header('commit-bot — Wipe');
        logger.warn(
          'This will DELETE all git history in this repository and remove contributions.md.'
        );
        logger.warn('This action is IRREVERSIBLE.');
        logger.blank();
        logger.info(
          'To proceed, run again with --confirm:'
        );
        logger.info(
          `  commit-bot wipe --confirm${opts.push ? ' --push' : ''}`
        );
        return;
      }

      const git = simpleGit({ baseDir: repoPath });

      // Check if it's a git repo
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        logger.error(`Not a git repository: ${repoPath}`);
        process.exit(1);
      }

      const spin = logger.spinner('Wiping repository...');
      spin.start();

      try {
        // Remove the contributions file
        const contribPath = path.join(repoPath, CONTRIBUTION_FILE);
        if (fs.existsSync(contribPath)) {
          fs.unlinkSync(contribPath);
        }

        // Delete the .git directory and reinitialize
        const gitDir = path.join(repoPath, '.git');
        if (fs.existsSync(gitDir)) {
          fs.rmSync(gitDir, { recursive: true, force: true });
        }

        // Re-initialize
        await git.init();
        try {
          await git.checkout(['-b', opts.branch]);
        } catch {
          // Branch may already be default
        }

        // Create a clean initial commit
        const readmePath = path.join(repoPath, 'README.md');
        if (!fs.existsSync(readmePath)) {
          fs.writeFileSync(readmePath, '# Repository\n');
        }
        await git.add('.');
        await git.commit('Initial commit');

        spin.succeed('Repository wiped and reinitialized');

        // Force push if requested
        if (opts.push) {
          const pushSpin = logger.spinner('Force-pushing to remote...');
          pushSpin.start();
          try {
            await git.push('origin', opts.branch, ['--force']);
            pushSpin.succeed('Force-pushed to remote');
          } catch (err: any) {
            pushSpin.fail('Push failed: ' + err.message);
            logger.warn(
              'You may need to set the remote first: git remote add origin <url>'
            );
          }
        }

        logger.blank();
        logger.success('Clean slate! All bot commits have been removed.');
      } catch (err: any) {
        spin.fail('Wipe failed: ' + err.message);
        process.exit(1);
      }
    });
}
