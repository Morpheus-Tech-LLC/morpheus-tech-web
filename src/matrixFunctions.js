import { Grid3D } from './grid3D.js';
import { generateClockHistory } from './time.js';
import { state } from './state.js';

// ---------------------------
// Matrix evolution
// ---------------------------

export async function generateSimulation(size, generations, shapeFn) {
  const history = [];
  let grid = initMatrix(size, shapeFn);

  history.push(grid);
  for (let i = 0; i < generations; i++) {
    grid = convolve3D(grid);
    history.push(grid);
  }

  const timeHistory = await generateClockHistory(128, generations);
  console.log("Generated frames:", timeHistory.length);

  console.log(history)
  console.log(timeHistory)

  return [history, timeHistory];
}

// ---------------------------
// Initialize starting matrix
// ---------------------------

/**
 * Initialize a 3D simulation grid.
 * @param {number} size - Size of the grid (NxNxN)
 * @param {function(Grid3D, number):void} shapeFn - Function that sets alive cells in the grid
 */
export function initMatrix(size, shapeFn) {
  const grid = new Grid3D(size, 0);

  if (typeof shapeFn === 'function') {
    shapeFn(grid, size);
  }

  return grid;
}

// ---------------------------
// Game of Life logic
// ---------------------------

export function convolve3D(grid) {
  const size = grid.size;
  const newGrid = new Grid3D(size, 0);

  // Use a map to avoid duplicate neighbor checks
  const candidates = new Map();

  // Collect candidates: alive cells + neighbors
  for (const [x, y, z] of grid.active) {
    const key = `${x},${y},${z}`;
    candidates.set(key, [x, y, z]);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const nx = grid._wrap(x + dx);
          const ny = grid._wrap(y + dy);
          const nz = grid._wrap(z + dz);
          candidates.set(`${nx},${ny},${nz}`, [nx, ny, nz]);
        }
      }
    }
  }

  // Prepare rule sets for quick lookup
  const birthSet = new Set(state.rules?.birth ?? [9, 10]);
  const survivalSet = new Set(state.rules?.survival ?? []);

  // Apply rules only on candidates
  for (const [x, y, z] of candidates.values()) {
    let neighbors = 0;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dy === 0 && dz === 0) continue;
          const nx = grid._wrap(x + dx);
          const ny = grid._wrap(y + dy);
          const nz = grid._wrap(z + dz);
          neighbors += grid.get(nx, ny, nz);
        }
      }
    }

    const alive = grid.get(x, y, z) === 1;
    let newVal;
    if (alive) {
      newVal = survivalSet.size > 0 ? (survivalSet.has(neighbors) ? 1 : 0) : (neighbors >= 5 && neighbors <= 15 ? 1 : 0);
    } else {
      newVal = birthSet.has(neighbors) ? 1 : 0;
    }

    if (newVal === 1) {
      newGrid.set(x, y, z, 1);
    }
  }

  return newGrid;
}