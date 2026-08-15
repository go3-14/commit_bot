"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGraphStartDate = getGraphStartDate;
exports.gridToDate = gridToDate;
exports.dateToGrid = dateToGrid;
exports.getYearGraphStartDate = getYearGraphStartDate;
exports.yearGridToDate = yearGridToDate;
const date_fns_1 = require("date-fns");
const constants_1 = require("../utils/constants");
/**
 * Get the start date (top-left corner) of the GitHub contribution graph.
 * This is the Sunday of the week that is 52 weeks before the current week.
 *
 * @param referenceDate - The "today" date (defaults to now)
 * @returns The Sunday that starts the contribution graph
 */
function getGraphStartDate(referenceDate = new Date()) {
    // GitHub graph starts on Sunday of the current week, then goes back 52 weeks
    const currentWeekStart = (0, date_fns_1.startOfWeek)(referenceDate, { weekStartsOn: 0 }); // Sunday
    return (0, date_fns_1.subWeeks)(currentWeekStart, constants_1.GRAPH_WEEKS - 1);
}
/**
 * Convert a (week, day) grid coordinate to a calendar date.
 *
 * @param week  - Column index (0 = leftmost/oldest, 52 = rightmost/current)
 * @param day   - Row index (0 = Sunday, 6 = Saturday)
 * @param referenceDate - The "today" date for graph calculation
 * @returns The calendar date for that grid cell
 */
function gridToDate(week, day, referenceDate = new Date()) {
    const graphStart = getGraphStartDate(referenceDate);
    return (0, date_fns_1.addDays)((0, date_fns_1.addWeeks)(graphStart, week), day);
}
/**
 * Convert a calendar date to (week, day) grid coordinates.
 *
 * @param date - The calendar date
 * @param referenceDate - The "today" date for graph calculation
 * @returns { week, day } or null if the date is outside the visible graph
 */
function dateToGrid(date, referenceDate = new Date()) {
    const graphStart = getGraphStartDate(referenceDate);
    const target = (0, date_fns_1.startOfDay)(date);
    const day = (0, date_fns_1.getDay)(target); // 0 = Sunday
    const weeksDiff = (0, date_fns_1.differenceInWeeks)((0, date_fns_1.startOfWeek)(target, { weekStartsOn: 0 }), graphStart);
    if (weeksDiff < 0 || weeksDiff >= constants_1.GRAPH_WEEKS) {
        return null;
    }
    return { week: weeksDiff, day };
}
/**
 * Get the start date for a specific year's contribution graph.
 * GitHub shows Jan 1 through Dec 31 when viewing a specific year.
 * The grid starts on the Sunday on or before Jan 1.
 *
 * @param year - The target year
 * @returns The Sunday that starts the year's graph
 */
function getYearGraphStartDate(year) {
    const jan1 = new Date(year, 0, 1);
    return (0, date_fns_1.startOfWeek)(jan1, { weekStartsOn: 0 });
}
/**
 * Convert a (week, day) coordinate to a date for a specific year's graph.
 *
 * @param week - Column index
 * @param day  - Row index (0 = Sunday, 6 = Saturday)
 * @param year - The target year
 * @returns The calendar date
 */
function yearGridToDate(week, day, year) {
    const yearStart = getYearGraphStartDate(year);
    return (0, date_fns_1.addDays)((0, date_fns_1.addWeeks)(yearStart, week), day);
}
//# sourceMappingURL=grid-mapper.js.map