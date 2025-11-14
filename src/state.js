// state.js
import { perlinShape, cubeShape, tetrahedronShape, octahedronShape, worleyShape, rule30Shape } from './shapeGenerators.js';

// Mutable state
export const state = {
  sim_size: 50,
  sim_generations: 100,
  viewMode: null,
  sliceAxis: null,
  sliceIndex: null,
  currentGen: 0,
  isPlaying: false,
  isReversing: false,
  gridWrapping: true,
  showWireframeGrid: false,
  showCellWireframe: false,
  cellSize: 1.2, // Size of cells (points and wireframe cubes)
  scene: null,
  renderer: null,
  camera: null,
  simulationData: null,
  simulationModel: null,
  clockData: null,
  controlsInitialized: false,
  shapeKey: "cube",
  simulationMode: "gameOfLife",
  useRule30: false,
  useRule30_2D: false,
  flipOrientation: false,
  shapes: {
    perlin: perlinShape(10, 0.3, 30),
    cube: cubeShape(5, 1),
    tetrahedron: tetrahedronShape(13),
    octahedron: octahedronShape(8, 1),
    worley: worleyShape(8, 0.5, 20),
    rule30: rule30Shape()
  },
  // Simulation rules (neighbor counts)
  rules: {
    birth: [9, 10],
    survival: Array.from({ length: 11 }, (_, i) => i + 5), // 5-15
    isolation: [0, 1, 2, 3, 4],
    overcrowding: Array.from({ length: 11 }, (_, i) => i + 16), // 16-26
  },
  // Boundary rules for cells with fewer neighbors (proportional to interior rules)
  // Only applied when grid wrapping is OFF
  boundaryRules: {
    // Corner cells: 7 neighbors (7/26 ≈ 0.269 of interior)
    // All 3 coordinates are on boundary (0 or size-1)
    corner: {
      birth: [2, 3],
      survival: [2, 3, 4],
      isolation: [0, 1],
      overcrowding: [5, 6, 7],
    },
    // Edge cells (two faces): 17 neighbors (17/26 ≈ 0.654 of interior)
    // Exactly 2 coordinates are on boundary
    edgeTwoFaces: {
      birth: [6],
      survival: [3, 4, 5, 6, 7, 8, 9],
      isolation: [0, 1, 2],
      overcrowding: [10, 11, 12, 13, 14, 15, 16, 17],
    },
    // Face cells (one face): 19 neighbors (19/26 ≈ 0.731 of interior)
    // Exactly 1 coordinate is on boundary
    face: {
      birth: [7],
      survival: [4, 5, 6, 7, 8, 9, 10, 11],
      isolation: [0, 1, 2, 3],
      overcrowding: [12, 13, 14, 15, 16, 17, 18, 19],
    },
  },
  shapeParams: {
    perlin: { size: 10, density: 0.3, regionSize: 25 },
    cube: { size: 10, density: 1 },
    tetrahedron: { size: 13, density: 1 },
    octahedron: { size: 8, density: 1 },
    worley: { size: 8, density: 0.3, regionSize: 25 }
  },
  get shapeFn() {
    return this.shapes[this.shapeKey];
  },
  reset() {
    this.viewMode = null;
    this.sliceAxis = null;
    this.sliceIndex = null;
    this.currentGen = 0;
    this.isPlaying = false;
    this.isReversing = false;
    this.clockData = null;
    // Don't reset this - set up
    // this.scene = null;
    // this.renderer = null;
    // this.camera = null;
    this.simulationData = null;
    this.simulationModel = null;
    // this.shapeKey = "cube";
    // Don't reset useRule30 - it persists until explicitly changed
  }
};