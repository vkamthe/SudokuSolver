/**
 * Image processing utilities for grid detection, perspective warping, and cell extraction.
 * 100% pure client-side JavaScript using HTML5 Canvas.
 */

/**
 * Loads an image from a File, Blob, or URL string
 */
export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));

    if (typeof source === 'string') {
      img.src = source;
    } else if (source instanceof File || source instanceof Blob) {
      img.src = URL.createObjectURL(source);
    } else {
      reject(new Error('Invalid image source'));
    }
  });
}

/**
 * Solves an 8x8 linear system A * x = B using Gaussian elimination with partial pivoting
 */
function solveLinearSystem8x8(A, B) {
  const n = 8;
  const M = A.map((row, i) => [...row, B[i]]);

  for (let i = 0; i < n; i++) {
    // Partial pivoting
    let maxEl = Math.abs(M[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > maxEl) {
        maxEl = Math.abs(M[k][i]);
        maxRow = k;
      }
    }
    for (let k = i; k < n + 1; k++) {
      const tmp = M[maxRow][k];
      M[maxRow][k] = M[i][k];
      M[i][k] = tmp;
    }

    if (Math.abs(M[i][i]) < 1e-12) {
      // Degenerate matrix
      return null;
    }

    for (let k = i + 1; k < n; k++) {
      const c = -M[k][i] / M[i][i];
      for (let j = i; j < n + 1; j++) {
        if (i === j) {
          M[k][j] = 0;
        } else {
          M[k][j] += c * M[i][j];
        }
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let k = i + 1; k < n; k++) {
      sum -= M[i][k] * x[k];
    }
    x[i] = sum / M[i][i];
  }
  return x;
}

/**
 * Computes the 3x3 homography matrix mapping dst points (square) -> src points (quadrilateral)
 * dst: (0,0), (W,0), (W,H), (0,H)
 * src: corners [tl, tr, br, bl]
 */
function computeInverseHomography(corners, W, H) {
  const dstPts = [
    { u: 0, v: 0 },
    { u: W, v: 0 },
    { u: W, v: H },
    { u: 0, v: H }
  ];
  const srcPts = [corners.tl, corners.tr, corners.br, corners.bl];

  const A = [];
  const B = [];

  for (let i = 0; i < 4; i++) {
    const { u, v } = dstPts[i];
    const { x, y } = srcPts[i];

    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
    B.push(x);

    A.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
    B.push(y);
  }

  const h = solveLinearSystem8x8(A, B);
  if (!h) return null;

  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1.0]
  ];
}

/**
 * Warps a quadrilateral region defined by 4 corners into a square canvas of size (targetSize x targetSize)
 */
export function warpPerspective(imageElement, corners, targetSize = 450) {
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = imageElement.naturalWidth || imageElement.width;
  srcCanvas.height = imageElement.naturalHeight || imageElement.height;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  srcCtx.drawImage(imageElement, 0, 0);

  const srcImgData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
  const srcData = srcImgData.data;
  const sw = srcCanvas.width;
  const sh = srcCanvas.height;

  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = targetSize;
  dstCanvas.height = targetSize;
  const dstCtx = dstCanvas.getContext('2d');
  const dstImgData = dstCtx.createImageData(targetSize, targetSize);
  const dstData = dstImgData.data;

  const H = computeInverseHomography(corners, targetSize, targetSize);
  if (!H) {
    throw new Error('Perspective warp calculation failed: invalid corners.');
  }

  const [h00, h01, h02] = H[0];
  const [h10, h11, h12] = H[1];
  const [h20, h21, h22] = H[2];

  for (let v = 0; v < targetSize; v++) {
    const rowOffset = v * targetSize * 4;
    for (let u = 0; u < targetSize; u++) {
      const denom = h20 * u + h21 * v + h22;
      const sx = (h00 * u + h01 * v + h02) / denom;
      const sy = (h10 * u + h11 * v + h12) / denom;

      const px = Math.floor(sx);
      const py = Math.floor(sy);
      const dstIdx = rowOffset + u * 4;

      if (px >= 0 && px < sw && py >= 0 && py < sh) {
        // Nearest neighbor / clamped sampling for fast execution
        const srcIdx = (py * sw + px) * 4;
        dstData[dstIdx] = srcData[srcIdx];
        dstData[dstIdx + 1] = srcData[srcIdx + 1];
        dstData[dstIdx + 2] = srcData[srcIdx + 2];
        dstData[dstIdx + 3] = 255;
      } else {
        // Out of bounds
        dstData[dstIdx] = 255;
        dstData[dstIdx + 1] = 255;
        dstData[dstIdx + 2] = 255;
        dstData[dstIdx + 3] = 255;
      }
    }
  }

  dstCtx.putImageData(dstImgData, 0, 0);
  return dstCanvas;
}

