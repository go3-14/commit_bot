"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildConfig = buildConfig;
exports.executeCommitPlan = executeCommitPlan;
exports.randomInt = randomInt;
const simple_git_1 = __importDefault(require("simple-git"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const date_fns_1 = require("date-fns");
const logger_1 = require("../utils/logger");
const constants_1 = require("../utils/constants");
/**
 * Extract a CommitConfig from Commander option values + defaults.
 */
function buildConfig(opts) {
    return {
        repoPath: path.resolve(opts.repo || '.'),
        message: opts.message || constants_1.DEFAULT_MESSAGE,
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
async function executeCommitPlan(plan, config) {
    logger_1.logger.setVerbose(config.verbose);
    // ── Dry run: just print the plan ──────────────────────────────
    if (config.dryRun) {
        printDryRun(plan);
        return 0;
    }
    const { repoPath, branch } = config;
    // ── Ensure repo exists ────────────────────────────────────────
    await ensureRepo(repoPath, branch, config.init);
    const filePath = path.join(repoPath, constants_1.CONTRIBUTION_FILE);
    // Ensure the contribution file exists
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '# Contributions\n\n');
    }
    // ── Generate commits ──────────────────────────────────────────
    const totalCommits = plan.reduce((sum, p) => sum + p.count, 0);
    const spin = logger_1.logger.spinner(`Creating ${totalCommits} commits across ${plan.length} days...`);
    spin.start();
    let completed = 0;
    for (const entry of plan) {
        for (let i = 0; i < entry.count; i++) {
            const commitDate = randomizeTime(entry.date);
            const dateStr = commitDate.toISOString();
            // Append a line to the contribution file
            const line = `${(0, date_fns_1.format)(commitDate, 'yyyy-MM-dd HH:mm:ss')} | commit #${completed + 1}\n`;
            fs.appendFileSync(filePath, line);
            // Create a git instance with backdated env vars
            const commitGit = (0, simple_git_1.default)({ baseDir: repoPath })
                .env('GIT_COMMITTER_DATE', dateStr)
                .env('GIT_AUTHOR_DATE', dateStr);
            await commitGit.add('.');
            const commitOpts = {
                '--date': dateStr,
            };
            if (config.authorName && config.authorEmail) {
                commitOpts['--author'] = `${config.authorName} <${config.authorEmail}>`;
            }
            await commitGit.commit(config.message, undefined, commitOpts);
            completed++;
            spin.text = `Creating commits... (${completed}/${totalCommits})`;
            logger_1.logger.debug(`Committed: ${(0, date_fns_1.format)(commitDate, 'yyyy-MM-dd HH:mm:ss')}`);
        }
    }
    spin.succeed(`Created ${completed} commits`);
    // ── Push if requested ─────────────────────────────────────────
    if (config.push) {
        const pushSpin = logger_1.logger.spinner('Pushing to remote...');
        pushSpin.start();
        try {
            const git = (0, simple_git_1.default)({ baseDir: repoPath });
            await git.push('origin', branch, ['--force']);
            pushSpin.succeed('Pushed to remote');
        }
        catch (err) {
            pushSpin.fail('Push failed: ' + err.message);
            logger_1.logger.warn('You can push manually with: git push origin ' + branch + ' --force');
        }
    }
    return completed;
}
/**
 * Ensure the target path is a valid git repository.
 * Optionally initialize one if --init is set.
 */
async function ensureRepo(repoPath, branch, init) {
    // Create directory if it doesn't exist
    if (!fs.existsSync(repoPath)) {
        if (init) {
            fs.mkdirSync(repoPath, { recursive: true });
        }
        else {
            logger_1.logger.error(`Directory does not exist: ${repoPath}`);
            logger_1.logger.info('Use --init to create it automatically');
            process.exit(1);
        }
    }
    const git = (0, simple_git_1.default)({ baseDir: repoPath });
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
        if (init) {
            logger_1.logger.info('Initializing new git repository...');
            await git.init();
            // Try to set the branch name
            try {
                await git.checkout(['-b', branch]);
            }
            catch {
                // Branch might already be the default
            }
            logger_1.logger.success(`Initialized git repo at ${repoPath}`);
        }
        else {
            logger_1.logger.error(`Not a git repository: ${repoPath}`);
            logger_1.logger.info('Use --init to initialize one, or cd into an existing repo');
            process.exit(1);
        }
    }
}
/**
 * Add a random time-of-day to a date for more realistic-looking commits.
 * Generates times between 8:00 AM and 10:00 PM.
 */
function randomizeTime(date) {
    const result = new Date(date);
    result.setHours(Math.floor(Math.random() * 14) + 8); // 8–22
    result.setMinutes(Math.floor(Math.random() * 60));
    result.setSeconds(Math.floor(Math.random() * 60));
    return result;
}
/**
 * Print a dry-run preview of the commit plan.
 */
function printDryRun(plan) {
    logger_1.logger.header('DRY RUN — No commits will be created');
    const totalCommits = plan.reduce((sum, p) => sum + p.count, 0);
    logger_1.logger.kv('Total days', plan.length);
    logger_1.logger.kv('Total commits', totalCommits);
    // Print the table
    const rows = plan.map((p) => ({
        date: (0, date_fns_1.format)(p.date, 'yyyy-MM-dd (EEE)'),
        commits: p.count,
    }));
    logger_1.logger.table(rows);
    // Build and render a mini graph
    const grid = Array.from({ length: constants_1.DAYS_PER_WEEK }, () => []);
    const allDates = plan.map((p) => p.date.getTime());
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    // Calculate the number of weeks spanned
    const msPerDay = 86400000;
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / msPerDay) + 1;
    const totalWeeks = Math.ceil(totalDays / 7) + 1;
    // Initialize grid
    for (let d = 0; d < constants_1.DAYS_PER_WEEK; d++) {
        grid[d] = Array(totalWeeks).fill(0);
    }
    // Fill grid
    for (const entry of plan) {
        const dayOffset = Math.floor((entry.date.getTime() - minDate.getTime()) / msPerDay);
        const week = Math.floor(dayOffset / 7);
        const day = entry.date.getDay(); // 0 = Sunday
        if (grid[day] && week < totalWeeks) {
            grid[day][week] = entry.count;
        }
    }
    logger_1.logger.miniGraph(grid, minDate);
}
/**
 * Helper to generate a random integer between min and max (inclusive).
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//# sourceMappingURL=committer.js.map