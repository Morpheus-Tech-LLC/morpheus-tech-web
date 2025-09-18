import * as THREE from 'three';
import { generateSimulation } from './matrixFunctions';
import { state } from "./state.js";
import { initControls } from './controls.js';
import { initSpace } from './space.js';

export function initSimulation() {

  state.reset();
  // Initialize subsystems
  initControls();
  initSpace();

  // Getters (from state)
  const scene = state.scene;
  const simSize = state.sim_size
  const simGenerations = state.sim_generations
  const simSeed = state.shapeFn

  // Setters (to state) - Initial View Settings
  state.viewMode = 'full';
  state.sliceAxis = 'x';
  state.sliceIndex = Math.floor(simSize/2);
  state.simulationData = generateSimulation(simSize, simGenerations, simSeed);   // Generate Simulation Data - History (Game of Life)
  state.simulationModel = buildSimulationModel(simSize);  // Simulation Model
  
  // Model Data to build scene
  const geometry = state.simulationModel.geometry;
  const material = state.simulationModel.material;
  const points = new THREE.Points(geometry, material);

  updatePoints();
  scene.add(points);
}

// Point Cloud
function buildSimulationModel(simSize) {

    const matrixSize = simSize;
    const cellSize = 0.4;
    const geometry = new THREE.BufferGeometry();
    const maxParticles = matrixSize * matrixSize * matrixSize;
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setDrawRange(0, 0);

    const material = new THREE.PointsMaterial({
        size: cellSize,
        vertexColors: true
    });

    return {
        geometry: geometry,
        material: material,
        positions: positions,
        colors: colors,
        matrixSize: matrixSize
    }
}

export function updatePoints() {
  const baseColor = new THREE.Color("rgba(0, 180, 200, 1)");
  const targetColor = new THREE.Color("rgb(200,20,0)");
  const geometry = state.simulationModel.geometry;
  const matrixSize = state.simulationModel.matrixSize;

  const simulationData = state.simulationData;
  const gen = state.currentGen;
  const grid = simulationData[gen];
  
  let i = 0;

  for (const [x, y, z] of grid.active) {
    // Slice filtering
    if (
      state.viewMode === "slice" &&
      ((state.sliceAxis === "x" && x !== state.sliceIndex) ||
       (state.sliceAxis === "y" && y !== state.sliceIndex) ||
       (state.sliceAxis === "z" && z !== state.sliceIndex))
    ) {
      continue;
    }

    const normX = x / (matrixSize - 1);
    const normZ = z / (matrixSize - 1);
    const color = baseColor.clone().lerp(targetColor, normX);
    color.offsetHSL(0, 0, normZ * 0.5);

    state.simulationModel.positions[3 * i]     = x - matrixSize / 2;
    state.simulationModel.positions[3 * i + 1] = y - matrixSize / 2;
    state.simulationModel.positions[3 * i + 2] = z - matrixSize / 2;

    state.simulationModel.colors[3 * i]     = color.r;
    state.simulationModel.colors[3 * i + 1] = color.g;
    state.simulationModel.colors[3 * i + 2] = color.b;

    i++;
  }

  geometry.setDrawRange(0, i);
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;

  document.getElementById("gen").textContent = `${gen}`;
  document.getElementById("slice-value").textContent = `${state.sliceAxis}-${state.sliceIndex}`;
}
