import { parse, isValid, isBefore, isAfter, startOfDay } from 'date-fns';
import { DAYS_PER_WEEK, GRAPH_WEEKS } from './constants';
import { logger } from './logger';

/**
 * Parse a date string in YYYY-MM-DD format.
 * Exits the process with a helpful message on invalid input.
 */
export function parseDate(dateStr: string, label = 'date'): Date {
  const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
  if (!isValid(parsed)) {
    logger.error(`Invalid ${label}: "${dateStr}". Expected format: YYYY-MM-DD`);
    process.exit(1);
  }
  return startOfDay(parsed);
}

/**
 * Validate that a number is a positive integer.
 */
export function parsePositiveInt(value: string, label = 'value'): number {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 1) {
    logger.error(`${label} must be a positive integer, got "${value}"`);
    process.exit(1);
  }
  return n;
}

/**
 * Validate that a number is a non-negative integer.
 */
export function parseNonNegativeInt(value: string, label = 'value'): number {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 0) {
    logger.error(`${label} must be a non-negative integer, got "${value}"`);
    process.exit(1);
  }
  return n;
}

/**
 * Validate that 'from' is before or equal to 'to'.
 */
export function validateDateRange(from: Date, to: Date): void {
  if (isAfter(from, to)) {
    logger.error(
      `--from date must be before or equal to --to date.`
    );
    process.exit(1);
  }
}

/**
 * Validate grid coordinates (week, day).
 */
export function validateGridCoords(week: number, day: number): void {
  if (week < 0 || week >= GRAPH_WEEKS) {
    logger.error(
      `Week must be between 0 and ${GRAPH_WEEKS - 1}, got ${week}`
    );
    process.exit(1);
  }
  if (day < 0 || day >= DAYS_PER_WEEK) {
    logger.error(`Day must be between 0 (Sun) and 6 (Sat), got ${day}`);
    process.exit(1);
  }
}

/**
 * Validate intensity level.
 */
export function validateIntensity(intensity: string): void {
  const valid = ['low', 'medium', 'high', 'max'];
  if (!valid.includes(intensity)) {
    logger.error(
      `Intensity must be one of: ${valid.join(', ')}. Got "${intensity}"`
    );
    process.exit(1);
  }
}
