"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFillCommand = registerFillCommand;
const validators_1 = require("../utils/validators");
const committer_1 = require("../core/committer");
const shared_1 = require("./shared");
const logger_1 = require("../utils/logger");
const date_fns_1 = require("date-fns");
function registerFillCommand(program) {
    const cmd = program
        .command('fill')
        .description('Fill an entire year with commits (solid green wall)')
        .option('--year <number>', 'Target year to fill', String(new Date().getFullYear()))
        .option('--min <number>', 'Minimum commits per day', '1')
        .option('--max <number>', 'Maximum commits per day', '5')
        .option('--weekdays-only', 'Only commit on weekdays (Mon–Fri)', false);
    (0, shared_1.addGlobalOptions)(cmd);
    cmd.action(async (opts) => {
        const year = parseInt(opts.year, 10);
        const min = (0, validators_1.parsePositiveInt)(opts.min, '--min');
        const max = (0, validators_1.parsePositiveInt)(opts.max, '--max');
        const config = (0, committer_1.buildConfig)(opts);
        if (min > max) {
            logger_1.logger.error('--min cannot be greater than --max');
            process.exit(1);
        }
        if (isNaN(year) || year < 2005 || year > 2100) {
            logger_1.logger.error('--year must be a valid year between 2005 and 2100');
            process.exit(1);
        }
        const startDate = new Date(year, 0, 1); // Jan 1
        const endDate = new Date(year, 11, 31); // Dec 31
        let days = (0, date_fns_1.eachDayOfInterval)({ start: startDate, end: endDate });
        if (opts.weekdaysOnly) {
            days = days.filter((d) => {
                const dow = d.getDay();
                return dow >= 1 && dow <= 5;
            });
        }
        const plan = days.map((date) => ({
            date,
            count: (0, committer_1.randomInt)(min, max),
        }));
        const totalCommits = plan.reduce((sum, p) => sum + p.count, 0);
        logger_1.logger.header(`commit-bot — Fill Year`);
        logger_1.logger.kv('Year', year);
        logger_1.logger.kv('Days', plan.length);
        logger_1.logger.kv('Commits per day', `${min}–${max}`);
        logger_1.logger.kv('Total commits', totalCommits);
        if (opts.weekdaysOnly)
            logger_1.logger.kv('Weekdays only', 'yes');
        logger_1.logger.blank();
        if (totalCommits > 500 && !config.dryRun) {
            logger_1.logger.warn(`This will create ${totalCommits} commits. This may take a while.`);
        }
        try {
            const total = await (0, committer_1.executeCommitPlan)(plan, config);
            if (!config.dryRun) {
                logger_1.logger.blank();
                logger_1.logger.success(`Done! ${total} commits — year ${year} is now solid green 🟩`);
            }
        }
        catch (err) {
            logger_1.logger.error(err.message);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=fill.js.map