"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addGlobalOptions = addGlobalOptions;
/**
 * Add global options common to all subcommands.
 */
function addGlobalOptions(cmd) {
    return cmd
        .option('--repo <path>', 'Path to the target git repository', '.')
        .option('--author <name>', 'Override commit author name')
        .option('--email <email>', 'Override commit author email')
        .option('-m, --message <msg>', 'Custom commit message', 'chore: update')
        .option('--push', 'Auto-push to remote after committing', false)
        .option('--branch <name>', 'Target branch', 'main')
        .option('--dry-run', 'Preview without making any commits', false)
        .option('--init', 'Initialize a new git repo if one does not exist', false)
        .option('--verbose', 'Show detailed output', false);
}
//# sourceMappingURL=shared.js.map