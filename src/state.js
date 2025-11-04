// state.js
import { perlinShape, cubeShape, tetrahedronShape, octahedronShape, worleyShape } from './shapeGenerators.js';

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
  scene: null,
  renderer: null,
  camera: null,
  simulationData: null,
  simulationModel: null,
  clockData: null,
  controlsInitialized: false,
  shapeKey: "cube",
  shapes: {
    perlin: perlinShape(10, 0.3),
    cube: cubeShape(5, 1),
    tetrahedron: tetrahedronShape(13),
    octahedron: octahedronShape(8, 1),
    worley: worleyShape(8, 0.5, 20)
  },
  // Simulation rules (neighbor counts)
  rules: {
    birth: [9, 10],
    survival: Array.from({ length: 11 }, (_, i) => i + 5), // 5-15
    isolation: [0, 1, 2, 3, 4],
    overcrowding: Array.from({ length: 11 }, (_, i) => i + 16), // 16-26
  },
  shapeParams: {
    perlin: { size: 10, density: 0.3 },
    cube: { size: 10, density: 1 },
    tetrahedron: { size: 13, density: 1 },
    octahedron: { size: 8, density: 1 },
    worley: { size: 8, density: 0.5, regionSize: 20 }
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
  }
};