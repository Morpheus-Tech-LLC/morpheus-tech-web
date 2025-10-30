import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { state } from "./state.js";

export function initSpace() {

    const simSize = state.sim_size;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141414);

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 0.7);
    light.position.set(1, 1, 2);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    state.scene = scene;

    // setScene(scene);

    // Rendering
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    state.renderer = renderer;

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(simSize * 1.2, simSize * 1.2, simSize * 1.2);

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Camera Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    
    state.camera = camera;
}