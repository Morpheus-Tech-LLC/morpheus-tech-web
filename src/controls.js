import { state } from "./state.js";
import { initSimulation } from "./simulationModel.js";
import { updatePoints } from "./simulationModel.js";

let pendingShapeKey = null;
let shapeDropdownPrevValue = null;
let shapeDropdownOpened = false;

// controls.js
export function initControls() {

  // If already initialized, just refresh dynamic values and exit to avoid duplicate listeners
  if (state.controlsInitialized) {
    const sliceIndexSliderExisting = document.getElementById('slice-index');
    if (sliceIndexSliderExisting) {
      sliceIndexSliderExisting.max = state.sim_size;
    }
    // Always refresh simulation info displays
    const simSizeEl = document.getElementById('sim-size-value');
    const simGensEl = document.getElementById('sim-generations-value');
    if (simSizeEl) simSizeEl.textContent = String(state.sim_size);
    if (simGensEl) simGensEl.textContent = String(state.sim_generations);
    return;
  }
  // Initialize Simulation info displays on first load
  const simSizeOut = document.getElementById('sim-size-value');
  const simGensOut = document.getElementById('sim-generations-value');
  if (simSizeOut) simSizeOut.textContent = String(state.sim_size);
  if (simGensOut) simGensOut.textContent = String(state.sim_generations);

  const shapeSelect = document.getElementById("shape-select");
  if (shapeSelect) {
    // Reflect current state on first load
    shapeSelect.value = state.shapeKey;
    // Initialize displays from state
    const initParams = state.shapeParams?.[state.shapeKey];
    if (initParams) {
      const sizeOut = document.getElementById('shape-size-value');
      const densityOut = document.getElementById('shape-density-value');
      const shapeOut = document.getElementById('shape-name-value');
      const simSizeOut = document.getElementById('sim-size-value');
      const simGensOut = document.getElementById('sim-generations-value');
      if (sizeOut) sizeOut.textContent = `${Math.min(state.sim_size, Math.max(1, parseInt(initParams.size)))}`;
      if (densityOut) densityOut.textContent = `${Math.min(1, Math.max(0, parseFloat(initParams.density))).toFixed(2)}`;
      if (shapeOut) shapeOut.textContent = state.shapeKey;
      if (simSizeOut) simSizeOut.textContent = `${state.sim_size}`;
      if (simGensOut) simGensOut.textContent = `${state.sim_generations}`;
    }
    // Timed detection: if no change occurs shortly after opening, treat as re-config
    let sameSelectTimer = null;
    const armSameSelectTimer = () => {
      const current = shapeSelect.value;
      clearTimeout(sameSelectTimer);
      sameSelectTimer = setTimeout(() => {
        if (shapeSelect.value === current && current === state.shapeKey) {
          pendingShapeKey = state.shapeKey;
          openShapeModal();
        }
      }, 3);
    };
    shapeSelect.addEventListener('mousedown', armSameSelectTimer);
    shapeSelect.addEventListener('touchstart', armSameSelectTimer, { passive: true });
    shapeSelect.addEventListener('blur', () => { clearTimeout(sameSelectTimer); });
  }

  // Seed config button opens modal directly
  const seedBtn = document.getElementById('seedConfigButton');
  if (seedBtn) {
    seedBtn.addEventListener('click', () => {
      pendingShapeKey = state.shapeKey;
      openShapeModal();
    });
  }

  if (shapeSelect) {
    shapeSelect.addEventListener("change", (e) => {
      // User selected a different shape; cancel same-select timer and open modal
      try { clearTimeout(sameSelectTimer); } catch {}
      pendingShapeKey = e.target.value;
      openShapeModal();
    });
  }


  // --- Slice Tri-State Button ---
  const sliceToggleButton = document.getElementById('triStateButton');
  sliceToggleButton.addEventListener('click', () => {
    // Get all child state sections
    const sections = Array.from(sliceToggleButton.querySelectorAll('.state-section'));

    // Find the active section based on class
    const activeIndex = sections.findIndex(sec => sec.classList.contains('active'));

    sections[activeIndex].classList.remove('active');
    sliceToggleButton.classList.remove(`state-active-${sections[activeIndex].dataset.value}`)
    // Pick next section (wrap around using modulo)
    const nextIndex = (activeIndex + 1) % sections.length;
    const nextSection = sections[nextIndex];
    sliceToggleButton.classList.add(`state-active-${nextSection.dataset.value}`)
    nextSection.classList.add('active');
    const newAxis = nextSection.dataset.value;
    state.sliceAxis = newAxis;
    updatePoints();
  });

  // --- Dual-State for Dimension View Button ---
  const dimensionToggleButton = document.getElementById('dualStateButton');
  dimensionToggleButton.addEventListener('click', () => {
    // Get all child state sections
    const sections = Array.from(dimensionToggleButton.querySelectorAll('.state-section'));

    // Find the active section based on class
    const activeIndex = sections.findIndex(sec => sec.classList.contains('active'));

    sections[activeIndex].classList.remove('active');
    dimensionToggleButton.classList.remove(`state-active-${sections[activeIndex].dataset.id}`)
    // Pick next section (wrap around using modulo)
    const nextIndex = (activeIndex + 1) % sections.length;
    const nextSection = sections[nextIndex];
    dimensionToggleButton.classList.add(`state-active-${nextSection.dataset.id}`)
    nextSection.classList.add('active');

    const newViewMode = nextSection.dataset.value;
    console.log("View Mode Change");
    console.log(newViewMode);
    state.viewMode = newViewMode;
    updatePoints();
    updateTriStateVisibility();
  });

  // --- Slice Index Slider ---
  const sliceIndexSlider = document.getElementById('slice-index');
  const sliceValueLabel = document.getElementById('slice-value');
  sliceIndexSlider.addEventListener('input', () => {
    const index = parseInt(sliceIndexSlider.value);
    state.sliceIndex = index;
    sliceValueLabel.textContent = index;
    if (state.viewMode === 'slice') updatePoints();
  });

  if (sliceIndexSlider) {
    const sliceMax = state.sim_size;
    sliceIndexSlider.max= sliceMax;
  }


  const reverseBtn = document.getElementById("reverseButton");
  const leftArrow = document.getElementById("leftArrow");
  const rightArrow = document.getElementById("rightArrow");
  rightArrow.classList.add("active");
  let isReversing = false; // variable changes based on button
  
  reverseBtn.addEventListener("click", () => {
    // isReversing = getPlaybackDirection
    isReversing = !isReversing; // toggle on/off

    console.log("Reverse mode:", isReversing);
    // setPlaybackDirection(isReversing);
    state.isReversing = isReversing;
    updateArrows();
    
  });
  
  function updateArrows() {
    if (isReversing) {
      leftArrow.classList.add("active");
      rightArrow.classList.remove("active");
    } else {
      leftArrow.classList.remove("active");
      rightArrow.classList.add("active");
    }
    // updateDirectionIcon();
  }

  // Buttons
  const playPauseButton = document.getElementById("playPauseButton");
  const playPauseIcon = document.getElementById("playPauseIcon");
  playPauseButton.onclick = () => {
    const next = !state.isPlaying;
    state.isPlaying = next;
    playPauseIcon.className = next ? "pause" : "play";
    console.log("Playback Direction:", next);
    updateStepButtonVisibility();
  }

  // const reverseButton = document.getElementById("reverseButton");
  const stepButton = document.getElementById("stepButton");
  stepButton.addEventListener("click", () => {
    if (state.isReversing) {
      state.currentGen = (state.currentGen - 1 + state.simulationData.length) % state.simulationData.length;
    } else {
      state.currentGen = (state.currentGen + 1) % state.simulationData.length;
    }

    // update display
    document.getElementById("gen").textContent = `${state.currentGen}`;
  });

  updateStepButtonVisibility();

  const directionButton = document.getElementById("directionButton");
  
  // const directionIcon = document.getElementById("directionIcon");
  // updateDirectionIcon();

  // document.getElementById("reverseButton").addEventListener("click", () => {
  //   state.isReversing = !state.isReversing;
  //   updateDirectionIcon();
  // });

  // Ensure slice/controls visibility reflects current mode on load
  updateTriStateVisibility();

  // Mark controls as initialized to prevent duplicate bindings on re-init
  state.controlsInitialized = true;
}

