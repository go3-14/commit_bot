import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { DAYS_PER_WEEK } from '../utils/constants';
import { yearGridToDate } from './grid-mapper';
import { CommitPlan } from './committer';

/** Image processing options */
export interface ImageOptions {
  filePath: string;
  year: number;
  mode: 'grayscale' | 'binary';
  maxWidth: number;
  invert: boolean;
  threshold: number;
  offset: number;
}

/** Grayscale brightness-to-commit mapping (5 levels) */
const GRAYSCALE_LEVELS: Array<{ max: number; commits: number }> = [
  { max: 51, commits: 10 },  // Darkest green
  { max: 102, commits: 5 },  // Dark green
  { max: 153, commits: 3 },  // Medium green
  { max: 204, commits: 1 },  // Light green
  { max: 255, commits: 0 },  // Empty
];

/** Default commits for binary "on" pixels */
const BINARY_ON_COMMITS = 5;

/**
 * Load an image, resize it to fit the GitHub grid, and convert to a
 * 2D brightness grid (7 rows × width cols).
 *
 * @returns A grid of brightness values (0–255), where grid[row][col]
 */
export async function loadImage(
  filePath: string,
  maxWidth: number
): Promise<{ pixels: number[][]; width: number; height: number }> {
  const absPath = path.resolve(filePath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`Image file not found: ${absPath}`);
  }

  // Resize to fit maxWidth × 7, maintaining aspect ratio
  const image = sharp(absPath)
    .resize({
      width: maxWidth,
      height: DAYS_PER_WEEK,
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }, // white padding
    })
    .grayscale()
    .flatten({ background: { r: 255, g: 255, b: 255 } }); // flatten transparency to white

  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;

  // Build 2D grid: pixels[row][col] = brightness (0–255)
  const pixels: number[][] = [];
  for (let row = 0; row < height; row++) {
    const rowData: number[] = [];
    for (let col = 0; col < width; col++) {
      const idx = row * width + col;
      rowData.push(data[idx]);
    }
    pixels.push(rowData);
  }

  return { pixels, width, height };
}

/**
 * Convert a brightness grid to a commit count grid.
 *
 * @param pixels - 2D brightness grid (0–255)
 * @param mode - 'grayscale' (5 levels) or 'binary' (on/off)
 * @param invert - If true, dark pixels = fewer commits (flip the mapping)
 * @param threshold - Brightness cutoff for binary mode (0–255)
 * @returns 2D grid of commit counts: grid[row][col] = number of commits
 */
export function pixelsToCommitGrid(
  pixels: number[][],
  mode: 'grayscale' | 'binary',
  invert: boolean,
  threshold: number
): number[][] {
  const height = pixels.length;
  const width = pixels[0]?.length || 0;

  const grid: number[][] = [];

  for (let row = 0; row < height; row++) {
    const rowData: number[] = [];
    for (let col = 0; col < width; col++) {
      let brightness = pixels[row][col];

      // Invert if requested (dark becomes light and vice versa)
      if (invert) {
        brightness = 255 - brightness;
      }

      let commits: number;

      if (mode === 'binary') {
        commits = brightness < threshold ? BINARY_ON_COMMITS : 0;
      } else {
        // Grayscale: map brightness to commit count
        commits = 0;
        for (const level of GRAYSCALE_LEVELS) {
          if (brightness <= level.max) {
            commits = level.commits;
            break;
          }
        }
      }

      rowData.push(commits);
    }
    grid.push(rowData);
  }

  return grid;
}

/**
 * Convert a commit count grid to a CommitPlan[] using calendar dates.
 *
 * @param grid - 2D commit grid: grid[row][col] = commits
 * @param year - Target year
 * @param offset - Week offset from start of year
 * @returns Sorted CommitPlan array
 */
export function gridToCommitPlan(
  grid: number[][],
  year: number,
  offset: number
): CommitPlan[] {
  const dateMap = new Map<number, number>();

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const commits = grid[row][col];
      if (commits <= 0) continue;

      const date = yearGridToDate(col + offset, row, year);
      const key = date.getTime();
      dateMap.set(key, (dateMap.get(key) || 0) + commits);
    }
  }

  return Array.from(dateMap.entries())
    .map(([timestamp, count]) => ({
      date: new Date(timestamp),
      count,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Render a commit grid as an ASCII preview for the terminal.
 *
 * @param grid - 2D commit grid
 * @returns Array of 7 strings (one per day-row)
 */
export function renderGridPreview(grid: number[][]): string[] {
  return grid.map((row) =>
    row
      .map((commits) => {
        if (commits === 0) return '░';
        if (commits <= 2) return '▒';
        if (commits <= 5) return '▓';
        return '█';
      })
      .join('')
  );
}

/**
 * Full pipeline: load image → process → return commit plan + preview.
 */
export async function processImage(options: ImageOptions): Promise<{
  plan: CommitPlan[];
  preview: string[];
  grid: number[][];
  width: number;
  height: number;
  totalCommits: number;
  activeCells: number;
}> {
  const { filePath, year, mode, maxWidth, invert, threshold, offset } = options;

  // Step 1: Load and resize
  const { pixels, width, height } = await loadImage(filePath, maxWidth);

  // Step 2: Convert to commit grid
  const grid = pixelsToCommitGrid(pixels, mode, invert, threshold);

  // Step 3: Generate commit plan
  const plan = gridToCommitPlan(grid, year, offset);

  // Step 4: Build preview
  const preview = renderGridPreview(grid);

  // Stats
  const totalCommits = plan.reduce((sum, p) => sum + p.count, 0);
  const activeCells = grid.flat().filter((c) => c > 0).length;

  return { plan, preview, grid, width, height, totalCommits, activeCells };
}
