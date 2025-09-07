// Matrix evolution data processing
export function generateSimulation(size, generations) {
  let history = [];
  let matrix = initMatrix(size);
  history.push(matrix);
  for (let i = 0; i < generations; i++) {
    matrix = convolve3D(size, matrix);
    history.push(matrix);
  }
  return history
}

// Initialize starting matrix
export function initMatrix(size) {
  const matrix = Array(size).fill().map(() =>
    Array(size).fill().map(() =>
      Array(size).fill(0)));

  const center = Math.floor(size / 2);
  const half = Math.floor(7 / 2);
  for (let x = center - half; x <= center + half; x++) {
    for (let y = center - half; y <= center + half; y++) {
      for (let z = center - half; z <= center + half; z++) {
        matrix[x][y][z] = Math.random() < 0.3 ? 1 : 0;
      }
    }
  }
  return matrix;
};

// Game of life logic 
export function convolve3D(size, grid) {
  const newGrid = structuredClone(grid);
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        let neighbors = 0;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              if (dx === 0 && dy === 0 && dz === 0) continue;
              const nx = (x + dx + size) % size;
              const ny = (y + dy + size) % size;
              const nz = (z + dz + size) % size;
              neighbors += grid[nx][ny][nz];
            }
          }
        }

        const alive = grid[x][y][z] === 1;
        if (!alive && (neighbors === 9 || neighbors === 10)) {
          newGrid[x][y][z] = 1;
        } else if (alive && (neighbors >= 5 && neighbors <= 15)) {
          newGrid[x][y][z] = 1;
        } else {
          newGrid[x][y][z] = 0;
        }
      }
    }
  }
  return newGrid;
};