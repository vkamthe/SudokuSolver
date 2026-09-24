/**
 * 9x9 Sudoku Solver and Validation Utilities
 */

/**
 * Creates an empty 9x9 board (all zeros)
 */
export function createEmptyBoard() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

/**
 * Deep clones a 9x9 board
 */
export function cloneBoard(board) {
  return board.map(row => [...row]);
}

/**
 * Checks if placing `num` at `board[r][c]` violates standard Sudoku rules
 */
export function isValidPlacement(board, r, c, num) {
  for (let i = 0; i < 9; i++) {
    // Check row
    if (i !== c && board[r][i] === num) return false;
    // Check column
    if (i !== r && board[i][c] === num) return false;
  }

  // Check 3x3 subgrid
  const startRow = Math.floor(r / 3) * 3;
  const startCol = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const cr = startRow + i;
      const cc = startCol + j;
      if ((cr !== r || cc !== c) && board[cr][cc] === num) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Validates a board for conflicts
 * Returns { valid: boolean, errors: Set<string> } where string is "r,c"
 */
export function validateBoard(board) {
  const errorCells = new Set();

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c];
      if (val !== 0) {
        if (!isValidPlacement(board, r, c, val)) {
          errorCells.add(`${r},${c}`);
        }
      }
    }
  }

  return {
    valid: errorCells.size === 0,
    errorCells
  };
}

/**
 * Finds the cell with the Minimum Remaining Values (MRV heuristic)
 */
function findBestEmptyCell(board) {
  let minPossibilities = 10;
  let bestCell = null;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        let count = 0;
        const validNums = [];
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(board, r, c, num)) {
            count++;
            validNums.push(num);
          }
        }
        if (count === 0) {
          // Dead end found immediately!
          return { r, c, validNums: [] };
        }
        if (count < minPossibilities) {
          minPossibilities = count;
          bestCell = { r, c, validNums };
          if (count === 1) return bestCell; // Can't beat 1 possibility
        }
      }
    }
  }

  return bestCell;
}

/**
 * Solves the Sudoku board using Backtracking with MRV heuristic.
 * Mutates `board` in-place and returns true if solved, false if unsolvable.
 */
export function solveSudoku(board) {
  const cell = findBestEmptyCell(board);
  if (!cell) {
    return true; // No empty cells left, solved!
  }

  const { r, c, validNums } = cell;
  for (let i = 0; i < validNums.length; i++) {
    const num = validNums[i];
    board[r][c] = num;
    if (solveSudoku(board)) {
      return true;
    }
    board[r][c] = 0;
  }

  return false;
}

/**
 * Generator that yields search steps for step-by-step solver visualization.
 * Uses the MRV (Minimum Remaining Values) heuristic for realistic and efficient solving.
 */
export function* solveSudokuStepGenerator(board) {
  const cell = findBestEmptyCell(board);
  if (!cell) {
    return true; // All empty cells solved
  }

  const { r, c, validNums } = cell;
  if (validNums.length === 0) {
    return false; // Dead end reached
  }

  for (let i = 0; i < validNums.length; i++) {
    const num = validNums[i];
    board[r][c] = num;
    yield { r, c, val: num, action: 'place' };

    const solved = yield* solveSudokuStepGenerator(board);
    if (solved) {
      return true;
    }

    board[r][c] = 0;
    yield { r, c, val: 0, action: 'backtrack' };
  }

  return false;
}

/**
 * Built-in sample puzzles for instant testing
 */
export const SAMPLE_PUZZLES = [
  {
    id: 'sample-image',
    name: 'Featured (Sample Image)',
    difficulty: 'Medium',
    board: [
      [8,0,6,0,1,0,0,0,0],
      [0,0,3,0,6,4,0,9,0],
      [9,0,0,0,0,0,8,1,6],
      [0,8,0,3,9,6,0,0,0],
      [7,0,2,0,4,0,3,0,9],
      [0,0,0,5,7,2,0,8,0],
      [5,2,1,0,0,0,0,0,4],
      [0,3,0,7,5,0,2,0,0],
      [0,0,0,0,2,0,1,0,5]
    ]
  },
  {
    id: 'sample-easy',
    name: 'Easy Puzzle',
    difficulty: 'Easy',
    board: [
      [5,3,0,0,7,0,0,0,0],
      [6,0,0,1,9,5,0,0,0],
      [0,9,8,0,0,0,0,6,0],
      [8,0,0,0,6,0,0,0,3],
      [4,0,0,8,0,3,0,0,1],
      [7,0,0,0,2,0,0,0,6],
      [0,6,0,0,0,0,2,8,0],
      [0,0,0,4,1,9,0,0,5],
      [0,0,0,0,8,0,0,7,9]
    ]
  },
  {
    id: 'sample-expert',
    name: 'Arto Inkala (World’s Hardest)',
    difficulty: 'Expert',
    board: [
      [8,0,0,0,0,0,0,0,0],
      [0,0,3,6,0,0,0,0,0],
      [0,7,0,0,9,0,2,0,0],
      [0,5,0,0,0,7,0,0,0],
      [0,0,0,0,4,5,7,0,0],
      [0,0,0,1,0,0,0,3,0],
      [0,0,1,0,0,0,0,6,8],
      [0,0,8,5,0,0,0,1,0],
      [0,9,0,0,0,0,4,0,0]
    ]
  }
];
