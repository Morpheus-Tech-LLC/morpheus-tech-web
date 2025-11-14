import { state } from "./state.js";
import { initSimulation, updatePoints } from "./simulationModel.js";
import * as THREE from 'three';

let pendingShapeKey = null;
let shapeDropdownPrevValue = null;
let shapeDropdownOpened = false;

// controls.js
export function initControls() {

  // If already initialized, just refresh dynamic values and exit to avoid duplicate listeners
  if (state.controlsInitialized) {
    const sliceIndexSliderExisting = document.getElementById('slice-index');
    if (sliceIndexSliderExisting) {
      sliceIndexSliderExisting.max = state.sim_size - 1;
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
    const sliceMax = state.sim_size - 1; // Grid indices are 0 to sim_size - 1
    sliceIndexSlider.max = sliceMax;
    // Ensure current value is within valid range
    if (parseInt(sliceIndexSlider.value) > sliceMax) {
      sliceIndexSlider.value = sliceMax;
      state.sliceIndex = sliceMax;
    }
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

  // Wireframe grid toggle
  const wireframeGridToggle = document.getElementById('wireframeGridToggle');
  const wireframeGridIcon = document.getElementById('wireframeGridIcon');
  if (wireframeGridToggle) {
    wireframeGridToggle.addEventListener('click', () => {
      state.showWireframeGrid = !state.showWireframeGrid;
      // Update icon color - blue when active, white/gray when inactive
      if (wireframeGridIcon) {
        wireframeGridIcon.style.fill = state.showWireframeGrid ? '#4da3ff' : 'currentColor';
      }
      // Toggle visibility of wireframe grid
      if (state.simulationModel && state.simulationModel.wireframeGridHelper) {
        state.simulationModel.wireframeGridHelper.visible = state.showWireframeGrid;
      }
    });
    // Initialize icon state
    if (wireframeGridIcon) {
      wireframeGridIcon.style.fill = state.showWireframeGrid ? '#4da3ff' : 'currentColor';
    }
  }

  // Wireframe cells toggle
  const wireframeCellsToggle = document.getElementById('wireframeCellsToggle');
  const wireframeCellsIcon = document.getElementById('wireframeCellsIcon');
  if (wireframeCellsToggle) {
    wireframeCellsToggle.addEventListener('click', () => {
      state.showCellWireframe = !state.showCellWireframe;
      // Update icon color - blue when active, white/gray when inactive
      if (wireframeCellsIcon) {
        wireframeCellsIcon.style.fill = state.showCellWireframe ? '#4da3ff' : 'currentColor';
      }
      // Toggle visibility of wireframe cells and points
      if (state.simulationModel) {
        const points = state.simulationModel.points;
        const wireframeCellsGroup = state.simulationModel.wireframeCellsGroup;
        if (points) {
          points.visible = !state.showCellWireframe;
        }
        if (wireframeCellsGroup) {
          wireframeCellsGroup.visible = state.showCellWireframe;
        }
        // Always update wireframe cells when toggling (to ensure they're generated/updated)
        if (state.simulationData) {
          updatePoints();
        }
      }
    });
    // Initialize icon state
    if (wireframeCellsIcon) {
      wireframeCellsIcon.style.fill = state.showCellWireframe ? '#4da3ff' : 'currentColor';
    }
  }

  // Cell size slider
  const cellSizeSlider = document.getElementById('cellSizeSlider');
  if (cellSizeSlider) {
    // Initialize slider value from state
    cellSizeSlider.value = state.cellSize ?? 1.2;
    
    cellSizeSlider.addEventListener('input', () => {
      const newSize = parseFloat(cellSizeSlider.value);
      state.cellSize = newSize;
      
      // Update points material size
      if (state.simulationModel && state.simulationModel.material) {
        const material = state.simulationModel.material;
        if (material instanceof THREE.PointsMaterial) {
          material.size = newSize;
          material.needsUpdate = true;
        } else if (material.uniforms && material.uniforms.uPointSize) {
          // Shader material (dithering enabled)
          material.uniforms.uPointSize.value = newSize;
        }
      }
      
      // Update wireframe cells if visible
      if (state.simulationData && state.showCellWireframe) {
        updatePoints();
      }
    });
  }

  // Flip orientation toggle (applies to all simulations)
  const flipOrientationToggle = document.getElementById('flipOrientationToggle');
  const flipOrientationIcon = document.getElementById('flipOrientationIcon');
  if (flipOrientationToggle) {
    flipOrientationToggle.addEventListener('click', () => {
      state.flipOrientation = !state.flipOrientation;
      // Update icon color - blue when active (flipped), white/gray when inactive
      if (flipOrientationIcon) {
        flipOrientationIcon.style.fill = state.flipOrientation ? '#4da3ff' : 'currentColor';
      }
      // Update rendering to reflect the flip
      if (state.simulationData) {
        updatePoints();
      }
    });
    // Initialize icon state
    if (flipOrientationIcon) {
      flipOrientationIcon.style.fill = state.flipOrientation ? '#4da3ff' : 'currentColor';
    }
  }

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
  const regionSizeInput = document.getElementById('shape-region-size');
  const regionSizeLabel = document.getElementById('shape-region-size-label');
  const modalShapeSelect = document.getElementById('modal-shape-select');
  const confirmBtn = document.getElementById('shapeConfirm');
  const cancelBtn = document.getElementById('shapeCancel');
  const simulationModeSelect = document.getElementById('simulation-mode-select');
  const rulesSection = document.getElementById('rules-section');
  const seedSection = document.getElementById('seed-section');
  const simSizeLabel = document.getElementById('sim-size-label');
  const gridWrappingLabel = document.getElementById('grid-wrapping-label');
  const ruleBirth = document.getElementById('rule-birth');
  const ruleSurvival = document.getElementById('rule-survival');
  const ruleIsolation = document.getElementById('rule-isolation');
  const ruleOvercrowd = document.getElementById('rule-overcrowd');
  const simSizeInput = document.getElementById('sim-size');
  const simGenerationsInput = document.getElementById('sim-generations');
  const gridWrappingCheckbox = document.getElementById('grid-wrapping-checkbox');

  if (!modal || !sizeInput || !densityInput || !confirmBtn || !cancelBtn) return;

  // Initialize simulation inputs from state
  if (simSizeInput) simSizeInput.value = `${state.sim_size}`;
  if (simGenerationsInput) simGenerationsInput.value = `${state.sim_generations}`;
  if (gridWrappingCheckbox) gridWrappingCheckbox.checked = state.gridWrapping ?? true;

  // Initialize simulation mode dropdown
  if (simulationModeSelect) {
    simulationModeSelect.value = state.simulationMode || 'gameOfLife';
  }

  const key = pendingShapeKey || state.shapeKey;

  // Function to calculate required size for Rule 30 based on generations
  function calculateRule30Size(generations, mode) {
    if (mode === 'rule30') {
      // Rule 30 (1D): grows in a triangular pattern
      // Maximum width = 2 * generations + 1 (with padding for asymmetric growth)
      // Height = generations + 1 (initial layer + all generations)
      // Depth = 1 (only one z slice)
      // Use the maximum of width and height, with some padding
      const maxWidth = 2 * generations + 1;
      const padding = Math.ceil(generations * 0.1); // 10% padding for safety
      return Math.max(maxWidth + padding, generations + 1 + padding);
    } else if (mode === 'rule30_2D') {
      // Rule 30 (3D): grows in 2D, spreading in both x and z directions
      // Similar calculation but needs to account for 2D spread
      const maxWidth = 2 * generations + 1;
      const padding = Math.ceil(generations * 0.15); // 15% padding for 2D spread
      return Math.max(maxWidth + padding, generations + 1 + padding);
    }
    return 50; // Default fallback
  }

  // Function to update UI based on selected mode
  function updateModeUI(mode) {
    if (mode === 'gameOfLife') {
      // Show rules section
      if (rulesSection) rulesSection.style.display = '';
      // Show seed section
      if (seedSection) seedSection.style.display = '';
      // Show size and grid wrapping controls
      if (simSizeLabel) simSizeLabel.style.display = '';
      if (simSizeInput) simSizeInput.style.display = '';
      if (gridWrappingLabel) gridWrappingLabel.style.display = '';
      if (gridWrappingCheckbox) gridWrappingCheckbox.style.display = '';
      // Show all shape options
      if (modalShapeSelect) {
        Array.from(modalShapeSelect.options).forEach(opt => {
          opt.style.display = '';
        });
      }
    } else {
      // Hide rules section for Rule 30 modes
      if (rulesSection) rulesSection.style.display = 'none';
      // Hide seed section for Rule 30 modes
      if (seedSection) seedSection.style.display = 'none';
      // Hide size and grid wrapping controls for Rule 30 modes
      if (simSizeLabel) simSizeLabel.style.display = 'none';
      if (simSizeInput) simSizeInput.style.display = 'none';
      if (gridWrappingLabel) gridWrappingLabel.style.display = 'none';
      if (gridWrappingCheckbox) gridWrappingCheckbox.style.display = 'none';
      // Only show rule30 shape option (though seed section is hidden anyway)
      if (modalShapeSelect) {
        Array.from(modalShapeSelect.options).forEach(opt => {
          if (opt.value === 'rule30') {
            opt.style.display = '';
          } else {
            opt.style.display = 'none';
          }
        });
        // Force selection to rule30
        if (modalShapeSelect.value !== 'rule30') {
          modalShapeSelect.value = 'rule30';
          pendingShapeKey = 'rule30';
        }
      }
      
      // Auto-calculate and update size based on generations
      if (simGenerationsInput && simSizeInput) {
        const generations = Math.max(1, parseInt(simGenerationsInput.value) || state.sim_generations);
        const calculatedSize = calculateRule30Size(generations, mode);
        simSizeInput.value = calculatedSize;
      }
    }
  }
  
  // Listen for generations input changes when Rule 30 is selected
  if (simGenerationsInput) {
    const generationsChangeHandler = () => {
      const selectedMode = simulationModeSelect ? simulationModeSelect.value : 'gameOfLife';
      if (selectedMode === 'rule30' || selectedMode === 'rule30_2D') {
        const generations = Math.max(1, parseInt(simGenerationsInput.value) || state.sim_generations);
        const calculatedSize = calculateRule30Size(generations, selectedMode);
        if (simSizeInput) {
          simSizeInput.value = calculatedSize;
        }
      }
    };
    simGenerationsInput.addEventListener('input', generationsChangeHandler);
    simGenerationsInput.addEventListener('change', generationsChangeHandler);
  }

  // Set initial UI state
  let modeChangeHandler = null;
  if (simulationModeSelect) {
    updateModeUI(simulationModeSelect.value);
    
    // Listen for mode changes
    modeChangeHandler = (e) => {
      updateModeUI(e.target.value);
    };
    simulationModeSelect.addEventListener('change', modeChangeHandler);
  }
  
  // Function to update labels based on selected shape
  function updateShapeLabels(shapeKey) {
    const densityLabel = document.getElementById('shape-density-label');
    const densityLabelText = document.getElementById('shape-density-label-text');
    const sizeLabelText = document.getElementById('shape-size-label-text');
    const regionSizeLabelText = document.getElementById('shape-region-size-label-text');
    const sizeInfoIcon = sizeLabel?.querySelector('.info-icon');
    const densityInfoIcon = densityLabel?.querySelector('.info-icon');
    const regionSizeInfoIcon = regionSizeLabel?.querySelector('.info-icon');
    const maxSim = simSizeInput ? Math.max(1, parseInt(simSizeInput.value) || state.sim_size) : state.sim_size;
    
    if (shapeKey === 'perlin') {
      // Perlin noise labels
      if (sizeLabelText) {
        sizeLabelText.textContent = `Noise Detail (1 - 100)`;
      }
      if (sizeInfoIcon) {
        sizeInfoIcon.setAttribute('data-tooltip', 'Controls noise frequency detail. Lower values (1-10) create smoother, larger patterns. Medium values (10-30) create moderate detail. Higher values (30-100) create fine-grained, detailed patterns.');
      }
      if (densityLabelText) {
        densityLabelText.textContent = `Fill Amount (0 - 1)`;
      }
      if (densityInfoIcon) {
        densityInfoIcon.setAttribute('data-tooltip', 'Controls how many cells are alive. 0 = few cells, 1 = many cells. Higher values create denser patterns.');
      }
      // Show region size input for Perlin
      if (regionSizeLabel) {
        regionSizeLabel.classList.remove('hidden');
        if (regionSizeLabelText) {
          regionSizeLabelText.textContent = `Region Size (max ${maxSim})`;
        }
        if (regionSizeInfoIcon) {
          regionSizeInfoIcon.setAttribute('data-tooltip', 'Size of the centered region where noise is generated. Smaller values create patterns in the center only.');
        }
      }
      if (regionSizeInput) {
        regionSizeInput.classList.remove('hidden');
        regionSizeInput.max = `${maxSim}`;
      }
    } else if (shapeKey === 'worley') {
      // Worley noise labels
      if (sizeLabelText) {
        sizeLabelText.textContent = `Feature Points (1 - 50)`;
      }
      if (sizeInfoIcon) {
        sizeInfoIcon.setAttribute('data-tooltip', 'Approximate number of feature points (cell centers) that generate the pattern. Uses cube root, so values like 8 or 27 work best. More points create more complex cellular structures.');
      }
      if (densityLabelText) {
        densityLabelText.textContent = `Activation Distance (0 - 1)`;
      }
      if (densityInfoIcon) {
        densityInfoIcon.setAttribute('data-tooltip', 'How far from feature points cells become alive. Lower values = cells only near feature points. Higher values = cells fill more space.');
      }
      // Show region size input for Worley
      if (regionSizeLabel) {
        regionSizeLabel.classList.remove('hidden');
        if (regionSizeLabelText) {
          regionSizeLabelText.textContent = `Region Size (max ${maxSim})`;
        }
        if (regionSizeInfoIcon) {
          regionSizeInfoIcon.setAttribute('data-tooltip', 'Size of the centered region where noise is generated. Smaller values create patterns in the center only.');
        }
      }
      if (regionSizeInput) {
        regionSizeInput.classList.remove('hidden');
        regionSizeInput.max = `${maxSim}`;
      }
    } else {
      // Standard shape labels (cube, tetrahedron, octahedron)
      if (sizeLabelText) {
        sizeLabelText.textContent = `Size (max ${maxSim})`;
      }
      if (sizeInfoIcon) {
        sizeInfoIcon.setAttribute('data-tooltip', 'Size of the shape in grid cells.');
      }
      if (densityLabelText) {
        densityLabelText.textContent = 'Density (0 - 1)';
      }
      if (densityInfoIcon) {
        densityInfoIcon.setAttribute('data-tooltip', 'Probability that each cell in the shape is alive. 1 = all cells filled, 0 = no cells.');
      }
      // Hide region size input
      if (regionSizeLabel) regionSizeLabel.classList.add('hidden');
      if (regionSizeInput) regionSizeInput.classList.add('hidden');
    }
  }

  // Keep shape size max synced to modal Simulation Size
  function updateShapeSizeMax() {
    const maxSim = simSizeInput ? Math.max(1, parseInt(simSizeInput.value) || state.sim_size) : state.sim_size;
    const currKey = pendingShapeKey || state.shapeKey;
    
    // Perlin noise detail has a fixed max of 100 (maps to noiseScale 0.5)
    // Worley feature points has a fixed max of 50 (creates 3-4 cells per dimension)
    // Other shapes use maxSim
    if (currKey === 'perlin') {
      sizeInput.max = '100';
    } else if (currKey === 'worley') {
      sizeInput.max = '50';
    } else {
      sizeInput.max = `${maxSim}`;
    }
    
    if (regionSizeInput) {
      regionSizeInput.max = `${maxSim}`;
      const currRegionSize = Math.max(1, parseInt(regionSizeInput.value || '1'));
      if (currRegionSize > maxSim) regionSizeInput.value = `${maxSim}`;
    }
    
    // Update labels with current max
    updateShapeLabels(currKey);
    const curr = Math.max(1, parseInt(sizeInput.value || '1'));
    let maxVal;
    if (currKey === 'perlin') {
      maxVal = 100;
    } else if (currKey === 'worley') {
      maxVal = 50;
    } else {
      maxVal = maxSim;
    }
    if (curr > maxVal) sizeInput.value = `${maxVal}`;
  }
  updateShapeSizeMax();
  
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
  
  // For Perlin and Worley, ignore display density (always use 0.3 in modal)
  // For other shapes, use display density if available
  const params = state.shapeParams?.[key]
    || (
      (key !== 'perlin' && key !== 'worley') && Number.isFinite(displaySize) && Number.isFinite(displayDensity)
        ? { size: displaySize, density: displayDensity }
        : { size: Math.floor(state.sim_size / 2), density: 0.3 }
    );
  const initMaxSim = simSizeInput ? Math.max(1, parseInt(simSizeInput.value) || state.sim_size) : state.sim_size;
  // Perlin noise detail has a max of 100, Worley feature points has max of 50, other shapes use maxSim
  let maxForShape;
  if (key === 'perlin') {
    maxForShape = 100;
  } else if (key === 'worley') {
    maxForShape = 50;
  } else {
    maxForShape = initMaxSim;
  }
  const initSize = Math.min(maxForShape, Math.max(1, parseInt(params.size)));
  
  // Set density - use saved value if available, otherwise default to 0.3
  let initDensity;
  if (key === 'perlin' || key === 'worley') {
    // For Perlin and Worley, use saved value from state.shapeParams if it exists, otherwise default to 0.3
    if (params && params.density !== undefined && params.density !== null) {
      const parsedDensity = parseFloat(params.density);
      if (!isNaN(parsedDensity) && parsedDensity >= 0 && parsedDensity <= 1) {
        initDensity = parsedDensity;
      } else {
        initDensity = 0.3;
      }
    } else {
      initDensity = 0.3;
    }
  } else {
    // For other shapes, use saved value or default to 0.3
    initDensity = Math.min(1, Math.max(0, parseFloat(params.density || 0.3)));
  }
  
  sizeInput.value = `${initSize}`;
  densityInput.value = `${initDensity.toFixed(2)}`;
  
  // Update labels first to ensure inputs are visible
  if (modalShapeSelect) {
    modalShapeSelect.value = key;
    updateShapeLabels(key);
    modalShapeSelect.onchange = (e) => {
      pendingShapeKey = e.target.value;
      updateShapeLabels(e.target.value);
      // Update density when switching shapes - use saved value or default to 0.3
      if (densityInput) {
        const newKey = e.target.value;
        const newParams = state.shapeParams?.[newKey] || {};
        let newDensity;
        if (newKey === 'perlin' || newKey === 'worley') {
          // For Perlin and Worley, use saved value or default to 0.3
          if (newParams.density !== undefined && newParams.density !== null) {
            const parsedDensity = parseFloat(newParams.density);
            if (!isNaN(parsedDensity) && parsedDensity >= 0 && parsedDensity <= 1) {
              newDensity = parsedDensity;
            } else {
              newDensity = 0.3;
            }
          } else {
            newDensity = 0.3;
          }
        } else {
          // For other shapes, use saved value or default to 0.3
          newDensity = Math.min(1, Math.max(0, parseFloat(newParams.density || 0.3)));
        }
        densityInput.value = `${newDensity.toFixed(2)}`;
      }
      // Also update region size when switching shapes
      if ((e.target.value === 'perlin' || e.target.value === 'worley') && regionSizeInput) {
        const maxSim = simSizeInput ? Math.max(1, parseInt(simSizeInput.value) || state.sim_size) : state.sim_size;
        const newParams = state.shapeParams?.[e.target.value] || {};
        let initRegionSize = 25; // Default to 25
        if (newParams.regionSize !== undefined && newParams.regionSize !== null) {
          const parsedRegionSize = parseInt(newParams.regionSize);
          if (!isNaN(parsedRegionSize) && parsedRegionSize > 0) {
            initRegionSize = Math.min(maxSim, Math.max(1, parsedRegionSize));
          }
        }
        initRegionSize = Math.min(maxSim, Math.max(1, initRegionSize));
        regionSizeInput.value = `${initRegionSize}`;
      }
    };
  } else {
    updateShapeLabels(key);
  }
  
  // Initialize region size input for Perlin and Worley
  // This must happen after updateShapeLabels to ensure the input is visible
  if ((key === 'perlin' || key === 'worley') && regionSizeInput) {
    // Use params.regionSize if it exists and is valid, otherwise default to 25
    let initRegionSize = 25; // Default to 25
    if (params && params.regionSize !== undefined && params.regionSize !== null) {
      const parsedRegionSize = parseInt(params.regionSize);
      if (!isNaN(parsedRegionSize) && parsedRegionSize > 0) {
        initRegionSize = Math.min(initMaxSim, Math.max(1, parsedRegionSize));
      }
    }
    // Ensure it doesn't exceed max and is at least 1
    initRegionSize = Math.min(initMaxSim, Math.max(1, initRegionSize));
    // Set the value - this should work now that labels are updated and input is visible
    regionSizeInput.value = `${initRegionSize}`;
  }

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
    // Get selected simulation mode
    const selectedMode = simulationModeSelect ? simulationModeSelect.value : 'gameOfLife';
    state.simulationMode = selectedMode;

    // Set Rule 30 flags based on mode
    if (selectedMode === 'rule30') {
      state.useRule30 = true;
      state.useRule30_2D = false;
      state.shapeKey = 'rule30';
      // Auto-calculate size for Rule 30 based on generations
      const generations = simGenerationsInput ? Math.max(1, parseInt(simGenerationsInput.value)) : state.sim_generations;
      const calculatedSize = calculateRule30Size(generations, 'rule30');
      if (simSizeInput) {
        simSizeInput.value = calculatedSize;
      }
    } else if (selectedMode === 'rule30_2D') {
      state.useRule30 = false;
      state.useRule30_2D = true;
      state.shapeKey = 'rule30';
      // Auto-calculate size for Rule 30 (3D) based on generations
      const generations = simGenerationsInput ? Math.max(1, parseInt(simGenerationsInput.value)) : state.sim_generations;
      const calculatedSize = calculateRule30Size(generations, 'rule30_2D');
      if (simSizeInput) {
        simSizeInput.value = calculatedSize;
      }
    } else {
      state.useRule30 = false;
      state.useRule30_2D = false;
    }
    
    // Compute proposed sim size/gens first so clamping uses new size
    const newSimSize = simSizeInput ? Math.max(1, parseInt(simSizeInput.value)) : state.sim_size;
    const newSimGenerations = simGenerationsInput ? Math.max(1, parseInt(simGenerationsInput.value)) : state.sim_generations;
    const newGridWrapping = gridWrappingCheckbox ? gridWrappingCheckbox.checked : state.gridWrapping ?? true;
    const size = Math.min(newSimSize, Math.max(1, parseInt(sizeInput.value)));
    const density = Math.min(1, Math.max(0, parseFloat(densityInput.value)));
    if (newSimSize !== state.sim_size) {
      state.sim_size = newSimSize;
    }
    if (newSimGenerations !== state.sim_generations) {
      state.sim_generations = newSimGenerations;
    }
    if (newGridWrapping !== state.gridWrapping) {
      state.gridWrapping = newGridWrapping;
    }

    // Update shape functions with chosen params (only for Game of Life mode)
    if (selectedMode === 'gameOfLife') {
      if (pendingShapeKey === 'perlin') {
        const regionSize = regionSizeInput ? Math.min(newSimSize, Math.max(1, parseInt(regionSizeInput.value))) : null;
        state.shapes.perlin = (await import('./shapeGenerators.js')).perlinShape(size, density, regionSize);
      } else if (pendingShapeKey === 'worley') {
        const regionSize = regionSizeInput ? Math.min(newSimSize, Math.max(1, parseInt(regionSizeInput.value))) : null;
        state.shapes.worley = (await import('./shapeGenerators.js')).worleyShape(size, density, regionSize);
      } else if (pendingShapeKey === 'cube') {
        const half = Math.max(1, Math.floor(size / 2));
        state.shapes.cube = (await import('./shapeGenerators.js')).cubeShape(half, density);
      } else if (pendingShapeKey === 'tetrahedron') {
        state.shapes.tetrahedron = (await import('./shapeGenerators.js')).tetrahedronShape(size, density);
      } else if (pendingShapeKey === 'octahedron') {
        state.shapes.octahedron = (await import('./shapeGenerators.js')).octahedronShape(size, density);
      }
      state.shapeKey = pendingShapeKey || state.shapeKey;
    }

    state.reset();
    
    // Persist chosen params (only for Game of Life)
    if (selectedMode === 'gameOfLife') {
      if (!state.shapeParams) state.shapeParams = {};
      if ((pendingShapeKey === 'perlin' || pendingShapeKey === 'worley') && regionSizeInput) {
        const regionSize = Math.min(newSimSize, Math.max(1, parseInt(regionSizeInput.value)));
        state.shapeParams[state.shapeKey] = { size, density, regionSize };
      } else {
        state.shapeParams[state.shapeKey] = { size, density };
      }
    }
    
    // Parse and persist rules (only for Game of Life mode)
    if (selectedMode === 'gameOfLife') {
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
    }
    
    resetControlsUI();

    modal.classList.add('hidden');
    cleanup();
    pendingShapeKey = null;
    await initSimulation();

    // Update displays
    const sizeOut = document.getElementById('shape-size-value');
    const densityOut = document.getElementById('shape-density-value');
    const shapeOut = document.getElementById('shape-name-value');
    if (sizeOut && selectedMode === 'gameOfLife') sizeOut.textContent = `${size}`;
    if (densityOut && selectedMode === 'gameOfLife') densityOut.textContent = `${density.toFixed(2)}`;
    if (shapeOut) {
      if (selectedMode === 'rule30') {
        shapeOut.textContent = 'rule30';
      } else if (selectedMode === 'rule30_2D') {
        shapeOut.textContent = 'rule30 (2D)';
      } else {
        shapeOut.textContent = state.shapeKey;
      }
    }
    // Update simulation display
    const simSizeOut = document.getElementById('sim-size-value');
    const simGensOut = document.getElementById('sim-generations-value');
    if (simSizeOut) simSizeOut.textContent = `${state.sim_size}`;
    if (simGensOut) simGensOut.textContent = `${state.sim_generations}`;
    // Update rules display (only for Game of Life)
    if (selectedMode === 'gameOfLife') {
      const rb = document.getElementById('rules-birth');
      const rs = document.getElementById('rules-survival');
      const ri = document.getElementById('rules-isolation');
      const ro = document.getElementById('rules-overcrowd');
      if (rb) rb.textContent = stringifyRule(state.rules.birth);
      if (rs) rs.textContent = stringifyRule(state.rules.survival);
      if (ri) ri.textContent = stringifyRule(state.rules.isolation);
      if (ro) ro.textContent = stringifyRule(state.rules.overcrowding);
    }
  };

  function cleanup() {
    confirmBtn.removeEventListener('click', onConfirm);
    cancelBtn.removeEventListener('click', onCancel);
    if (simulationModeSelect && modeChangeHandler) {
      simulationModeSelect.removeEventListener('change', modeChangeHandler);
    }
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