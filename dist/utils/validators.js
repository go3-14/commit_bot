"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDate = parseDate;
exports.parsePositiveInt = parsePositiveInt;
exports.parseNonNegativeInt = parseNonNegativeInt;
exports.validateDateRange = validateDateRange;
exports.validateGridCoords = validateGridCoords;
exports.validateIntensity = validateIntensity;
const date_fns_1 = require("date-fns");
const constants_1 = require("./constants");
const logger_1 = require("./logger");
/**
 * Parse a date string in YYYY-MM-DD format.
 * Exits the process with a helpful message on invalid input.
 */
function parseDate(dateStr, label = 'date') {
    const parsed = (0, date_fns_1.parse)(dateStr, 'yyyy-MM-dd', new Date());
    if (!(0, date_fns_1.isValid)(parsed)) {
        logger_1.logger.error(`Invalid ${label}: "${dateStr}". Expected format: YYYY-MM-DD`);
        process.exit(1);
    }
    return (0, date_fns_1.startOfDay)(parsed);
}
/**
 * Validate that a number is a positive integer.
 */
function parsePositiveInt(value, label = 'value') {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 1) {
        logger_1.logger.error(`${label} must be a positive integer, got "${value}"`);
        process.exit(1);
    }
    return n;
}
/**
 * Validate that a number is a non-negative integer.
 */
function parseNonNegativeInt(value, label = 'value') {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0) {
        logger_1.logger.error(`${label} must be a non-negative integer, got "${value}"`);
        process.exit(1);
    }
    return n;
}
/**
 * Validate that 'from' is before or equal to 'to'.
 */
function validateDateRange(from, to) {
    if ((0, date_fns_1.isAfter)(from, to)) {
        logger_1.logger.error(`--from date must be before or equal to --to date.`);
        process.exit(1);
    }
}
/**
 * Validate grid coordinates (week, day).
 */
function validateGridCoords(week, day) {
    if (week < 0 || week >= constants_1.GRAPH_WEEKS) {
        logger_1.logger.error(`Week must be between 0 and ${constants_1.GRAPH_WEEKS - 1}, got ${week}`);
        process.exit(1);
    }
    if (day < 0 || day >= constants_1.DAYS_PER_WEEK) {
        logger_1.logger.error(`Day must be between 0 (Sun) and 6 (Sat), got ${day}`);
        process.exit(1);
    }
}
/**
 * Validate intensity level.
 */
function validateIntensity(intensity) {
    const valid = ['low', 'medium', 'high', 'max'];
    if (!valid.includes(intensity)) {
        logger_1.logger.error(`Intensity must be one of: ${valid.join(', ')}. Got "${intensity}"`);
        process.exit(1);
    }
}
//# sourceMappingURL=validators.js.map