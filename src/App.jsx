import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import CornerPinEditor from './components/CornerPinEditor';
import SudokuGrid from './components/SudokuGrid';
import SolverControls from './components/SolverControls';
import SamplePicker from './components/SamplePicker';
import {
  createEmptyBoard,
  cloneBoard,
  validateBoard,
  solveSudoku,
  solveSudokuStepGenerator,
  SAMPLE_PUZZLES
} from './utils/sudokuSolver';
import {
  autoDetectCorners,
  warpPerspective
} from './utils/imageProcessing';
import {
  scanSudokuGrid,
  preheatWorker
} from './utils/ocrService';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Camera,
  Grid
} from 'lucide-react';

export default function App() {
  // Board state
  const [board, setBoard] = useState(() => SAMPLE_PUZZLES[0].board);
  const [originalBoard, setOriginalBoard] = useState(() => SAMPLE_PUZZLES[0].board);
  const [originalClues, setOriginalClues] = useState(() => {
    const clues = new Set();
    SAMPLE_PUZZLES[0].board.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val !== 0) clues.add(`${r},${c}`);
      });
    });
    return clues;
  });

  const [selectedCell, setSelectedCell] = useState({ r: 0, c: 0 });
  const [isSolved, setIsSolved] = useState(false);

  // Image & Vision state
  const [viewMode, setViewMode] = useState('grid'); // 'upload' | 'align' | 'grid'
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageFileName, setImageFileName] = useState('');
  const [corners, setCorners] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(null);

  // Visualization state
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [visualizeSpeed, setVisualizeSpeed] = useState(15);
  const vizCancelRef = useRef(false);

  // Status message
  const [status, setStatus] = useState({
    type: 'info',
    text: 'Click on any cell to edit numbers or press Solve Instantly.'
  });

  // Pre-heat OCR worker in background on first load
  useEffect(() => {
    preheatWorker();
  }, []);

  // Validation
  const validation = useMemo(() => validateBoard(board), [board]);
  const hasClues = useMemo(() => board.some(row => row.some(val => val !== 0)), [board]);

  // Load image handler
  const handleImageLoaded = (img, filename) => {
    setUploadedImage(img);
    setImageFileName(filename);
    const detected = autoDetectCorners(img);
    setCorners(detected);
    setViewMode('align');
    setStatus({
      type: 'info',
      text: 'Align the 4 corner handles with the grid, then click "Extract & Scan".'
    });
  };

  // Start OCR scanning
  const handleStartScan = async () => {
    if (!uploadedImage || !corners) return;
    setIsScanning(true);
    setScanProgress({ current: 0, total: 81, percent: 0 });
    setStatus({
      type: 'info',
      text: 'Running in-browser OCR on 81 cells...'
    });

    try {
      const warpedCanvas = warpPerspective(uploadedImage, corners, 450);
      const extractedBoard = await scanSudokuGrid(warpedCanvas, (progress) => {
        setScanProgress(progress);
      });

      // Populate board
      setBoard(extractedBoard);
      setOriginalBoard(cloneBoard(extractedBoard));

      const clues = new Set();
      extractedBoard.forEach((row, r) => {
        row.forEach((val, c) => {
          if (val !== 0) clues.add(`${r},${c}`);
        });
      });
      setOriginalClues(clues);
      setIsSolved(false);
      setViewMode('grid');

      setStatus({
        type: 'success',
        text: `Extracted ${clues.size} clues! Verify any uncertain cells, then click Solve.`
      });
    } catch (err) {
      console.error(err);
      setStatus({
        type: 'error',
        text: 'Failed to scan image: ' + err.message
      });
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  };

  // Cell editing
  const handleCellChange = useCallback((r, c, val) => {
    setBoard((prev) => {
      const next = cloneBoard(prev);
      next[r][c] = val;
      return next;
    });

    // Update clues set if user edited
    setOriginalClues((prev) => {
      const next = new Set(prev);
      if (val !== 0) {
        next.add(`${r},${c}`);
      } else {
        next.delete(`${r},${c}`);
      }
      return next;
    });

    setIsSolved(false);
  }, []);

  // Instant Solve
  const handleSolveInstant = () => {
    if (!validation.valid) {
      setStatus({
        type: 'error',
        text: 'Cannot solve: Please resolve conflicting numbers highlighted in red.'
      });
      return;
    }

    const boardToSolve = cloneBoard(board);
    const t0 = performance.now();
    const success = solveSudoku(boardToSolve);
    const t1 = performance.now();

    if (success) {
      setBoard(boardToSolve);
      setIsSolved(true);
      setStatus({
        type: 'success',
        text: `Sudoku solved successfully in ${(t1 - t0).toFixed(2)} ms!`
      });
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      setStatus({
        type: 'error',
        text: 'No valid solution exists for this configuration.'
      });
    }
  };

  // Step-by-step Visualization
  const handleStartVisualization = () => {
    if (!validation.valid) {
      setStatus({
        type: 'error',
        text: 'Cannot visualize: Conflicting numbers on the board.'
      });
      return;
    }

    setIsVisualizing(true);
    vizCancelRef.current = false;
    setStatus({
      type: 'info',
      text: 'Visualizing backtracking search...'
    });

    const workBoard = cloneBoard(board);
    const generator = solveSudokuStepGenerator(workBoard);

    const step = () => {
      if (vizCancelRef.current) {
        setIsVisualizing(false);
        return;
      }

      // Execute batches of steps per frame according to speed
      const batchSize = Math.max(1, Math.round(visualizeSpeed / 2));
      let lastVal = null;

      for (let i = 0; i < batchSize; i++) {
        const next = generator.next();
        if (next.done) {
          setIsVisualizing(false);
          if (next.value) {
            setIsSolved(true);
            setStatus({
              type: 'success',
              text: 'Visualization complete! Solution found.'
            });
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          } else {
            setStatus({
              type: 'error',
              text: 'Visualization ended: Puzzle has no solution.'
            });
          }
          return;
        }
        lastVal = next.value;
      }

      if (lastVal) {
        setBoard(cloneBoard(workBoard));
        setSelectedCell({ r: lastVal.r, c: lastVal.c });
      }

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const handleStopVisualization = () => {
    vizCancelRef.current = true;
    setIsVisualizing(false);
    setStatus({
      type: 'info',
      text: 'Visualization stopped.'
    });
  };

  // Reset to original clues
  const handleResetToClues = () => {
    setBoard(cloneBoard(originalBoard));
    setIsSolved(false);
    setStatus({
      type: 'info',
      text: 'Reset to original clues.'
    });
  };

  // Clear entire board
  const handleClearBoard = () => {
    const empty = createEmptyBoard();
    setBoard(empty);
    setOriginalBoard(empty);
    setOriginalClues(new Set());
    setIsSolved(false);
    setStatus({
      type: 'info',
      text: 'Board cleared. Enter numbers or upload an image.'
    });
  };

  // Load a preset board
  const handleSelectPreset = (presetBoard) => {
    const cloned = cloneBoard(presetBoard);
    setBoard(cloned);
    setOriginalBoard(cloneBoard(cloned));

    const clues = new Set();
    cloned.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val !== 0) clues.add(`${r},${c}`);
      });
    });
    setOriginalClues(clues);
    setIsSolved(false);
    setViewMode('grid');
    setStatus({
      type: 'info',
      text: 'Loaded preset puzzle. Click Solve to calculate.'
    });
  };

  // Export solution text
  const handleDownloadSolution = () => {
    const text = board.map(row => row.join(' ')).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sudoku_solution.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 flex flex-col items-center">
        {/* Navigation Tabs (Upload Photo vs Interactive Grid) */}
        <div className="w-full max-w-xl flex items-center justify-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode('upload')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              viewMode === 'upload' || viewMode === 'align'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Upload & Scan Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Sudoku Board & Solver</span>
          </button>
        </div>

        {/* Global Status Banner */}
        <div className="w-full max-w-xl mb-6">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs transition-all ${
              status.type === 'error'
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                : status.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-indigo-950/30 border-indigo-500/20 text-indigo-300'
            }`}
          >
            {status.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />}
            {status.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            {status.type === 'info' && <Info className="w-4 h-4 shrink-0 text-indigo-400" />}
            <span className="flex-1 font-medium">{status.text}</span>
          </div>
        </div>

        {/* Dynamic View Mode */}
        {viewMode === 'upload' && (
          <div className="w-full max-w-xl flex flex-col items-center animate-fade-in space-y-4">
            <ImageUploader
              onImageLoaded={handleImageLoaded}
              onSelectPreset={handleSelectPreset}
            />
          </div>
        )}

        {viewMode === 'align' && (
          <div className="w-full max-w-2xl flex flex-col items-center animate-fade-in">
            <CornerPinEditor
              image={uploadedImage}
              corners={corners}
              onCornersChange={setCorners}
              onStartScan={handleStartScan}
              onChangeImage={() => setViewMode('upload')}
              isScanning={isScanning}
              scanProgress={scanProgress}
            />
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Left: 9x9 Sudoku Grid & Keypad */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <SudokuGrid
                board={board}
                originalClues={originalClues}
                selectedCell={selectedCell}
                onSelectCell={setSelectedCell}
                onCellChange={handleCellChange}
                errorCells={validation.errorCells}
                disabled={isVisualizing}
              />
            </div>

            {/* Right: Controls & Presets */}
            <div className="lg:col-span-5 flex flex-col space-y-6 bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Solver Controls
                </h3>
                <p className="text-xs text-slate-400">
                  Select a cell to enter clues or click below to solve instantly.
                </p>
              </div>

              <SolverControls
                onSolveInstant={handleSolveInstant}
                onStartVisualization={handleStartVisualization}
                onStopVisualization={handleStopVisualization}
                isVisualizing={isVisualizing}
                visualizeSpeed={visualizeSpeed}
                onSpeedChange={setVisualizeSpeed}
                onResetToClues={handleResetToClues}
                onClearBoard={handleClearBoard}
                onNewPhoto={() => setViewMode('upload')}
                onDownloadSolution={handleDownloadSolution}
                isSolved={isSolved}
                hasClues={hasClues}
                hasErrors={!validation.valid}
              />

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <SamplePicker
                  onSelectPreset={handleSelectPreset}
                  disabled={isVisualizing}
                />
              </div>

              {/* How it works info box */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  How it works
                </div>
                <p>
                  • Upload any Sudoku photo from your device or camera.
                </p>
                <p>
                  • The client-side vision pipeline warps the grid and reads digits using OCR in your browser.
                </p>
                <p>
                  • Backtracking with the MRV heuristic calculates the exact solution in milliseconds.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
        <p>100% Client-Side Sudoku Solver • Hosted on GitHub Pages • Zero Server Dependencies</p>
      </footer>
    </div>
  );
}
