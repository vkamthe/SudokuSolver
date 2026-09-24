import React from 'react';
import { SAMPLE_PUZZLES } from '../utils/sudokuSolver';
import { Bookmark } from 'lucide-react';

export default function SamplePicker({ onSelectPreset, disabled }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
      <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
        <Bookmark className="w-3.5 h-3.5 text-indigo-400" /> Presets:
      </span>
      {SAMPLE_PUZZLES.map((preset) => (
        <button
          key={preset.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelectPreset(preset.board)}
          className="shrink-0 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          {preset.name}
          <span className="ml-1 text-[10px] text-slate-500">({preset.difficulty})</span>
        </button>
      ))}
    </div>
  );
}
