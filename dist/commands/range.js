"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRangeCommand = registerRangeCommand;
const validators_1 = require("../utils/validators");
const committer_1 = require("../core/committer");
const shared_1 = require("./shared");
const logger_1 = require("../utils/logger");
const date_fns_1 = require("date-fns");
function registerRangeCommand(program) {
    const cmd = program
        .command('range')
        .description('Create commits across a date range')
        .requiredOption('-f, --from <date>', 'Start date (YYYY-MM-DD)')
        .requiredOption('-t, --to <date>', 'End date (YYYY-MM-DD)')
        .option('--min <number>', 'Minimum commits per day', '1')
        .option('--max <number>', 'Maximum commits per day', '3')
        .option('--weekdays-only', 'Only commit on weekdays (Mon–Fri)', false);
    (0, shared_1.addGlobalOptions)(cmd);
    cmd.action(async (opts) => {
        const fromDate = (0, validators_1.parseDate)(opts.from, '--from');
        const toDate = (0, validators_1.parseDate)(opts.to, '--to');
        const min = (0, validators_1.parsePositiveInt)(opts.min, '--min');
        const max = (0, validators_1.parsePositiveInt)(opts.max, '--max');
        const config = (0, committer_1.buildConfig)(opts);
        (0, validators_1.validateDateRange)(fromDate, toDate);
        if (min > max) {
            logger_1.logger.error('--min cannot be greater than --max');
            process.exit(1);
        }
        // Generate all days in the range
        let days = (0, date_fns_1.eachDayOfInterval)({ start: fromDate, end: toDate });
        // Filter weekdays if requested
        if (opts.weekdaysOnly) {
            days = days.filter((d) => {
                const dow = d.getDay();
                return dow >= 1 && dow <= 5; // Mon=1 .. Fri=5
            });
        }
        const plan = days.map((date) => ({
            date,
            count: (0, committer_1.randomInt)(min, max),
        }));
        logger_1.logger.header(`commit-bot — Date Range`);
        logger_1.logger.kv('From', (0, date_fns_1.format)(fromDate, 'yyyy-MM-dd'));
        logger_1.logger.kv('To', (0, date_fns_1.format)(toDate, 'yyyy-MM-dd'));
        logger_1.logger.kv('Days', plan.length);
        logger_1.logger.kv('Commits per day', `${min}–${max}`);
        if (opts.weekdaysOnly)
            logger_1.logger.kv('Weekdays only', 'yes');
        logger_1.logger.blank();
        try {
            const total = await (0, committer_1.executeCommitPlan)(plan, config);
            if (!config.dryRun) {
                logger_1.logger.blank();
                logger_1.logger.success(`Done! ${total} commits across ${plan.length} days`);
            }
        }
        catch (err) {
            logger_1.logger.error(err.message);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=range.js.map