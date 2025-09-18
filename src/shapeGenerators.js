export function randomShape(prob = 0.3) {
  return (grid, size) => {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          if (Math.random() < prob) grid.set(x, y, z, 1);
        }
      }
    }
  };
}

export function cubeShape(halfSize = 3, prob = 0.5) {
  return (grid, size) => {
    const center = Math.floor(size / 2);
    for (let x = center - halfSize; x <= center + halfSize; x++) {
      for (let y = center - halfSize; y <= center + halfSize; y++) {
        for (let z = center - halfSize; z <= center + halfSize; z++) {
          if (Math.random() < prob) grid.set(x, y, z, 1);
        }
      }
    }
  };
}

export function tetrahedronShape(height = 7) {
  return (grid, size) => {
    const center = Math.floor(size / 2);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x <= y; x++) {
        for (let z = 0; z <= y - x; z++) {
          const px = center - Math.floor(height / 2) + x;
          const py = center - Math.floor(height / 2) + y;
          const pz = center - Math.floor(height / 2) + z;
          grid.set(px, py, pz, 1);
        }
      }
    }
  };
}

// shapes.js
export function voxelShape(voxelData, scale = 1) {
  return (x, y, z, size) => {
    const cx = Math.floor(size / 2);
    const cy = Math.floor(size / 2);
    const cz = Math.floor(size / 2);

    // Map world coords into voxelData space
    const vx = Math.floor((x - cx) / scale + voxelData.length / 2);
    const vy = Math.floor((y - cy) / scale + voxelData[0].length / 2);
    const vz = Math.floor((z - cz) / scale + voxelData[0][0].length / 2);

    return voxelData?.[vx]?.[vy]?.[vz] === 1 ? 1 : 0;
  };
}
