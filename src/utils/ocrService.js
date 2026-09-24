/**
 * Client-Side OCR Service using Tesseract.js
 * Scans individual Sudoku cells with progress reporting and caching.
 */
import { createWorker } from 'tesseract.js';
import { extractCellCanvas } from './imageProcessing';

let workerPromise = null;

/**
 * Gets or initializes the singleton Tesseract worker
 */
export async function getTesseractWorker(onStatusUpdate) {
  if (!workerPromise) {
    workerPromise = (async () => {
      if (onStatusUpdate) onStatusUpdate('Initializing OCR engine...');
      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: '123456789',
        tessedit_pageseg_mode: '6',
      });
      return worker;
    })();
  }
  return workerPromise;
}

/**
 * Pre-heats the OCR worker in the background
 */
export function preheatWorker() {
  getTesseractWorker().catch(err => {
    console.warn('Preheat worker error:', err);
  });
}

/**
 * Scans a 450x450 warped Sudoku canvas and returns a 9x9 grid of numbers (0 for empty)
 * Calls `onProgress({ current, total, percent, row, col, digit })` for live UI feedback.
 */
export async function scanSudokuGrid(warpedCanvas, onProgress, abortSignal) {
  const worker = await getTesseractWorker();
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));

  let current = 0;
  const total = 81;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (abortSignal && abortSignal.aborted) {
        throw new Error('Scan aborted by user');
      }

      current++;
      const cell = extractCellCanvas(warpedCanvas, r, c);

      let detectedDigit = 0;
      if (!cell.isBlank) {
        try {
          const ret = await worker.recognize(cell.canvas);
          const raw = ret.data.text.replace(/\s+/g, '');
          const match = raw.match(/[1-9]/);
          if (match) {
            detectedDigit = parseInt(match[0], 10);
          }
        } catch (err) {
          console.warn(`OCR error at cell (${r}, ${c}):`, err);
        }
      }

      board[r][c] = detectedDigit;

      if (onProgress) {
        onProgress({
          current,
          total,
          percent: Math.round((current / total) * 100),
          row: r,
          col: c,
          digit: detectedDigit,
          isBlank: cell.isBlank
        });
      }
    }
  }

  return board;
}
