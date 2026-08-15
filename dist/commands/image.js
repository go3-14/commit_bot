"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerImageCommand = registerImageCommand;
const committer_1 = require("../core/committer");
const image_processor_1 = require("../core/image-processor");
const shared_1 = require("./shared");
const logger_1 = require("../utils/logger");
const chalk_1 = __importDefault(require("chalk"));
function registerImageCommand(program) {
    const cmd = program
        .command('image')
        .description('Convert an image to GitHub contribution graph commits')
        .requiredOption('-f, --file <path>', 'Path to the image file (PNG, JPG, BMP, etc.)')
        .option('--year <number>', 'Target year', String(new Date().getFullYear()))
        .option('--mode <mode>', 'Rendering mode: "grayscale" (5 intensity levels) or "binary" (on/off)', 'grayscale')
        .option('--width <number>', 'Max width in weeks (columns)', '52')
        .option('--invert', 'Invert brightness (dark becomes light and vice versa)', false)
        .option('--threshold <number>', 'Brightness cutoff for binary mode (0-255)', '128')
        .option('--offset <number>', 'Week offset from start of year', '0');
    (0, shared_1.addGlobalOptions)(cmd);
    cmd.action(async (opts) => {
        // Validate mode
        const mode = opts.mode.toLowerCase();
        if (mode !== 'grayscale' && mode !== 'binary') {
            logger_1.logger.error('--mode must be "grayscale" or "binary"');
            process.exit(1);
        }
        const year = parseInt(opts.year, 10);
        const maxWidth = parseInt(opts.width, 10);
        const threshold = parseInt(opts.threshold, 10);
        const offset = parseInt(opts.offset, 10);
        const config = (0, committer_1.buildConfig)(opts);
        if (isNaN(year) || year < 2005 || year > 2100) {
            logger_1.logger.error('--year must be a valid year between 2005 and 2100');
            process.exit(1);
        }
        if (isNaN(maxWidth) || maxWidth < 1 || maxWidth > 53) {
            logger_1.logger.error('--width must be between 1 and 53');
            process.exit(1);
        }
        if (isNaN(threshold) || threshold < 0 || threshold > 255) {
            logger_1.logger.error('--threshold must be between 0 and 255');
            process.exit(1);
        }
        const imageOptions = {
            filePath: opts.file,
            year,
            mode: mode,
            maxWidth,
            invert: opts.invert || false,
            threshold,
            offset,
        };
        logger_1.logger.header('commit-bot — Image');
        logger_1.logger.kv('File', opts.file);
        logger_1.logger.kv('Year', year);
        logger_1.logger.kv('Mode', mode);
        logger_1.logger.kv('Max width', `${maxWidth} weeks`);
        if (opts.invert)
            logger_1.logger.kv('Invert', 'yes');
        if (mode === 'binary')
            logger_1.logger.kv('Threshold', threshold);
        logger_1.logger.blank();
        try {
            const spin = logger_1.logger.spinner('Processing image...');
            spin.start();
            const result = await (0, image_processor_1.processImage)(imageOptions);
            spin.succeed(`Image processed: ${result.width}x${result.height} pixels, ${result.activeCells} active cells`);
            // Show ASCII preview
            logger_1.logger.blank();
            logger_1.logger.info('Preview:');
            console.log();
            const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 0; i < result.preview.length; i++) {
                const label = chalk_1.default.gray(dayLabels[i]?.padStart(4) + ' ');
                console.log('  ' + label + chalk_1.default.green(result.preview[i]));
            }
            console.log();
            logger_1.logger.kv('Active cells', result.activeCells);
            logger_1.logger.kv('Total commits', result.totalCommits);
            logger_1.logger.blank();
            if (result.totalCommits === 0) {
                logger_1.logger.warn('No active pixels found. Try adjusting --threshold or --invert.');
                return;
            }
            const total = await (0, committer_1.executeCommitPlan)(result.plan, config);
            if (!config.dryRun) {
                logger_1.logger.blank();
                logger_1.logger.success(`Done! ${total} commits painted from image`);
            }
        }
        catch (err) {
            logger_1.logger.error(err.message);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=image.js.map