/**
 * Automatically estimates the Sudoku grid corners.
 * Falls back to an 80% inset square if contrast/lines are not clearly detected.
 */
export function autoDetectCorners(imageElement) {
  const w = imageElement.naturalWidth || imageElement.width;
  const h = imageElement.naturalHeight || imageElement.height;

  // Render on downsampled canvas for speed
  const scale = Math.min(1, 600 / Math.max(w, h));
  const sw = Math.round(w * scale);
  const sh = Math.round(h * scale);

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageElement, 0, 0, sw, sh);

  const imgData = ctx.getImageData(0, 0, sw, sh);
  const data = imgData.data;

  // Look for bounding box of dark grid lines
  let minX = sw, maxX = 0, minY = sh, maxY = 0;
  let darkPixelCount = 0;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const idx = (y * sw + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Dark pixel
      if (r < 75 && g < 75 && b < 75) {
        darkPixelCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const detectedW = maxX - minX;
  const detectedH = maxY - minY;
  const isReasonableBox =
    darkPixelCount > (sw * sh * 0.01) &&
    detectedW > sw * 0.4 &&
    detectedH > sh * 0.4 &&
    Math.abs(detectedW - detectedH) / Math.max(detectedW, detectedH) < 0.35;

  if (isReasonableBox) {
    // Convert back to original scale with a slight 0.5% margin
    const marginW = (detectedW / scale) * 0.005;
    const marginH = (detectedH / scale) * 0.005;

    const x0 = Math.max(0, minX / scale - marginW);
    const x1 = Math.min(w, maxX / scale + marginW);
    const y0 = Math.max(0, minY / scale - marginH);
    const y1 = Math.min(h, maxY / scale + marginH);

    return {
      tl: { x: Math.round(x0), y: Math.round(y0) },
      tr: { x: Math.round(x1), y: Math.round(y0) },
      br: { x: Math.round(x1), y: Math.round(y1) },
      bl: { x: Math.round(x0), y: Math.round(y1) }
    };
  }

  // Graceful fallback: centered square taking ~80% of minimum dimension
  const side = Math.min(w, h) * 0.82;
  const cx = w / 2;
  const cy = h / 2;
  const half = side / 2;

  return {
    tl: { x: Math.round(cx - half), y: Math.round(cy - half) },
    tr: { x: Math.round(cx + half), y: Math.round(cy - half) },
    br: { x: Math.round(cx + half), y: Math.round(cy + half) },
    bl: { x: Math.round(cx - half), y: Math.round(cy + half) }
  };
}

/**
 * Extracts and prepares an individual cell (row, col) from the warped 450x450 canvas.
 * Applies inner padding to eliminate grid borders and binarizes for OCR.
 */
export function extractCellCanvas(warpedCanvas, row, col, targetSize = 120) {
  const gridW = warpedCanvas.width;
  const gridH = warpedCanvas.height;
  const cellW = gridW / 9;
  const cellH = gridH / 9;

  // 15% inner padding to crop away surrounding black grid lines
  const paddingX = cellW * 0.15;
  const paddingY = cellH * 0.15;
  const sx = col * cellW + paddingX;
  const sy = row * cellH + paddingY;
  const sw = cellW - paddingX * 2;
  const sh = cellH - paddingY * 2;

  const cellCanvas = document.createElement('canvas');
  cellCanvas.width = targetSize;
  cellCanvas.height = targetSize;
  const ctx = cellCanvas.getContext('2d');

  // Fill pure white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetSize, targetSize);

  // Draw centered digit area with generous margins (ideal for Tesseract)
  const margin = Math.round(targetSize * 0.15);
  const drawW = targetSize - margin * 2;
  const drawH = targetSize - margin * 2;
  ctx.drawImage(warpedCanvas, sx, sy, sw, sh, margin, margin, drawW, drawH);

  // Binarize
  const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
  const d = imgData.data;
  let darkCount = 0;

  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (gray < 150) {
      d[i] = 0;
      d[i + 1] = 0;
      d[i + 2] = 0;
      darkCount++;
    } else {
      d[i] = 255;
      d[i + 1] = 255;
      d[i + 2] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Empty cell detection
  // If dark count is too low (< 90 pixels) or overly saturated (> 80%), mark as blank
  const isBlank = darkCount < 90 || darkCount > (targetSize * targetSize * 0.85);

  return {
    canvas: cellCanvas,
    isBlank,
    darkCount
  };
}