function updateStepButtonVisibility() {
  const btn = document.getElementById('stepButton');
  if (!btn) return;
  if (state.isPlaying) {
    btn.classList.add('disabled')
  } else {
    btn.classList.remove('disabled')
  }
}

  // function updateDirectionIcon() {
  //   if (state.isReversing) {
  //     directionIcon.textContent = "⏪"; // backwards
  //   } else {
  //     directionIcon.textContent = "⏩"; // forwards
  //   }
  // }

function updateTriStateVisibility() {
  const dual = document.getElementById('dualStateButton');
  const activeSection = dual?.querySelector('.state-section.active');
  const tri = document.getElementById('triStateButton');
  const sliceSlider = document.getElementById('slider');
  const sliceViewer = document.getElementById('sliceViewer');
  const isSlice = activeSection && activeSection.dataset.value === 'slice';
  if (tri) tri.style.display = isSlice ? 'block' : 'none';
  if (sliceSlider) sliceSlider.style.display = isSlice ? 'block' : 'none';
  // Use flex so label/value align like other rows
  if (sliceViewer) sliceViewer.style.display = isSlice ? 'flex' : 'none';
}

function openShapeModal() {
  const modal = document.getElementById('shapeModal');
  const sizeInput = document.getElementById('shape-size');
  const sizeLabel = document.getElementById('shape-size-label');
  const densityInput = document.getElementById('shape-density');
  const modalShapeSelect = document.getElementById('modal-shape-select');
  const confirmBtn = document.getElementById('shapeConfirm');
  const cancelBtn = document.getElementById('shapeCancel');
  const ruleBirth = document.getElementById('rule-birth');
  const ruleSurvival = document.getElementById('rule-survival');
  const ruleIsolation = document.getElementById('rule-isolation');
  const ruleOvercrowd = document.getElementById('rule-overcrowd');
  const simSizeInput = document.getElementById('sim-size');
  const simGenerationsInput = document.getElementById('sim-generations');

  if (!modal || !sizeInput || !densityInput || !confirmBtn || !cancelBtn) return;

  // Initialize simulation inputs from state
  if (simSizeInput) simSizeInput.value = `${state.sim_size}`;
  if (simGenerationsInput) simGenerationsInput.value = `${state.sim_generations}`;

  // Keep shape size max synced to modal Simulation Size
  function updateShapeSizeMax() {
    const maxSim = simSizeInput ? Math.max(1, parseInt(simSizeInput.value) || state.sim_size) : state.sim_size;
    sizeInput.max = `${maxSim}`;
    if (sizeLabel) sizeLabel.textContent = `Size (max ${maxSim})`;
    const curr = Math.max(1, parseInt(sizeInput.value || '1'));
    if (curr > maxSim) sizeInput.value = `${maxSim}`;
  }
  updateShapeSizeMax();
  const key = pendingShapeKey || state.shapeKey;
  if (modalShapeSelect) {
    modalShapeSelect.value = key;
    modalShapeSelect.onchange = (e) => {
      pendingShapeKey = e.target.value;
    };
  }
  // Initialize rules inputs
  if (ruleBirth) ruleBirth.value = stringifyRule(state.rules?.birth ?? [9,10]);
  if (ruleSurvival) ruleSurvival.value = stringifyRule(state.rules?.survival ?? []);
  if (ruleIsolation) ruleIsolation.value = stringifyRule(state.rules?.isolation ?? []);
  if (ruleOvercrowd) ruleOvercrowd.value = stringifyRule(state.rules?.overcrowding ?? []);
  // Prefer params from state; fall back to current displays if present; else final default
  const sizeDisplayEl = document.getElementById('shape-size-value');
  const densityDisplayEl = document.getElementById('shape-density-value');
  const displaySize = sizeDisplayEl ? parseInt(sizeDisplayEl.textContent) : NaN;
  const displayDensity = densityDisplayEl ? parseFloat(densityDisplayEl.textContent) : NaN;
  const params = state.shapeParams?.[key]
    || (
      Number.isFinite(displaySize) && Number.isFinite(displayDensity)
        ? { size: displaySize, density: displayDensity }
        : { size: Math.floor(state.sim_size / 2), density: 0.3 }
    );
  const initMaxSim = simSizeInput ? Math.max(1, parseInt(simSizeInput.value) || state.sim_size) : state.sim_size;
  const initSize = Math.min(initMaxSim, Math.max(1, parseInt(params.size)));
  const initDensity = Math.min(1, Math.max(0, parseFloat(params.density)));
  sizeInput.value = `${initSize}`;
  densityInput.value = `${initDensity.toFixed(2)}`;

  if (simSizeInput) simSizeInput.addEventListener('input', updateShapeSizeMax);

  modal.classList.remove('hidden');

  const onCancel = () => {
    modal.classList.add('hidden');
    cleanup();
    // Revert select to current active shape
    const shapeSelect = document.getElementById('shape-select');
    if (shapeSelect) shapeSelect.value = state.shapeKey;
    pendingShapeKey = null;
  };

  const onConfirm = async () => {
    // Compute proposed sim size/gens first so clamping uses new size
    const newSimSize = simSizeInput ? Math.max(1, parseInt(simSizeInput.value)) : state.sim_size;
    const newSimGenerations = simGenerationsInput ? Math.max(1, parseInt(simGenerationsInput.value)) : state.sim_generations;
    const size = Math.min(newSimSize, Math.max(1, parseInt(sizeInput.value)));
    const density = Math.min(1, Math.max(0, parseFloat(densityInput.value)));
    if (newSimSize !== state.sim_size) {
      state.sim_size = newSimSize;
    }
    if (newSimGenerations !== state.sim_generations) {
      state.sim_generations = newSimGenerations;
    }

    // Update shape functions with chosen params
    if (pendingShapeKey === 'random') {
      state.shapes.random = (await import('./shapeGenerators.js')).randomShape(size, density);
    } else if (pendingShapeKey === 'cube') {
      const half = Math.max(1, Math.floor(size / 2));
      state.shapes.cube = (await import('./shapeGenerators.js')).cubeShape(half, density);
    } else if (pendingShapeKey === 'tetrahedron') {
      state.shapes.tetrahedron = (await import('./shapeGenerators.js')).tetrahedronShape(size, density);
    }

    state.reset();
    state.shapeKey = pendingShapeKey || state.shapeKey;
    // Persist chosen params
    if (!state.shapeParams) state.shapeParams = {};
    state.shapeParams[state.shapeKey] = { size, density };
    // Parse and persist rules
    const birth = parseRule(ruleBirth?.value);
    const survival = parseRule(ruleSurvival?.value);
    const isolation = parseRule(ruleIsolation?.value);
    const overcrowding = parseRule(ruleOvercrowd?.value);
    state.rules = {
      birth: birth.length ? birth : state.rules.birth,
      survival: survival.length ? survival : state.rules.survival,
      isolation: isolation.length ? isolation : state.rules.isolation,
      overcrowding: overcrowding.length ? overcrowding : state.rules.overcrowding,
    };
    resetControlsUI();

    modal.classList.add('hidden');
    cleanup();
    pendingShapeKey = null;
    initSimulation();

    // Update displays
    const sizeOut = document.getElementById('shape-size-value');
    const densityOut = document.getElementById('shape-density-value');
    const shapeOut = document.getElementById('shape-name-value');
    if (sizeOut) sizeOut.textContent = `${size}`;
    if (densityOut) densityOut.textContent = `${density.toFixed(2)}`;
    if (shapeOut) shapeOut.textContent = state.shapeKey;
    // Update simulation display
    const simSizeOut = document.getElementById('sim-size-value');
    const simGensOut = document.getElementById('sim-generations-value');
    if (simSizeOut) simSizeOut.textContent = `${state.sim_size}`;
    if (simGensOut) simGensOut.textContent = `${state.sim_generations}`;
    // Update rules display
    const rb = document.getElementById('rules-birth');
    const rs = document.getElementById('rules-survival');
    const ri = document.getElementById('rules-isolation');
    const ro = document.getElementById('rules-overcrowd');
    if (rb) rb.textContent = stringifyRule(state.rules.birth);
    if (rs) rs.textContent = stringifyRule(state.rules.survival);
    if (ri) ri.textContent = stringifyRule(state.rules.isolation);
    if (ro) ro.textContent = stringifyRule(state.rules.overcrowding);
  };

  function cleanup() {
    confirmBtn.removeEventListener('click', onConfirm);
    cancelBtn.removeEventListener('click', onCancel);
  }

  confirmBtn.addEventListener('click', onConfirm);
  cancelBtn.addEventListener('click', onCancel);
}

