import React from 'react';
import { Play, Zap, RotateCcw, Trash2, Download, Camera, Square } from 'lucide-react';

export default function SolverControls({
  onSolveInstant,
  onStartVisualization,
  onStopVisualization,
  isVisualizing,
  visualizeSpeed,
  onSpeedChange,
  onResetToClues,
  onClearBoard,
  onNewPhoto,
  onDownloadSolution,
  isSolved,
  hasClues,
  hasErrors
}) {
  return (
    <div className="w-full space-y-4">
      {/* Primary Solve Actions */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={onSolveInstant}
          disabled={isVisualizing || hasErrors || !hasClues}
          className="flex-1 py-3 px-5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-indigo-500/25 border border-white/10 flex items-center justify-center gap-2 transition-all transform active:scale-98"
        >
          <Zap className="w-4 h-4 fill-white" />
          {isSolved ? 'Solved!' : 'Solve Instantly'}
        </button>

        {!isVisualizing ? (
          <button
            type="button"
            onClick={onStartVisualization}
            disabled={hasErrors || !hasClues}
            className="py-3 px-4 rounded-xl font-semibold text-xs text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title="Watch the algorithm search and backtrack in real time"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Visualize Solve
          </button>
        ) : (
          <button
            type="button"
            onClick={onStopVisualization}
            className="py-3 px-4 rounded-xl font-semibold text-xs text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 flex items-center justify-center gap-1.5 transition-colors animate-pulse"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            Stop Animation
          </button>
        )}
      </div>

      {/* Speed Slider (visible when visualizing) */}
      {isVisualizing && (
        <div className="flex items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs">
          <span className="text-slate-400 font-medium">Animation Speed:</span>
          <div className="flex items-center gap-2 flex-1 max-w-[200px]">
            <input
              type="range"
              min="1"
              max="50"
              value={visualizeSpeed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-indigo-400 w-8 text-right font-semibold">
              {visualizeSpeed}x
            </span>
          </div>
        </div>
      )}

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
        <button
          type="button"
          onClick={onResetToClues}
          disabled={isVisualizing || !hasClues}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Clues
        </button>

        <button
          type="button"
          onClick={onClearBoard}
          disabled={isVisualizing}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-slate-300 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear All
        </button>

        <button
          type="button"
          onClick={onDownloadSolution}
          disabled={isVisualizing || !isSolved}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-slate-300 hover:text-emerald-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <Download className="w-3.5 h-3.5" />
          Export Text
        </button>

        <button
          type="button"
          onClick={onNewPhoto}
          disabled={isVisualizing}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-indigo-300 hover:text-white bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/30 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <Camera className="w-3.5 h-3.5" />
          New Photo
        </button>
      </div>
    </div>
  );
}
