// animation.js
import { state } from './state.js';
import { updatePoints } from './simulationModel.js';

let lastFrameTime = 0;
let lastUpdateTime = 0;

let fps = 60;
let frameInterval = 1000 / fps;

let frameCount = 0;
let lastFpsUpdate = 0;
let measuredFps = 0;

let simSpeed = 0.1;        // user multiplier
const baseInterval = 100;  // ms per generation at normal speed → 10 gens/s base rate

const fpsDisplay = document.getElementById('fps-value');
const speedDisplay = document.getElementById('speed-value');
const speedControl = document.getElementById('speed-control');

function updateSpeedDisplay() {
  const gensPerSecond = (1000 / (baseInterval / simSpeed)).toFixed(0);
  speedDisplay.textContent = `${gensPerSecond}`;
}

if (speedControl) {
  speedControl.addEventListener('input', (e) => {
    simSpeed = parseFloat(e.target.value);
    updateSpeedDisplay();
  });
  updateSpeedDisplay(); // initialize on load
}

export function animate(currentTime) {
  requestAnimationFrame(animate);

  if (!lastFrameTime) lastFrameTime = currentTime;
  const elapsedFrame = currentTime - lastFrameTime;

  // maintain smooth rendering at ~60 FPS
  if (elapsedFrame >= frameInterval) {
    lastFrameTime = currentTime - (elapsedFrame % frameInterval);

    // === FPS Measurement ===
    frameCount++;
    const now = performance.now();
    if (now - lastFpsUpdate >= 1000) {
      measuredFps = frameCount;
      frameCount = 0;
      lastFpsUpdate = now;
      if (fpsDisplay) fpsDisplay.textContent = measuredFps.toFixed(0);
    }

    // === Simulation Timing ===
    if (!lastUpdateTime) lastUpdateTime = currentTime;
    const elapsedSim = currentTime - lastUpdateTime;

    if (elapsedSim >= baseInterval / simSpeed) {
      lastUpdateTime = currentTime;

      if (state.isPlaying) {
        const totalGens = state.simulationData.length;
        state.currentGen = state.isReversing
          ? (state.currentGen - 1 + totalGens) % totalGens
          : (state.currentGen + 1) % totalGens;
      }

      updatePoints();
    }

    // Always render the scene
    state.renderer.render(state.scene, state.camera);

    // Safety: hide loading overlay once we are rendering with data
    const overlay = document.getElementById('loading-overlay');
    if (overlay && !overlay.classList.contains('hidden') && state.simulationData && state.simulationModel) {
      overlay.classList.add('hidden');
    }
  }
}



// let lastFrameTime = 0;
// const fps = 60;
// const frameInterval = 1000 / fps; // ~16.67 ms per frame

// export function animate(currentTime) {
//   requestAnimationFrame(animate);

//   if (!lastFrameTime) lastFrameTime = currentTime;

//   const elapsed = currentTime - lastFrameTime;

//   // Only render if enough time has passed for 60 FPS
//   if (elapsed >= frameInterval) {
//     lastFrameTime = currentTime - (elapsed % frameInterval);

//     if (state.isPlaying) {
//       const totalGens = state.simulationData.length;
//       state.currentGen = state.isReversing
//         ? (state.currentGen - 1 + totalGens) % totalGens
//         : (state.currentGen + 1) % totalGens;
//     }

//     updatePoints();
//     state.renderer.render(state.scene, state.camera);
//   }
// }

// export function animate() {
//   requestAnimationFrame(animate);

//   if (state.isPlaying) {
//     const totalGens = state.simulationData.length;
//     state.currentGen = state.isReversing
//       ? (state.currentGen - 1 + totalGens) % totalGens
//       : (state.currentGen + 1) % totalGens;
//   }

//   updatePoints();

//   state.renderer.render(state.scene, state.camera);
// }

/**
 * Generate a single 2D clock frame
 * @param {number} size - Matrix size (e.g., 128).
 * @param {number} radius - Radius of the circle.
 * @param {number} currentGen - Generation number.
 * @param {number} totalGenerations - Total number of generations in simulation.
 * @returns {number[][]} 2D matrix of 0s and 1s.
 */
export function generateClockFrame(size, gen, totalGens) {
  const cx = Math.floor(size / 2);
  const cy = Math.floor(size / 2);
  const radius = Math.floor(size / 2) - 2;
  const frame = Array.from({ length: size }, () => Array(size).fill(0));

  // === Draw circle outline ===
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (Math.abs(dist - radius) < 1.5) {
        frame[y][x] = 1;
      }
    }
  }

  // === Draw hand ===
  const angle = (gen / totalGens) * 2 * Math.PI; // proportion of full circle
  const handLength = radius - 3;

  for (let i = 0; i <= handLength; i++) {
    const x = Math.round(cx + Math.cos(angle) * i);
    const y = Math.round(cy + Math.sin(angle) * i);

    if (x >= 0 && x < size && y >= 0 && y < size) {
      frame[y][x] = 1;
    }
  }

  return frame;
}

export async function generateClockHistory(size, generations) {
  const frames = [];

  for (let gen = 0; gen < generations; gen++) {
    const matrix = generateClockFrame(size, gen, generations);

    // Use OffscreenCanvas for efficient bitmap creation
    const offscreen = new OffscreenCanvas(size, size);
    const ctx = offscreen.getContext("2d");
    const imageData = ctx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const val = matrix[y][x];
        const idx = (y * size + x) * 4;
        imageData.data[idx]     = val ? 255 : 0;
        imageData.data[idx + 1] = val ? 255 : 0;
        imageData.data[idx + 2] = val ? 255 : 0;
        imageData.data[idx + 3] = val ? 255 : 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // ✅ Convert canvas → ImageBitmap (this is async)
    const bitmap = await createImageBitmap(offscreen);
    frames.push(bitmap);
  }

  return frames;
}