function parseRule(str) {
  if (!str) return [];
  const s = String(str).trim();
  if (!s) return [];
  const parts = s.split(',').map(p => p.trim()).filter(Boolean);
  const values = new Set();
  for (const p of parts) {
    if (/^\d+\s*-\s*\d+$/.test(p)) {
      const [a,b] = p.split('-').map(n => parseInt(n.trim(),10));
      const start = Math.min(a,b);
      const end = Math.max(a,b);
      for (let i=start;i<=end;i++) values.add(i);
    } else if (/^\d+$/.test(p)) {
      values.add(parseInt(p,10));
    }
  }
  return Array.from(values).sort((a,b)=>a-b);
}

function stringifyRule(arr) {
  if (!arr || !arr.length) return '';
  const a = Array.from(arr).sort((x,y)=>x-y);
  const ranges = [];
  let start = a[0], prev = a[0];
  for (let i=1;i<a.length;i++) {
    if (a[i] === prev + 1) {
      prev = a[i];
    } else {
      if (start === prev) ranges.push(String(start)); else ranges.push(`${start}-${prev}`);
      start = prev = a[i];
    }
  }
  if (start !== undefined) {
    if (start === prev) ranges.push(String(start)); else ranges.push(`${start}-${prev}`);
  }
  return ranges.join(',');
}

