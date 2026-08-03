import { Command } from 'commander';
import { buildConfig, executeCommitPlan } from '../core/committer';
import { processImage, ImageOptions } from '../core/image-processor';
import { addGlobalOptions } from './shared';
import { logger } from '../utils/logger';
import chalk from 'chalk';

export function registerImageCommand(program: Command): void {
  const cmd = program
    .command('image')
    .description('Convert an image to GitHub contribution graph commits')
    .requiredOption('-f, --file <path>', 'Path to the image file (PNG, JPG, BMP, etc.)')
    .option('--year <number>', 'Target year', String(new Date().getFullYear()))
    .option(
      '--mode <mode>',
      'Rendering mode: "grayscale" (5 intensity levels) or "binary" (on/off)',
      'grayscale'
    )
    .option('--width <number>', 'Max width in weeks (columns)', '52')
    .option('--invert', 'Invert brightness (dark becomes light and vice versa)', false)
    .option(
      '--threshold <number>',
      'Brightness cutoff for binary mode (0-255)',
      '128'
    )
    .option('--offset <number>', 'Week offset from start of year', '0');

  addGlobalOptions(cmd);

  cmd.action(async (opts) => {
    // Validate mode
    const mode = opts.mode.toLowerCase();
    if (mode !== 'grayscale' && mode !== 'binary') {
      logger.error('--mode must be "grayscale" or "binary"');
      process.exit(1);
    }

    const year = parseInt(opts.year, 10);
    const maxWidth = parseInt(opts.width, 10);
    const threshold = parseInt(opts.threshold, 10);
    const offset = parseInt(opts.offset, 10);
    const config = buildConfig(opts);

    if (isNaN(year) || year < 2005 || year > 2100) {
      logger.error('--year must be a valid year between 2005 and 2100');
      process.exit(1);
    }

    if (isNaN(maxWidth) || maxWidth < 1 || maxWidth > 53) {
      logger.error('--width must be between 1 and 53');
      process.exit(1);
    }

    if (isNaN(threshold) || threshold < 0 || threshold > 255) {
      logger.error('--threshold must be between 0 and 255');
      process.exit(1);
    }

    const imageOptions: ImageOptions = {
      filePath: opts.file,
      year,
      mode: mode as 'grayscale' | 'binary',
      maxWidth,
      invert: opts.invert || false,
      threshold,
      offset,
    };

    logger.header('commit-bot — Image');
    logger.kv('File', opts.file);
    logger.kv('Year', year);
    logger.kv('Mode', mode);
    logger.kv('Max width', `${maxWidth} weeks`);
    if (opts.invert) logger.kv('Invert', 'yes');
    if (mode === 'binary') logger.kv('Threshold', threshold);
    logger.blank();

    try {
      const spin = logger.spinner('Processing image...');
      spin.start();

      const result = await processImage(imageOptions);

      spin.succeed(
        `Image processed: ${result.width}x${result.height} pixels, ${result.activeCells} active cells`
      );

      // Show ASCII preview
      logger.blank();
      logger.info('Preview:');
      console.log();

      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 0; i < result.preview.length; i++) {
        const label = chalk.gray(dayLabels[i]?.padStart(4) + ' ');
        console.log('  ' + label + chalk.green(result.preview[i]));
      }
      console.log();

      logger.kv('Active cells', result.activeCells);
      logger.kv('Total commits', result.totalCommits);
      logger.blank();

      if (result.totalCommits === 0) {
        logger.warn('No active pixels found. Try adjusting --threshold or --invert.');
        return;
      }

      const total = await executeCommitPlan(result.plan, config);
      if (!config.dryRun) {
        logger.blank();
        logger.success(`Done! ${total} commits painted from image`);
      }
    } catch (err: any) {
      logger.error(err.message);
      process.exit(1);
    }
  });
}
