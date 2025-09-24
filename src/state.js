// state.js
import { randomShape, cubeShape, tetrahedronShape } from './shapeGenerators.js';

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
  scene: null,
  renderer: null,
  camera: null,
  simulationData: null,
  simulationModel: null,
  clockData: null,
  shapeKey: "cube",
  shapes: {
    random: randomShape(0.3),
    cube: cubeShape(5, 1),
    tetrahedron: tetrahedronShape(13)
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