"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
class Logger {
    constructor() {
        this.verbose = false;
    }
    setVerbose(v) {
        this.verbose = v;
    }
    /** Green success message */
    success(msg) {
        console.log(chalk_1.default.green('✔ ') + msg);
    }
    /** Red error message */
    error(msg) {
        console.log(chalk_1.default.red('✖ ') + msg);
    }
    /** Yellow warning message */
    warn(msg) {
        console.log(chalk_1.default.yellow('⚠ ') + msg);
    }
    /** Blue info message */
    info(msg) {
        console.log(chalk_1.default.blue('ℹ ') + msg);
    }
    /** Only prints when --verbose is active */
    debug(msg) {
        if (this.verbose) {
            console.log(chalk_1.default.gray('  → ') + chalk_1.default.gray(msg));
        }
    }
    /** Print an empty line */
    blank() {
        console.log();
    }
    /** Bold header text */
    header(msg) {
        console.log();
        console.log(chalk_1.default.bold.cyan(msg));
        console.log(chalk_1.default.cyan('─'.repeat(msg.length)));
    }
    /** Print a key-value pair */
    kv(key, value) {
        console.log(chalk_1.default.gray(`  ${key}: `) + chalk_1.default.white(String(value)));
    }
    /** Create a spinner */
    spinner(text) {
        return (0, ora_1.default)({ text, color: 'green' });
    }
    /** Print the dry-run preview table */
    table(rows) {
        console.log();
        console.log(chalk_1.default.gray('  Date           ') + chalk_1.default.gray('Commits'));
        console.log(chalk_1.default.gray('  ─────────────  ───────'));
        for (const row of rows) {
            const bar = chalk_1.default.green('█'.repeat(Math.min(row.commits, 20)));
            console.log(`  ${chalk_1.default.white(row.date)}  ${chalk_1.default.yellow(String(row.commits).padStart(3))} ${bar}`);
        }
        console.log();
    }
    /**
     * Render a mini ASCII contribution graph.
     * grid[day][week] = commit count (7 rows × N columns)
     */
    miniGraph(grid, startDate) {
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        console.log();
        for (let day = 0; day < 7; day++) {
            const label = chalk_1.default.gray(dayLabels[day].padStart(4) + ' ');
            const cells = (grid[day] || [])
                .map((count) => {
                if (count === 0)
                    return chalk_1.default.gray('░');
                if (count <= 2)
                    return chalk_1.default.green('▒');
                if (count <= 5)
                    return chalk_1.default.greenBright('▓');
                return chalk_1.default.greenBright('█');
            })
                .join('');
            console.log(label + cells);
        }
        console.log();
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map