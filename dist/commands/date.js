"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDateCommand = registerDateCommand;
const validators_1 = require("../utils/validators");
const committer_1 = require("../core/committer");
const shared_1 = require("./shared");
const logger_1 = require("../utils/logger");
function registerDateCommand(program) {
    const cmd = program
        .command('date')
        .description('Create commits on a specific date')
        .requiredOption('-d, --date <date>', 'Target date (YYYY-MM-DD)')
        .option('-n, --commits <number>', 'Number of commits to create', '1');
    (0, shared_1.addGlobalOptions)(cmd);
    cmd.action(async (opts) => {
        const targetDate = (0, validators_1.parseDate)(opts.date, '--date');
        const numCommits = (0, validators_1.parsePositiveInt)(opts.commits, '--commits');
        const config = (0, committer_1.buildConfig)(opts);
        logger_1.logger.header(`commit-bot — Single Date`);
        logger_1.logger.kv('Date', opts.date);
        logger_1.logger.kv('Commits', numCommits);
        logger_1.logger.blank();
        const plan = [{ date: targetDate, count: numCommits }];
        try {
            const total = await (0, committer_1.executeCommitPlan)(plan, config);
            if (!config.dryRun) {
                logger_1.logger.blank();
                logger_1.logger.success(`Done! ${total} commit(s) created for ${opts.date}`);
            }
        }
        catch (err) {
            logger_1.logger.error(err.message);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=date.js.map