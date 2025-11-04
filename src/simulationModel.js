import * as THREE from 'three';
import { generateSimulation } from './matrixFunctions';
import { state } from "./state.js";
import { initControls } from './controls.js';
import { initSpace } from './space.js';

export async function initSimulation() {
  // Show loading overlay
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('hidden');

  try {
    // Yield to the browser so the overlay can paint before heavy work
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => setTimeout(resolve, 0));

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
    // Generate Simulation Data - History (Game of Life)
    const [simulationData, clockData] = await generateSimulation(simSize, simGenerations, simSeed);
    state.simulationData = simulationData;
    state.clockData = clockData;

    state.simulationModel =  await buildSimulationModel(simSize);  // Simulation Model
    
    // Model Data to build scene
    const geometry = state.simulationModel.geometry;
    const material = state.simulationModel.material;
    const points = new THREE.Points(geometry, material);

    // Create wireframe grid helper to show simulation bounds
    // Remove existing wireframe grid if it exists
    if (state.simulationModel.wireframeGridHelper) {
      scene.remove(state.simulationModel.wireframeGridHelper);
      // Dispose of geometries and materials
      state.simulationModel.wireframeGridHelper.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
    const wireframeGridHelper = createWireframeGrid(simSize);
    state.simulationModel.wireframeGridHelper = wireframeGridHelper;
    wireframeGridHelper.visible = state.showWireframeGrid ?? false;
    scene.add(wireframeGridHelper);

    updatePoints();
    // drawClock();
    scene.add(points);

    // Hide overlay on next frame to ensure DOM/styles applied
    const overlayNode = document.getElementById('loading-overlay');
    if (overlayNode) {
      requestAnimationFrame(() => overlayNode.classList.add('hidden'));
    }
  } catch (err) {
    console.error('Failed to initialize simulation:', err);
  } finally {
    if (overlay) overlay.classList.add('hidden');
  }
}

// Point Cloud
async function buildSimulationModel(simSize) {

  console.log("LIGMA DOG")

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

  console.log("Update POints")

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

    // drawClock();
  }

  geometry.setDrawRange(0, i);
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;

  document.getElementById("gen").textContent = `${gen}`;
  document.getElementById("slice-value").textContent = `${state.sliceAxis}-${state.sliceIndex}`;
}

function createWireframeGrid(size) {
  const group = new THREE.Group();
  const halfSize = size / 2;
  const color = new THREE.Color(0xffffff);
  const opacity = 0.3;
  
  // Create a wireframe box representing the simulation bounds
  const boxGeometry = new THREE.BoxGeometry(size, size, size);
  const edges = new THREE.EdgesGeometry(boxGeometry);
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: color,
    transparent: true,
    opacity: opacity
  });
  const wireframeBox = new THREE.LineSegments(edges, lineMaterial);
  wireframeBox.position.set(0, 0, 0); // Centered at origin
  
  group.add(wireframeBox);
  
  // Add grid lines to show the grid structure (optional - can be removed if too cluttered)
  const divisions = Math.min(size, 20); // Limit divisions for performance
  const gridHelperXY = new THREE.GridHelper(size, divisions, color, color);
  gridHelperXY.position.z = 0;
  gridHelperXY.material.transparent = true;
  gridHelperXY.material.opacity = opacity * 0.5;
  
  const gridHelperXZ = new THREE.GridHelper(size, divisions, color, color);
  gridHelperXZ.rotation.x = Math.PI / 2;
  gridHelperXZ.position.y = 0;
  gridHelperXZ.material.transparent = true;
  gridHelperXZ.material.opacity = opacity * 0.5;
  
  const gridHelperYZ = new THREE.GridHelper(size, divisions, color, color);
  gridHelperYZ.rotation.z = Math.PI / 2;
  gridHelperYZ.position.x = 0;
  gridHelperYZ.material.transparent = true;
  gridHelperYZ.material.opacity = opacity * 0.5;
  
  group.add(gridHelperXY);
  group.add(gridHelperXZ);
  group.add(gridHelperYZ);
  
  // Dispose of box geometry
  boxGeometry.dispose();
  
  return group;
}

// function drawClock() {
//   const ctx = document.getElementById("clockCanvas").getContext("2d");
//   const frame = state.clockData[state.currentGen % state.clockData.length];
//   ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
//   ctx.drawImage(frame, 0, 0, ctx.canvas.width, ctx.canvas.height);
// }
