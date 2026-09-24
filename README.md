# 🧩 AI Sudoku Solver

A modern, 100% client-side 9×9 Sudoku solver web application designed for **GitHub Pages**. Upload a photo or snap a picture of any Sudoku puzzle, align the grid corners, run in-browser OCR, and solve the puzzle in milliseconds—with **zero backend servers**, zero cloud costs, and zero user installations.

---

## ✨ Features

- 📸 **Photo Upload & Camera Capture**: Upload any Sudoku image (PNG, JPG, WEBP) or capture one live using your mobile/desktop camera.
- 📐 **Interactive 4-Corner Alignment**: Automatic grid detection with draggable corner pins and live 9×9 perspective guide lines for skewed or tilted photos.
- 🔍 **In-Browser OCR Engine**: Extracts digits cell-by-cell using `Tesseract.js` directly inside the browser with real-time scan progress feedback.
- ⚡ **Instant Solver Algorithm**: Backtracking algorithm optimized with the **Minimum Remaining Values (MRV)** heuristic—solves puzzles in **< 2 milliseconds**.
- 🎬 **Visual Step-by-Step Solver**: Watch the backtracking algorithm search and backtrack in real-time, with an adjustable speed slider.
- ⌨️ **Interactive 9×9 Board**:
  - Highlights given clues vs. solved numbers.
  - Live validation: immediately detects conflicting digits in rows, columns, or 3×3 blocks.
  - Full keyboard navigation (arrow keys + numbers) and mobile-friendly on-screen numeric keypad.
- 🔒 **100% Private & Serverless**: All image processing and computations happen locally inside the user's browser. No photos ever leave your device.
- 🚀 **GitHub Pages Ready**: Optimized Vite build with automated CI/CD deployment via GitHub Actions.

---

## 🛠️ Architecture & Tech Stack

```
[User Photo / Camera]
        ↓
[Canvas Homography Transform] (Pure JS Bilinear Perspective Warp)
        ↓
[Cell Slicing & Preprocessing] (Padding, Binarization & Empty-Cell Detection)
        ↓
[Tesseract.js OCR Engine] (WebAssembly Single-Character OCR)
        ↓
[Interactive 9x9 Board] (React + Tailwind CSS + Error Highlighter)
        ↓
[Backtracking Solver Engine] (MRV Heuristic Constraint Satisfaction)
        ↓
[Instant Solved Grid + Confetti Fireworks]
```

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Canvas-Confetti
- **Computer Vision**: HTML5 Canvas, 8-Point Homography Solver, Adaptive Thresholding
- **OCR**: Tesseract.js (WebAssembly)
- **Deployment**: GitHub Pages via GitHub Actions

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ and npm installed

### Installation & Run
```bash
# Clone the repository
git clone https://github.com/vkamthe/SudokuSolver.git
cd SudokuSolver

# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

---

## 📦 GitHub Pages Deployment

This repository includes an automated GitHub Actions workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Enabling GitHub Pages on GitHub:
1. Ensure the repository is **Public** (required for GitHub Pages on free GitHub plans).
2. Go to **Settings** > **Pages** in the repository.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. Pushing to `main` will automatically build and deploy your site to `https://<username>.github.io/SudokuSolver/`.

---

## 📄 License
MIT License. Free to use and modify.
