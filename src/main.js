// main.js

import { initSimulation } from './simulationModel.js';
import { animate } from './time.js';

(async () => {
    await initSimulation();
    animate();
})();

// initSimulation();

// // Start animation loop
// animate();