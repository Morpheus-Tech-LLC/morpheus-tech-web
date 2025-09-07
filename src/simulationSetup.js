import * as THREE from 'three';
import { generateSimulation } from './matrixFunctions';

export function initSimulation({getSimSize, getSimGenerations, setSimulationData, setSimulationModel, setSimulationInitialState}) {

    const simSize = getSimSize();
    const simGenerations = getSimGenerations();

    const simulationData = generateSimulation(simSize, simGenerations);
    setSimulationData(simulationData);

    const simulationModel = buildSimulationModel(simSize)
    setSimulationModel(simulationModel);

    // Initial Simulation State
    const geometry = simulationModel.geometry;
    const material = simulationModel.material;
    const points = new THREE.Points(geometry, material);
    setSimulationInitialState(points)
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

