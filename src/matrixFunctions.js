import { Grid3D } from './grid3D.js';
import { generateClockHistory } from './time.js';
import { state } from './state.js';

// ---------------------------
// Matrix evolution
// ---------------------------

export async function generateSimulation(size, generations, shapeFn, useRule30 = false, useRule30_2D = false) {
  console.log(`generateSimulation: size=${size}, generations=${generations}, useRule30=${useRule30}, useRule30_2D=${useRule30_2D}`);
  const history = [];
  let grid = initMatrix(size, shapeFn);
  
  console.log(`Initial grid active cells: ${grid.active.length}`);
  history.push(grid);
  for (let i = 0; i < generations; i++) {
    if (useRule30_2D) {
      grid = evolveRule30_2D(grid);
    } else if (useRule30) {
      grid = evolveRule30(grid);
    } else {
      grid = convolve3D(grid);
    }
    history.push(grid);
    console.log(`Generation ${i + 1}: ${grid.active.length} active cells`);
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
  const wrapping = state.gridWrapping ?? true;

  // Helper function to get neighbor coordinates (wrap or clamp)
  const getNeighborCoord = (coord, delta) => {
    const newCoord = coord + delta;
    if (wrapping) {
      return grid._wrap(newCoord);
    } else {
      // Clamp to bounds when wrapping is off
      return Math.max(0, Math.min(size - 1, newCoord));
    }
  };

  // Use a map to avoid duplicate neighbor checks
  const candidates = new Map();

  // Collect candidates: alive cells + neighbors
  for (const [x, y, z] of grid.active) {
    const key = `${x},${y},${z}`;
    candidates.set(key, [x, y, z]);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const nx = getNeighborCoord(x, dx);
          const ny = getNeighborCoord(y, dy);
          const nz = getNeighborCoord(z, dz);
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
          const nx = getNeighborCoord(x, dx);
          const ny = getNeighborCoord(y, dy);
          const nz = getNeighborCoord(z, dz);
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

// ---------------------------
// Rule 30 evolution (1D CA in 3D space)
// ---------------------------

/**
 * Rule 30: A 1D cellular automaton that evolves downward in 3D space.
 * Each layer (y-level) is computed from the layer above it using Rule 30.
 * Rule 30 pattern: 111→0, 110→0, 101→0, 100→1, 011→1, 010→1, 001→1, 000→0
 */
export function evolveRule30(grid) {
  const size = grid.size;
  const newGrid = new Grid3D(size, 0);
  const wrapping = state.gridWrapping ?? true;

  // Rule 30 lookup table
  const rule30 = {
    '111': 0,
    '110': 0,
    '101': 0,
    '100': 1,
    '011': 1,
    '010': 1,
    '001': 1,
    '000': 0
  };

  // Find the bottommost layer that has any cells using the active array
  let bottomLayer = -1;
  for (const [x, y, z] of grid.active) {
    bottomLayer = Math.max(bottomLayer, y);
  }

  // Debug: log initial state
  console.log(`Rule 30 evolve: grid.active.length=${grid.active.length}, bottomLayer=${bottomLayer}`);

  // If no cells found, return empty grid
  if (bottomLayer === -1) {
    console.log('Rule 30: No cells found in grid');
    return newGrid;
  }

  // Copy all existing cells to the new grid
  for (const [x, y, z] of grid.active) {
    newGrid.set(x, y, z, 1);
  }

  // If we've reached the bottom of the space, can't evolve further
  if (bottomLayer >= size - 1) {
    console.log(`Rule 30: Reached bottom of space at y=${bottomLayer}`);
    return newGrid;
  }

  // Evolve one new layer below the bottommost layer
  const newLayerY = bottomLayer + 1;
  const sourceLayerY = bottomLayer; // Evolve from the bottommost layer

  // Helper to get neighbor value with wrapping
  const getNeighbor = (x, y, z, dx) => {
    const nx = x + dx;
    if (wrapping) {
      return grid.get(grid._wrap(nx), y, z);
    } else {
      const clampedX = Math.max(0, Math.min(size - 1, nx));
      return grid.get(clampedX, y, z);
    }
  };

  // For each z slice, evolve the new layer based on the source layer
  let newCellsCount = 0;
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      // Get the three neighbors from the source layer (left, center, right)
      const left = getNeighbor(x, sourceLayerY, z, -1);
      const center = grid.get(x, sourceLayerY, z);
      const right = getNeighbor(x, sourceLayerY, z, 1);
      
      // Create pattern string - ensure values are 0 or 1
      const pattern = `${left}${center}${right}`;
      
      // Apply Rule 30
      const newValue = rule30[pattern] !== undefined ? rule30[pattern] : 0;
      
      // Set the cell in the new layer below
      if (newValue === 1) {
        newGrid.set(x, newLayerY, z, 1);
        newCellsCount++;
      }
    }
  }
  
  // Debug: log some info about the evolution
  console.log(`Rule 30: Evolved from ${grid.active.length} to ${newGrid.active.length} cells, bottomLayer: ${bottomLayer}, newLayerY: ${newLayerY}, newCellsCount: ${newCellsCount}`);

  return newGrid;
}

// ---------------------------
// Rule 30 2D evolution (2D CA in 3D space)
// ---------------------------

/**
 * Rule 30 2D: A 2D cellular automaton that evolves downward in 3D space.
 * Each layer (y-level) is computed from the layer above it using Rule 30 adapted for 2D.
 * Uses the full 3x3 neighborhood (9 cells, including the center) from the previous generation.
 * The classic 1D Rule 30 behaviour is preserved when activity is confined to a single row.
 */
export function evolveRule30_2D(grid) {
  const size = grid.size;
  const newGrid = new Grid3D(size, 0);
  const wrapping = state.gridWrapping ?? true;

  // Rule 30 lookup table (same as 1D version)
  const rule30 = {
    '111': 0,
    '110': 0,
    '101': 0,
    '100': 1,
    '011': 1,
    '010': 1,
    '001': 1,
    '000': 0
  };

  // Find the bottommost layer that has any cells using the active array
  let bottomLayer = -1;
  for (const [x, y, z] of grid.active) {
    bottomLayer = Math.max(bottomLayer, y);
  }

  // Debug: log initial state
  console.log(`Rule 30 2D evolve: grid.active.length=${grid.active.length}, bottomLayer=${bottomLayer}`);

  // If no cells found, return empty grid
  if (bottomLayer === -1) {
    console.log('Rule 30 2D: No cells found in grid');
    return newGrid;
  }

  // Copy all existing cells to the new grid
  for (const [x, y, z] of grid.active) {
    newGrid.set(x, y, z, 1);
  }

  // If we've reached the bottom of the space, can't evolve further
  if (bottomLayer >= size - 1) {
    console.log(`Rule 30 2D: Reached bottom of space at y=${bottomLayer}`);
    return newGrid;
  }

  // Evolve one new layer below the bottommost layer
  const newLayerY = bottomLayer + 1;
  const sourceLayerY = bottomLayer; // Evolve from the bottommost layer

  // Helper to get neighbor value with wrapping
  const getNeighbor = (x, y, z, dx, dz) => {
    const nx = x + dx;
    const nz = z + dz;
    if (wrapping) {
      return grid.get(grid._wrap(nx), y, grid._wrap(nz));
    } else {
      const clampedX = Math.max(0, Math.min(size - 1, nx));
      const clampedZ = Math.max(0, Math.min(size - 1, nz));
      return grid.get(clampedX, y, clampedZ);
    }
  };

  // For each cell in the new layer, evolve based on the full 3x3 neighborhood from source layer
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const topLeft = getNeighbor(x, sourceLayerY, z, -1, -1);
      const top = getNeighbor(x, sourceLayerY, z, 0, -1);
      const topRight = getNeighbor(x, sourceLayerY, z, 1, -1);
      const left = getNeighbor(x, sourceLayerY, z, -1, 0);
      const center = grid.get(x, sourceLayerY, z);
      const right = getNeighbor(x, sourceLayerY, z, 1, 0);
      const bottomLeft = getNeighbor(x, sourceLayerY, z, -1, 1);
      const bottom = getNeighbor(x, sourceLayerY, z, 0, 1);
      const bottomRight = getNeighbor(x, sourceLayerY, z, 1, 1);

      // Evaluate Rule 30 along each row of the 3x3 neighborhood
      const topPattern = `${topLeft}${top}${topRight}`;
      const midPattern = `${left}${center}${right}`;
      const bottomPattern = `${bottomLeft}${bottom}${bottomRight}`;

      const topResult = rule30[topPattern] ?? 0;
      const midResult = rule30[midPattern] ?? 0;
      const bottomResult = rule30[bottomPattern] ?? 0;

      // Combine row results: preserve classic Rule 30 when only the middle row is active,
      // but allow the other neighbors to toggle the outcome based on their own Rule 30 evaluations.
      const parity = (topResult + bottomResult) % 2;
      const newValue = parity === 0 ? midResult : (midResult ^ 1);

      // Set the cell in the new layer below
      if (newValue === 1) {
        newGrid.set(x, newLayerY, z, 1);
      }
    }
  }
  
  // Debug: log some info about the evolution
  console.log(`Rule 30 2D: Evolved from ${grid.active.length} to ${newGrid.active.length} cells, bottomLayer: ${bottomLayer}, newLayerY: ${newLayerY}`);

  return newGrid;
}