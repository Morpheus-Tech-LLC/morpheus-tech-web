import { updatePoints } from './matrixVisualizations';
import { initControls } from './simulationControls';
import { initSpace } from './spaceSetup';
import { initSimulation } from './simulationSetup';

// Visualization Variables
let viewMode = 'full';
let sliceAxis = 'x';
let sliceIndex = 15;
let currentGen = 0;
let isPlaying = false;
let isReversing = false;

// Space Variables
let scene = null;
let renderer = null;
let camera = null;

// Sim Variables
let simulationData = null;
let simulationModel = null;
let simulationInitialState = null;

// Constants
const size = 50;
const generations = 200;

// Functions to update/get state
const controlsAPI = {
  getViewMode: () => viewMode,
  setPlaybackDirection: (direction) => isReversing = direction,
  setPlayPauseToggle: (playPause) => isPlaying = playPause,
  setViewMode: (v) => viewMode = v,
  setSliceAxis: (axis) => sliceAxis = axis,
  setSliceIndex: (i) => sliceIndex = i,
  getSliceMax: () => size,
  updatePointsCallback: () => updatePoints(simulationData, simulationModel, currentGen, viewMode, sliceAxis, sliceIndex)
};

const spaceAPI = {
  setScene: (s) => scene = s,
  setRenderer: (r) => renderer = r,
  setCamera: (c) => camera = c,
  getSimSize: () => size
}

const simulationAPI = {
  getSimSize: () => size,
  getSimGenerations: () => generations,
  setSimulationData: (simData) => simulationData = simData,
  setSimulationModel: (simModel) => simulationModel = simModel,
  setSimulationInitialState: (simInitialState) => simulationInitialState = simInitialState
}

// Initialization of Simulation Components
initControls(controlsAPI);
initSpace(spaceAPI);
initSimulation(simulationAPI);

// Render Initial State
updatePoints(simulationData, simulationModel, 0, viewMode, sliceAxis, sliceIndex);
scene.add(simulationInitialState);

// Animate
animate();

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  if (isPlaying) {
    if (!isReversing) {
      currentGen = (currentGen + 1) % simulationData.length;
    } else {
      currentGen = (currentGen - 1 + simulationData.length) % simulationData.length;
    }
    updatePoints(simulationData, simulationModel, currentGen, viewMode, sliceAxis, sliceIndex);
  }
  renderer.render(scene, camera);
}