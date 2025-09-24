// animation.js
import { state } from './state.js';
import { updatePoints } from './simulationModel.js';

export function animate() {
  requestAnimationFrame(animate);

  if (state.isPlaying) {
    const totalGens = state.simulationData.length;
    state.currentGen = state.isReversing
      ? (state.currentGen - 1 + totalGens) % totalGens
      : (state.currentGen + 1) % totalGens;
  }

  updatePoints();

  state.renderer.render(state.scene, state.camera);
}

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

// async function preRenderClockFrames(clockData) {
//   const canvases = [];
//   for (const frame of clockData) {
//     const offscreen = new OffscreenCanvas(frame.length, frame.length);
//     const ctx = offscreen.getContext("2d");
//     const imageData = ctx.createImageData(frame.length, frame.length);

//     for (let y = 0; y < frame.length; y++) {
//       for (let x = 0; x < frame.length; x++) {
//         const val = frame[y][x];
//         const idx = (y * frame.length + x) * 4;
//         imageData.data[idx] = val ? 255 : 0;
//         imageData.data[idx + 1] = val ? 255 : 0;
//         imageData.data[idx + 2] = val ? 255 : 0;
//         imageData.data[idx + 3] = val ? 255 : 0;
//       }
//     }

//     ctx.putImageData(imageData, 0, 0);
//     canvases.push(await createImageBitmap(offscreen));
//   }
//   return canvases;
// }

// Example usage:
// const history = generateClockSimulation(128, 60, 50);
// console.log("Generated frames:", history.length);
