"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRandomCommand = registerRandomCommand;
const validators_1 = require("../utils/validators");
const committer_1 = require("../core/committer");
const shared_1 = require("./shared");
const logger_1 = require("../utils/logger");
const date_fns_1 = require("date-fns");
function registerRandomCommand(program) {
    const cmd = program
        .command('random')
        .description('Scatter commits randomly across a time window')
        .requiredOption('-n, --total <number>', 'Total number of commits to distribute')
        .option('--days <number>', 'Number of past days to scatter commits across', '365')
        .option('--weekdays-only', 'Only commit on weekdays (Mon–Fri)', false);
    (0, shared_1.addGlobalOptions)(cmd);
    cmd.action(async (opts) => {
        const totalCommits = (0, validators_1.parsePositiveInt)(opts.total, '--total');
        const numDays = (0, validators_1.parsePositiveInt)(opts.days, '--days');
        const config = (0, committer_1.buildConfig)(opts);
        const today = (0, date_fns_1.startOfDay)(new Date());
        // Build a pool of candidate days
        let candidateDays = [];
        for (let i = 0; i < numDays; i++) {
            const day = (0, date_fns_1.subDays)(today, i);
            if (opts.weekdaysOnly) {
                const dow = day.getDay();
                if (dow === 0 || dow === 6)
                    continue; // skip weekends
            }
            candidateDays.push(day);
        }
        if (candidateDays.length === 0) {
            logger_1.logger.error('No valid days found in the specified range');
            process.exit(1);
        }
        // Distribute commits randomly across candidate days
        const commitMap = new Map();
        for (let i = 0; i < totalCommits; i++) {
            const idx = Math.floor(Math.random() * candidateDays.length);
            const key = candidateDays[idx].getTime();
            commitMap.set(key, (commitMap.get(key) || 0) + 1);
        }
        // Convert to plan (sorted by date)
        const plan = Array.from(commitMap.entries())
            .map(([timestamp, count]) => ({
            date: new Date(timestamp),
            count,
        }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
        const daysUsed = plan.length;
        logger_1.logger.header(`commit-bot — Random Scatter`);
        logger_1.logger.kv('Total commits', totalCommits);
        logger_1.logger.kv('Window', `last ${numDays} days`);
        logger_1.logger.kv('Days with commits', daysUsed);
        if (opts.weekdaysOnly)
            logger_1.logger.kv('Weekdays only', 'yes');
        logger_1.logger.blank();
        try {
            const total = await (0, committer_1.executeCommitPlan)(plan, config);
            if (!config.dryRun) {
                logger_1.logger.blank();
                logger_1.logger.success(`Done! ${total} commits scattered across ${daysUsed} days`);
            }
        }
        catch (err) {
            logger_1.logger.error(err.message);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=random.js.map