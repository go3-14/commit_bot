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
exports.registerWipeCommand = registerWipeCommand;
const simple_git_1 = __importDefault(require("simple-git"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
const constants_1 = require("../utils/constants");
function registerWipeCommand(program) {
    program
        .command('wipe')
        .description('Remove all bot-generated commits and reset the repository')
        .option('--repo <path>', 'Path to the target git repository', '.')
        .option('--confirm', 'Skip confirmation prompt (required to actually wipe)', false)
        .option('--push', 'Force-push the reset to remote', false)
        .option('--branch <name>', 'Target branch', 'main')
        .action(async (opts) => {
        const repoPath = path.resolve(opts.repo || '.');
        if (!opts.confirm) {
            logger_1.logger.header('commit-bot — Wipe');
            logger_1.logger.warn('This will DELETE all git history in this repository and remove contributions.md.');
            logger_1.logger.warn('This action is IRREVERSIBLE.');
            logger_1.logger.blank();
            logger_1.logger.info('To proceed, run again with --confirm:');
            logger_1.logger.info(`  commit-bot wipe --confirm${opts.push ? ' --push' : ''}`);
            return;
        }
        const git = (0, simple_git_1.default)({ baseDir: repoPath });
        // Check if it's a git repo
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            logger_1.logger.error(`Not a git repository: ${repoPath}`);
            process.exit(1);
        }
        const spin = logger_1.logger.spinner('Wiping repository...');
        spin.start();
        try {
            // Remove the contributions file
            const contribPath = path.join(repoPath, constants_1.CONTRIBUTION_FILE);
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
            }
            catch {
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
                const pushSpin = logger_1.logger.spinner('Force-pushing to remote...');
                pushSpin.start();
                try {
                    await git.push('origin', opts.branch, ['--force']);
                    pushSpin.succeed('Force-pushed to remote');
                }
                catch (err) {
                    pushSpin.fail('Push failed: ' + err.message);
                    logger_1.logger.warn('You may need to set the remote first: git remote add origin <url>');
                }
            }
            logger_1.logger.blank();
            logger_1.logger.success('Clean slate! All bot commits have been removed.');
        }
        catch (err) {
            spin.fail('Wipe failed: ' + err.message);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=wipe.js.map