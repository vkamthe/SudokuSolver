import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, Scan, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { autoDetectCorners } from '../utils/imageProcessing';

export default function CornerPinEditor({ image, corners, onCornersChange, onStartScan, onChangeImage, isScanning, scanProgress }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [activeHandle, setActiveHandle] = useState(null); // 'tl', 'tr', 'br', 'bl'
  const [scale, setScale] = useState(1);

  // Redraw canvas whenever image or corners change
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    const container = containerRef.current;
    if (!container) return;

    const naturalW = image.naturalWidth || image.width;
    const naturalH = image.naturalHeight || image.height;

    // Fit canvas width to container, keeping aspect ratio
    const maxWidth = Math.min(container.clientWidth || 600, 650);
    const s = maxWidth / naturalW;
    setScale(s);

    const displayW = Math.round(naturalW * s);
    const displayH = Math.round(naturalH * s);

    canvas.width = displayW;
    canvas.height = displayH;

    // 1. Draw base image
    ctx.drawImage(image, 0, 0, displayW, displayH);

    // 2. Dim background outside or overlay
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(0, 0, displayW, displayH);

    // 3. Clear the quadrilateral region with clip
    const tl = { x: corners.tl.x * s, y: corners.tl.y * s };
    const tr = { x: corners.tr.x * s, y: corners.tr.y * s };
    const br = { x: corners.br.x * s, y: corners.br.y * s };
    const bl = { x: corners.bl.x * s, y: corners.bl.y * s };

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.clip();
    // Redraw un-dimmed image inside polygon
    ctx.drawImage(image, 0, 0, displayW, displayH);

    // 4. Draw 9x9 internal perspective guide lines
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 1;

    for (let i = 1; i < 9; i++) {
      const t = i / 9;
      // Thicker lines for 3x3 blocks
      const isMajor = i % 3 === 0;
      ctx.lineWidth = isMajor ? 2 : 1;
      ctx.strokeStyle = isMajor ? 'rgba(129, 140, 248, 0.9)' : 'rgba(99, 102, 241, 0.45)';

      // Horizontal lines (interpolate top to bottom on left, and top to bottom on right)
      const leftX = tl.x + (bl.x - tl.x) * t;
      const leftY = tl.y + (bl.y - tl.y) * t;
      const rightX = tr.x + (br.x - tr.x) * t;
      const rightY = tr.y + (br.y - tr.y) * t;

      ctx.beginPath();
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.stroke();

      // Vertical lines (interpolate left to right on top, and left to right on bottom)
      const topX = tl.x + (tr.x - tl.x) * t;
      const topY = tl.y + (tr.y - tl.y) * t;
      const botX = bl.x + (br.x - bl.x) * t;
      const botY = bl.y + (br.y - bl.y) * t;

      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(botX, botY);
      ctx.stroke();
    }
    ctx.restore();

    // 5. Draw outer border of polygon
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.stroke();

    // 6. Draw 4 draggable corner pins
    const pins = [
      { id: 'tl', pt: tl, label: 'TL' },
      { id: 'tr', pt: tr, label: 'TR' },
      { id: 'br', pt: br, label: 'BR' },
      { id: 'bl', pt: bl, label: 'BL' }
    ];

    pins.forEach(({ id, pt, label }) => {
      const isActive = activeHandle === id;

      // Glow / outer ring
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isActive ? 18 : 14, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.2)';
      ctx.fill();

      // Solid circle
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#a855f7' : '#6366f1';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });
  }, [image, corners, activeHandle]);

  useEffect(() => {
    renderCanvas();
    const handleResize = () => renderCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  // Pointer event coordinate extractor
  const getEventCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale
    };
  };

  const handlePointerDown = (e) => {
    if (isScanning) return;
    const coords = getEventCoords(e);
    if (!coords) return;

    const hitRadius = 35 / scale; // generous touch/click target
    const handles = ['tl', 'tr', 'br', 'bl'];
    let closest = null;
    let minDist = Infinity;

    handles.forEach((key) => {
      const pt = corners[key];
      const dist = Math.hypot(pt.x - coords.x, pt.y - coords.y);
      if (dist < hitRadius && dist < minDist) {
        minDist = dist;
        closest = key;
      }
    });

    if (closest) {
      setActiveHandle(closest);
      if (e.cancelable) e.preventDefault();
    }
  };

  const handlePointerMove = (e) => {
    if (!activeHandle || isScanning) return;
    const coords = getEventCoords(e);
    if (!coords) return;

    const naturalW = image.naturalWidth || image.width;
    const naturalH = image.naturalHeight || image.height;

    // Clamp inside image bounds
    const clampedX = Math.max(0, Math.min(naturalW, Math.round(coords.x)));
    const clampedY = Math.max(0, Math.min(naturalH, Math.round(coords.y)));

    onCornersChange({
      ...corners,
      [activeHandle]: { x: clampedX, y: clampedY }
    });

    if (e.cancelable) e.preventDefault();
  };

  const handlePointerUp = () => {
    setActiveHandle(null);
  };

  const handleAutoDetect = () => {
    if (!image) return;
    const detected = autoDetectCorners(image);
    onCornersChange(detected);
  };

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      {/* Top action bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 px-1">
        <button
          type="button"
          onClick={onChangeImage}
          disabled={isScanning}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Choose Different Photo
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoDetect}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Corners
          </button>
        </div>
      </div>

      {/* Helper hint */}
      <div className="w-full text-center px-4 py-2 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-xs text-indigo-200">
        <span className="font-semibold text-indigo-300">Alignment Tip:</span> Drag the 4 corner pins so the inner grid lines match the Sudoku cells.
      </div>

      {/* Interactive Canvas */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border-2 border-indigo-500/40 shadow-2xl shadow-indigo-950/40 bg-slate-900 flex items-center justify-center touch-none select-none max-w-full"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="cursor-crosshair block"
        />

        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-4 text-indigo-400 animate-pulse">
              <Scan className="w-8 h-8 animate-spin" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">
              Scanning Sudoku Cells...
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Running client-side OCR on 81 cells ({scanProgress?.current || 0} / 81)
            </p>
            {/* Progress bar */}
            <div className="w-64 max-w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-150"
                style={{ width: `${scanProgress?.percent || 0}%` }}
              />
            </div>
            <span className="text-xs font-mono text-indigo-400 mt-2 font-medium">
              {scanProgress?.percent || 0}%
            </span>
          </div>
        )}
      </div>

      {/* Bottom Main CTA */}
      {!isScanning && (
        <button
          type="button"
          onClick={onStartScan}
          className="w-full max-w-md py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 border border-white/10 flex items-center justify-center gap-2 text-sm transition-all transform active:scale-98"
        >
          <Scan className="w-4 h-4" />
          Extract & Scan Sudoku Numbers
        </button>
      )}
    </div>
  );
}
