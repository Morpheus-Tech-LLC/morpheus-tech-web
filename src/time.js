// animation.js
import { state } from './state.js';
import { updatePoints } from './simulationModel.js';

export function animate() {
  requestAnimationFrame(animate);

  if (state.isPlaying) {
    const totalGens = state.simulationData.length;
    state.currentGen = state.isReversing
      ? (state.currentGen - 1 + totalGens) % totalGens
      : (state.currentGen + 1) % totalGens;

    updatePoints();
  }

  state.renderer.render(state.scene, state.camera);
}