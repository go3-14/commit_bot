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
exports.loadImage = loadImage;
exports.pixelsToCommitGrid = pixelsToCommitGrid;
exports.gridToCommitPlan = gridToCommitPlan;
exports.renderGridPreview = renderGridPreview;
exports.processImage = processImage;
const sharp_1 = __importDefault(require("sharp"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const constants_1 = require("../utils/constants");
const grid_mapper_1 = require("./grid-mapper");
/** Grayscale brightness-to-commit mapping (5 levels) */
const GRAYSCALE_LEVELS = [
    { max: 51, commits: 10 }, // Darkest green
    { max: 102, commits: 5 }, // Dark green
    { max: 153, commits: 3 }, // Medium green
    { max: 204, commits: 1 }, // Light green
    { max: 255, commits: 0 }, // Empty
];
/** Default commits for binary "on" pixels */
const BINARY_ON_COMMITS = 5;
/**
 * Load an image, resize it to fit the GitHub grid, and convert to a
 * 2D brightness grid (7 rows × width cols).
 *
 * @returns A grid of brightness values (0–255), where grid[row][col]
 */
async function loadImage(filePath, maxWidth) {
    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) {
        throw new Error(`Image file not found: ${absPath}`);
    }
    // Resize to fit maxWidth × 7, maintaining aspect ratio
    const image = (0, sharp_1.default)(absPath)
        .resize({
        width: maxWidth,
        height: constants_1.DAYS_PER_WEEK,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // white padding
    })
        .grayscale()
        .flatten({ background: { r: 255, g: 255, b: 255 } }); // flatten transparency to white
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    const width = info.width;
    const height = info.height;
    // Build 2D grid: pixels[row][col] = brightness (0–255)
    const pixels = [];
    for (let row = 0; row < height; row++) {
        const rowData = [];
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
function pixelsToCommitGrid(pixels, mode, invert, threshold) {
    const height = pixels.length;
    const width = pixels[0]?.length || 0;
    const grid = [];
    for (let row = 0; row < height; row++) {
        const rowData = [];
        for (let col = 0; col < width; col++) {
            let brightness = pixels[row][col];
            // Invert if requested (dark becomes light and vice versa)
            if (invert) {
                brightness = 255 - brightness;
            }
            let commits;
            if (mode === 'binary') {
                commits = brightness < threshold ? BINARY_ON_COMMITS : 0;
            }
            else {
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
function gridToCommitPlan(grid, year, offset) {
    const dateMap = new Map();
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            const commits = grid[row][col];
            if (commits <= 0)
                continue;
            const date = (0, grid_mapper_1.yearGridToDate)(col + offset, row, year);
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
function renderGridPreview(grid) {
    return grid.map((row) => row
        .map((commits) => {
        if (commits === 0)
            return '░';
        if (commits <= 2)
            return '▒';
        if (commits <= 5)
            return '▓';
        return '█';
    })
        .join(''));
}
/**
 * Full pipeline: load image → process → return commit plan + preview.
 */
async function processImage(options) {
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
//# sourceMappingURL=image-processor.js.map