"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPatternCommand = registerPatternCommand;
const validators_1 = require("../utils/validators");
const committer_1 = require("../core/committer");
const pattern_engine_1 = require("../core/pattern-engine");
const constants_1 = require("../utils/constants");
const shared_1 = require("./shared");
const logger_1 = require("../utils/logger");
const chalk_1 = __importDefault(require("chalk"));
function registerPatternCommand(program) {
    const cmd = program
        .command('pattern')
        .description('Draw text or shapes on the GitHub contribution graph')
        .option('--text <string>', 'Text to render (A-Z, 0-9, basic punctuation)')
        .option('--shape <name>', `Predefined shape (${Object.keys(constants_1.SHAPES).join(', ')})`)
        .option('--year <number>', 'Target year', String(new Date().getFullYear()))
        .option('--intensity <level>', 'Commit intensity: low (1), medium (3), high (5), max (10)', 'medium')
        .option('--offset <number>', 'Week offset from the start of the year', '1');
    (0, shared_1.addGlobalOptions)(cmd);
    cmd.action(async (opts) => {
        if (!opts.text && !opts.shape) {
            logger_1.logger.error('You must provide either --text or --shape');
            logger_1.logger.info('Examples:');
            logger_1.logger.info('  commit-bot pattern --text "HI" --year 2024');
            logger_1.logger.info('  commit-bot pattern --shape heart --year 2024');
            process.exit(1);
        }
        if (opts.text && opts.shape) {
            logger_1.logger.error('Use either --text or --shape, not both');
            process.exit(1);
        }
        (0, validators_1.validateIntensity)(opts.intensity);
        const intensity = constants_1.INTENSITY_MAP[opts.intensity];
        const year = parseInt(opts.year, 10);
        const offset = parseInt(opts.offset, 10);
        const config = (0, committer_1.buildConfig)(opts);
        let cells;
        let label;
        if (opts.text) {
            // Check if text fits
            const width = (0, pattern_engine_1.getTextWidth)(opts.text);
            if (!(0, pattern_engine_1.patternFits)(width)) {
                logger_1.logger.error(`Text "${opts.text}" is ${width} weeks wide — too wide for the GitHub graph (max ~51 weeks).`);
                logger_1.logger.info('Try shorter text or abbreviations.');
                process.exit(1);
            }
            cells = (0, pattern_engine_1.textToPattern)(opts.text, year, offset);
            label = `"${opts.text}"`;
        }
        else {
            cells = (0, pattern_engine_1.shapeToPattern)(opts.shape, year, offset);
            label = `shape: ${opts.shape}`;
        }
        if (cells.length === 0) {
            logger_1.logger.error('Pattern produced no active cells');
            process.exit(1);
        }
        logger_1.logger.header(`commit-bot — Pattern`);
        logger_1.logger.kv('Pattern', label);
        logger_1.logger.kv('Year', year);
        logger_1.logger.kv('Intensity', `${opts.intensity} (${intensity} commits/cell)`);
        logger_1.logger.kv('Active cells', cells.length);
        logger_1.logger.kv('Total commits', cells.length * intensity);
        logger_1.logger.blank();
        // Show ASCII preview
        const preview = (0, pattern_engine_1.renderPatternPreview)(cells);
        logger_1.logger.info('Preview:');
        console.log();
        for (const row of preview) {
            console.log('  ' + chalk_1.default.green(row));
        }
        console.log();
        // Build commit plan
        // Group cells by date to avoid duplicate date entries
        const dateMap = new Map();
        for (const cell of cells) {
            const key = cell.date.getTime();
            dateMap.set(key, (dateMap.get(key) || 0) + intensity);
        }
        const plan = Array.from(dateMap.entries())
            .map(([timestamp, count]) => ({
            date: new Date(timestamp),
            count,
        }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
        try {
            const total = await (0, committer_1.executeCommitPlan)(plan, config);
            if (!config.dryRun) {
                logger_1.logger.blank();
                logger_1.logger.success(`Done! ${total} commits — pattern "${label}" painted on ${year}`);
            }
        }
        catch (err) {
            logger_1.logger.error(err.message);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=pattern.js.map