"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGridCommand = registerGridCommand;
const validators_1 = require("../utils/validators");
const grid_mapper_1 = require("../core/grid-mapper");
const committer_1 = require("../core/committer");
const shared_1 = require("./shared");
const logger_1 = require("../utils/logger");
const date_fns_1 = require("date-fns");
function registerGridCommand(program) {
    const cmd = program
        .command('grid')
        .description('Create commits at a specific (week, day) on the GitHub graph')
        .requiredOption('-w, --week <number>', 'Week column (0 = oldest, 52 = current)')
        .requiredOption('-d, --day <number>', 'Day row (0 = Sun, 1 = Mon, ... 6 = Sat)')
        .option('-n, --commits <number>', 'Number of commits to create', '1');
    (0, shared_1.addGlobalOptions)(cmd);
    cmd.action(async (opts) => {
        const week = (0, validators_1.parseNonNegativeInt)(opts.week, '--week');
        const day = (0, validators_1.parseNonNegativeInt)(opts.day, '--day');
        const numCommits = (0, validators_1.parsePositiveInt)(opts.commits, '--commits');
        const config = (0, committer_1.buildConfig)(opts);
        (0, validators_1.validateGridCoords)(week, day);
        const targetDate = (0, grid_mapper_1.gridToDate)(week, day);
        logger_1.logger.header(`commit-bot — Grid Coordinate`);
        logger_1.logger.kv('Position', `(week: ${week}, day: ${day})`);
        logger_1.logger.kv('Maps to', (0, date_fns_1.format)(targetDate, 'yyyy-MM-dd (EEEE)'));
        logger_1.logger.kv('Commits', numCommits);
        logger_1.logger.blank();
        const plan = [{ date: targetDate, count: numCommits }];
        try {
            const total = await (0, committer_1.executeCommitPlan)(plan, config);
            if (!config.dryRun) {
                logger_1.logger.blank();
                logger_1.logger.success(`Done! ${total} commit(s) at grid (${week}, ${day})`);
            }
        }
        catch (err) {
            logger_1.logger.error(err.message);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=grid.js.map