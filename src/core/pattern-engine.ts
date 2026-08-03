import { FONT_5x7, SHAPES, DAYS_PER_WEEK } from '../utils/constants';
import { yearGridToDate } from './grid-mapper';

export interface PatternCell {
  week: number;
  day: number;
  date: Date;
}

/**
 * Convert a text string into a list of active grid cells.
 *
 * @param text - The text to render (A-Z, 0-9, spaces, basic punctuation)
 * @param year - The target year for date mapping
 * @param startWeek - Which week column to start rendering at (default 1, leaves a gap)
 * @returns Array of active cells with their dates
 */
export function textToPattern(
  text: string,
  year: number,
  startWeek = 1
): PatternCell[] {
  const upperText = text.toUpperCase();
  const cells: PatternCell[] = [];
  let currentWeek = startWeek;

  for (const char of upperText) {
    const glyph = FONT_5x7[char];
    if (!glyph) {
      // Unknown character — skip with a space gap
      currentWeek += 2;
      continue;
    }

    // Each glyph is 7 rows (days) × 5 columns (weeks)
    for (let row = 0; row < DAYS_PER_WEEK; row++) {
      const rowStr = glyph[row];
      for (let col = 0; col < rowStr.length; col++) {
        if (rowStr[col] === '#') {
          const week = currentWeek + col;
          const day = row;
          const date = yearGridToDate(week, day, year);
          cells.push({ week, day, date });
        }
      }
    }

    // Advance to next character position (glyph width + 1 column gap)
    currentWeek += glyph[0].length + 1;
  }

  return cells;
}

/**
 * Convert a predefined shape into a list of active grid cells.
 *
 * @param shapeName - Name of the shape (heart, smiley, check, star, skull, wave, diamond)
 * @param year - The target year for date mapping
 * @param startWeek - Which week column to start rendering at
 * @returns Array of active cells with their dates
 */
export function shapeToPattern(
  shapeName: string,
  year: number,
  startWeek = 1
): PatternCell[] {
  const shape = SHAPES[shapeName.toLowerCase()];
  if (!shape) {
    const available = Object.keys(SHAPES).join(', ');
    throw new Error(
      `Unknown shape "${shapeName}". Available shapes: ${available}`
    );
  }

  const cells: PatternCell[] = [];

  for (let row = 0; row < shape.length && row < DAYS_PER_WEEK; row++) {
    const rowStr = shape[row];
    for (let col = 0; col < rowStr.length; col++) {
      if (rowStr[col] === '#') {
        const week = startWeek + col;
        const day = row;
        const date = yearGridToDate(week, day, year);
        cells.push({ week, day, date });
      }
    }
  }

  return cells;
}

/**
 * Calculate the total width (in weeks) a text string will occupy.
 */
export function getTextWidth(text: string): number {
  const upperText = text.toUpperCase();
  let width = 0;

  for (const char of upperText) {
    const glyph = FONT_5x7[char];
    if (!glyph) {
      width += 2; // unknown char gap
    } else {
      width += glyph[0].length + 1; // glyph width + 1 space
    }
  }

  // Remove trailing space
  return Math.max(0, width - 1);
}

/**
 * Validate that the pattern fits within the visible graph width.
 *
 * @param widthInWeeks - How many week-columns the pattern spans
 * @param maxWeeks - Maximum available weeks (default 53)
 * @returns true if it fits
 */
export function patternFits(widthInWeeks: number, maxWeeks = 53): boolean {
  return widthInWeeks <= maxWeeks - 2; // leave 1-week margins on each side
}

/**
 * Render a pattern as an ASCII grid for preview.
 *
 * @param cells - Active cells from textToPattern or shapeToPattern
 * @returns 7 strings (one per day row), suitable for printing
 */
export function renderPatternPreview(cells: PatternCell[]): string[] {
  if (cells.length === 0) return [];

  const maxWeek = Math.max(...cells.map((c) => c.week));
  const minWeek = Math.min(...cells.map((c) => c.week));
  const width = maxWeek - minWeek + 1;

  // Build a 7 × width grid
  const grid: boolean[][] = Array.from({ length: DAYS_PER_WEEK }, () =>
    Array(width).fill(false)
  );

  for (const cell of cells) {
    grid[cell.day][cell.week - minWeek] = true;
  }

  return grid.map((row) =>
    row.map((filled) => (filled ? '█' : '░')).join('')
  );
}
