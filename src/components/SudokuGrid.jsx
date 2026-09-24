import React, { useRef, useEffect } from 'react';
import { Delete, AlertCircle } from 'lucide-react';

export default function SudokuGrid({
  board,
  originalClues,
  selectedCell,
  onSelectCell,
  onCellChange,
  errorCells,
  disabled
}) {
  const gridContainerRef = useRef(null);

  // Handle keyboard navigation & digit typing
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e) => {
      if (!selectedCell) return;
      const { r, c } = selectedCell;

      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        onCellChange(r, c, parseInt(e.key, 10));
      } else if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete' || e.key === ' ') {
        e.preventDefault();
        onCellChange(r, c, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onSelectCell({ r: Math.max(0, r - 1), c });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onSelectCell({ r: Math.min(8, r + 1), c });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSelectCell({ r, c: Math.max(0, c - 1) });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSelectCell({ r, c: Math.min(8, c + 1) });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, onCellChange, onSelectCell, disabled]);

  const handleCellClick = (r, c) => {
    if (disabled) return;
    onSelectCell({ r, c });
  };

  const handleKeypadPress = (val) => {
    if (!selectedCell || disabled) return;
    onCellChange(selectedCell.r, selectedCell.c, val);
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      {/* 9x9 Sudoku Board Container */}
      <div
        ref={gridContainerRef}
        className="w-full max-w-[460px] aspect-square p-2 bg-slate-900 border-2 border-indigo-500/50 rounded-2xl shadow-2xl shadow-indigo-950/50 select-none"
      >
        <div className="grid grid-cols-9 grid-rows-9 w-full h-full border border-slate-700 rounded-xl overflow-hidden bg-slate-950">
          {board.map((row, r) =>
            row.map((val, c) => {
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const isOriginal = originalClues.has(`${r},${c}`);
              const isError = errorCells.has(`${r},${c}`);
              const isFilled = val !== 0;

              // Border styling for 3x3 blocks
              const borderRight = (c === 2 || c === 5) ? 'border-r-2 border-r-indigo-400/60' : (c < 8 ? 'border-r border-slate-800' : '');
              const borderBottom = (r === 2 || r === 5) ? 'border-b-2 border-b-indigo-400/60' : (r < 8 ? 'border-b border-slate-800' : '');

              // Cell highlight colors
              let bgClass = 'bg-slate-950 hover:bg-slate-900/80';
              if (isSelected) {
                bgClass = 'bg-indigo-600/30 ring-2 ring-indigo-400 z-10';
              } else if (isError) {
                bgClass = 'bg-rose-500/20 text-rose-300';
              } else if (selectedCell && (selectedCell.r === r || selectedCell.c === c)) {
                bgClass = 'bg-slate-900/50';
              }

              // Text color
              let textClass = 'text-slate-100 font-bold';
              if (isError) {
                textClass = 'text-rose-400 font-black';
              } else if (isOriginal) {
                textClass = 'text-indigo-200 font-black';
              } else if (isFilled) {
                textClass = 'text-emerald-400 font-semibold';
              }

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  tabIndex={0}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative flex items-center justify-center text-lg sm:text-2xl font-mono cursor-pointer transition-colors ${borderRight} ${borderBottom} ${bgClass} ${textClass}`}
                >
                  {val !== 0 ? val : ''}

                  {/* Indicator dot for original clues */}
                  {isOriginal && (
                    <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-indigo-400/60" />
                  )}

                  {/* Indicator for errors */}
                  {isError && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Legend / Info Bar */}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-indigo-500/20 border border-indigo-400/60 flex items-center justify-center font-bold text-[9px] text-indigo-200">
            5
          </span>
          <span>Original Clue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-[9px] text-emerald-400">
            9
          </span>
          <span>Solved Digit</span>
        </div>
        {errorCells.size > 0 && (
          <div className="flex items-center gap-1 text-rose-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorCells.size} conflicts detected</span>
          </div>
        )}
      </div>

      {/* On-Screen Mobile Number Pad */}
      <div className="w-full max-w-[460px] grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 bg-slate-900/80 rounded-xl border border-slate-800">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleKeypadPress(num)}
            disabled={disabled || !selectedCell}
            className="py-2.5 font-mono font-bold text-base text-slate-200 hover:text-white bg-slate-800 hover:bg-indigo-600/40 active:bg-indigo-600 border border-slate-700/60 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleKeypadPress(0)}
          disabled={disabled || !selectedCell}
          className="py-2.5 flex items-center justify-center text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-500/20 active:bg-rose-500/30 border border-slate-700/60 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
          title="Clear cell"
        >
          <Delete className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
