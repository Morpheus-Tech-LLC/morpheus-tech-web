import { state } from "./state.js";
// import { initSimulation } from "./simulationModel.js";
import { updatePoints } from "./simulationModel.js";

// controls.js
export function initControls() {

  // const shapeSelect = document.getElementById("shape-select");

  // shapeSelect.addEventListener("change", (e) => {
  //   // Update state
  //   state.reset();
  //   state.shapeKey = e.target.value;
  //   initSimulation();
  // });


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
    updateArrows();
    console.log("Reverse mode:", isReversing);
    // setPlaybackDirection(isReversing);
    state.isReversing = isReversing;
  });
  
  function updateArrows() {
    if (isReversing) {
      leftArrow.classList.add("active");
      rightArrow.classList.remove("active");
    } else {
      leftArrow.classList.remove("active");
      rightArrow.classList.add("active");
    }
  }

  // Buttons
  const playPauseButton = document.getElementById("playPauseButton");
  const playPauseIcon = document.getElementById("playPauseIcon");
  let isPlaying = false;
  playPauseButton.onclick = () => {
    isPlaying = !isPlaying;
    playPauseIcon.className = isPlaying ? "pause" : "play";
    console.log("Playback Direction:", isPlaying);
    state.isPlaying = isPlaying;
  }
}

function updateTriStateVisibility() {
  const activeSection = dualStateButton.querySelector('.state-section.active');
  const sliceSlider = document.getElementById('slider');
  const sliceViewer = document.getElementById('sliceViewer');
  if (activeSection && activeSection.dataset.value === 'slice') {
    triStateButton.style.display = 'block';
    sliceSlider.style.display = 'block';
    sliceViewer.style.display = 'block';
  } else {
    triStateButton.style.display = 'none';
    sliceSlider.style.display = 'none';
    sliceViewer.style.display = 'none';
  }
}