function resetControlsUI() {
  // 3D/2D button → set to 3D (full)
  const dual = document.getElementById('dualStateButton');
  if (dual) {
    const sections = Array.from(dual.querySelectorAll('.state-section'));
    sections.forEach(sec => sec.classList.remove('active'));
    dual.classList.remove('state-active-y');
    dual.classList.add('state-active-x');
    const first = sections[0]; // assumes first is 3D
    if (first) first.classList.add('active');
  }

  // Tri-state axis → set to X
  const tri = document.getElementById('triStateButton');
  if (tri) {
    const sections = Array.from(tri.querySelectorAll('.state-section'));
    sections.forEach(sec => sec.classList.remove('active'));
    tri.classList.remove('state-active-y', 'state-active-z');
    tri.classList.add('state-active-x');
    const xSec = sections.find(s => s.dataset.value === 'x') || sections[0];
    if (xSec) xSec.classList.add('active');
  }

  // Hide slice-related UI by default
  const sliceSlider = document.getElementById('slider');
  const sliceViewer = document.getElementById('sliceViewer');
  if (sliceSlider) sliceSlider.style.display = 'none';
  if (sliceViewer) sliceViewer.style.display = 'none';

  // Reset slice index to mid and label
  const slider = document.getElementById('slice-index');
  const label = document.getElementById('slice-value');
  if (slider) {
    slider.max = state.sim_size;
    const mid = Math.floor(state.sim_size / 2);
    slider.value = `${mid}`;
    if (label) label.textContent = `${mid}`;
  }

  // Reset play/pause to paused and enable step
  const playPauseIcon = document.getElementById('playPauseIcon');
  if (playPauseIcon) playPauseIcon.className = 'play';
  state.isPlaying = false;
  updateStepButtonVisibility();

  // Reset reverse (right arrow active only)
  const leftArrow = document.getElementById('leftArrow');
  const rightArrow = document.getElementById('rightArrow');
  if (leftArrow) leftArrow.classList.remove('active');
  if (rightArrow) rightArrow.classList.add('active');
  state.isReversing = false;

  // Reset generation display
  const genEl = document.getElementById('gen');
  if (genEl) genEl.textContent = '0';
}