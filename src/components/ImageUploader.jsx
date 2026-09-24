import React, { useRef, useState } from 'react';
import { UploadCloud, Camera, Image as ImageIcon, Sparkles, FileText } from 'lucide-react';
import { loadImage } from '../utils/imageProcessing';

export default function ImageUploader({ onImageLoaded, onSelectPreset }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    try {
      const img = await loadImage(file);
      onImageLoaded(img, file.name);
    } catch (err) {
      console.error(err);
      alert('Failed to load image. Please try another file.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const loadSampleImage = async () => {
    setIsLoadingSample(true);
    try {
      const sampleUrl = './samples/sudoku_sample_1.jpg';
      const img = await loadImage(sampleUrl);
      onImageLoaded(img, 'Sudoku01.jpeg');
    } catch (err) {
      console.error(err);
      alert('Could not load sample image. Please upload an image directly.');
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[200px] ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-700/80 bg-slate-900/40 hover:bg-slate-900/70 hover:border-indigo-500/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3 text-indigo-400 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-base font-semibold text-white mb-1">
          Upload Sudoku Photo
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          Drag and drop your Sudoku puzzle picture here, or click to browse files from your computer.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Browse Image
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cameraInputRef.current?.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            Take Photo
          </button>
        </div>
      </div>

      {/* Preset / Sample shortcut banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>No image ready? Test with the bundled sample:</span>
        </div>
        <button
          type="button"
          onClick={loadSampleImage}
          disabled={isLoadingSample}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition-colors"
        >
          {isLoadingSample ? 'Loading...' : 'Try Sample Sudoku Photo'}
        </button>
      </div>
    </div>
  );
}
