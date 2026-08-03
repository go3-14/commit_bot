import chalk from 'chalk';
import ora, { Ora } from 'ora';

class Logger {
  private verbose = false;

  setVerbose(v: boolean): void {
    this.verbose = v;
  }

  /** Green success message */
  success(msg: string): void {
    console.log(chalk.green('✔ ') + msg);
  }

  /** Red error message */
  error(msg: string): void {
    console.log(chalk.red('✖ ') + msg);
  }

  /** Yellow warning message */
  warn(msg: string): void {
    console.log(chalk.yellow('⚠ ') + msg);
  }

  /** Blue info message */
  info(msg: string): void {
    console.log(chalk.blue('ℹ ') + msg);
  }

  /** Only prints when --verbose is active */
  debug(msg: string): void {
    if (this.verbose) {
      console.log(chalk.gray('  → ') + chalk.gray(msg));
    }
  }

  /** Print an empty line */
  blank(): void {
    console.log();
  }

  /** Bold header text */
  header(msg: string): void {
    console.log();
    console.log(chalk.bold.cyan(msg));
    console.log(chalk.cyan('─'.repeat(msg.length)));
  }

  /** Print a key-value pair */
  kv(key: string, value: string | number): void {
    console.log(chalk.gray(`  ${key}: `) + chalk.white(String(value)));
  }

  /** Create a spinner */
  spinner(text: string): Ora {
    return ora({ text, color: 'green' });
  }

  /** Print the dry-run preview table */
  table(rows: Array<{ date: string; commits: number }>): void {
    console.log();
    console.log(
      chalk.gray('  Date           ') + chalk.gray('Commits')
    );
    console.log(chalk.gray('  ─────────────  ───────'));
    for (const row of rows) {
      const bar = chalk.green('█'.repeat(Math.min(row.commits, 20)));
      console.log(
        `  ${chalk.white(row.date)}  ${chalk.yellow(
          String(row.commits).padStart(3)
        )} ${bar}`
      );
    }
    console.log();
  }

  /**
   * Render a mini ASCII contribution graph.
   * grid[day][week] = commit count (7 rows × N columns)
   */
  miniGraph(grid: number[][], startDate: Date): void {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    console.log();
    for (let day = 0; day < 7; day++) {
      const label = chalk.gray(dayLabels[day].padStart(4) + ' ');
      const cells = (grid[day] || [])
        .map((count) => {
          if (count === 0) return chalk.gray('░');
          if (count <= 2) return chalk.green('▒');
          if (count <= 5) return chalk.greenBright('▓');
          return chalk.greenBright('█');
        })
        .join('');
      console.log(label + cells);
    }
    console.log();
  }
}

export const logger = new Logger();
