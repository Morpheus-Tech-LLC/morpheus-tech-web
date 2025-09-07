import * as THREE from 'three';

// const matrixSize = 50
const baseColor = new THREE.Color("rgb(0,180,200)");
const targetColor = new THREE.Color("rgb(200,20,0)");

// Render one generation
export function updatePoints(simulationData, simulationModel, gen, viewMode, sliceAxis, sliceIndex) {

    const geometry = simulationModel.geometry
    const matrixSize = simulationModel.matrixSize
    const mat = simulationData[gen];
    let i = 0;

    for (let x = 0; x < matrixSize; x++) {
        for (let y = 0; y < matrixSize; y++) {
            for (let z = 0; z < matrixSize; z++) {
                if (mat[x][y][z] === 1) {
                    if (viewMode === 'slice') {
                        if ((sliceAxis === 'x' && x !== sliceIndex) ||
                            (sliceAxis === 'y' && y !== sliceIndex) ||
                            (sliceAxis === 'z' && z !== sliceIndex)) {
                            continue;
                        }
                    }

                    const normX = x / (matrixSize - 1);
                    const normZ = z / (matrixSize - 1);
                    const color = baseColor.clone().lerp(targetColor, normX);
                    color.offsetHSL(0, 0, normZ * 0.5);

                    simulationModel.positions[3 * i] = x - matrixSize / 2;
                    simulationModel.positions[3 * i + 1] = y - matrixSize / 2;
                    simulationModel.positions[3 * i + 2] = z - matrixSize / 2;

                    simulationModel.colors[3 * i] = color.r;
                    simulationModel.colors[3 * i + 1] = color.g;
                    simulationModel.colors[3 * i + 2] = color.b;
                    i++;
                }
            }
        }
    }

  
    geometry.setDrawRange(0, i);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;

    document.getElementById("gen").textContent = `${gen}`;
    document.getElementById("slice-value").textContent = `${sliceAxis}-${sliceIndex}`;
}
