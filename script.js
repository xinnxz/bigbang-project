import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

// --- Configuration ---
const PARTICLE_COUNT = 25000; // High count for dense galaxy
const PARTICLE_SIZE = 0.35;
const GALAXY_RADIUS = 35;
const TRANSITION_SPEED = 0.03; // Lower = heavier, more epic feel

// Assets URLs (Using public CDNs for convenience)
const ASTRONAUT_URL =
  "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r147/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf";
// Note: Using DamagedHelmet as a placeholder high-quality sci-fi object because reliable public astronaut URLs are scarce.
// If you have a local astronaut.glb, replace this URL.
const STAR_TEXTURE_URL = "https://i.imgur.com/kx8O9cZ.png"; // A simple soft particle texture

// --- Global Variables ---
let scene, camera, renderer, composer;
let particleSystem, astronautModel;
let geometry, positions, colors, sizes;
const mouse = new THREE.Vector2();
const targetRotation = new THREE.Vector2();
let isMouseDown = false;

// The two states of the universe
const states = {
  singularity: [], // Compressed Big Bang start
  galaxy: [], // Spiral shape
};

init();
animate();

function init() {
  const container = document.getElementById("canvas-container");

  // 1. Scene & Camera
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 15); // Look slightly down

  // 2. Renderer & Post-Processing (The Genius Touch)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.toneMapping = THREE.ReinhardToneMapping; // Cinematic lighting
  renderer.toneMappingExposure = 1.5;
  container.appendChild(renderer.domElement);

  // Bloom adds the "expensive" looking glow
  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = 0.3; // Only bright things glow
  bloomPass.strength = 2.5; // Intense glow intensity
  bloomPass.radius = 0.8; // Spread of the glow

  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  // 3. Lighting (Dramatic Sci-Fi)
  const ambientLight = new THREE.AmbientLight(0x333333); // dim base
  scene.add(ambientLight);

  // Key light for the astronaut/center
  const pointLight = new THREE.PointLight(0x4da6ff, 5, 50);
  pointLight.position.set(2, 5, 5);
  scene.add(pointLight);

  // Rim light for dramatic edges
  const rimLight = new THREE.PointLight(0xffaa00, 3, 50);
  rimLight.position.set(-5, -2, -5);
  scene.add(rimLight);

  // 4. Load Assets
  loadAstronaut();
  loadParticles();

  // 5. Events
  window.addEventListener("resize", onWindowResize);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mousedown", () => {
    isMouseDown = true;
    document.getElementById("instruction-text").innerText =
      "RELEASE TO INITIATE COSMIC INFLATION";
    document.getElementById("instruction-text").style.color = "#ff3300";
  });
  document.addEventListener("mouseup", () => {
    isMouseDown = false;
    document.getElementById("instruction-text").innerText =
      "HOLD LEFT MOUSE BUTTON TO INITIATE BIG BANG SEQUENCE";
    document.getElementById("instruction-text").style.color = "#ffcc00";
  });
}

function loadAstronaut() {
  const loader = new GLTFLoader();
  loader.load(
    ASTRONAUT_URL,
    (gltf) => {
      astronautModel = gltf.scene;
      // Adjustments for the chosen model
      astronautModel.scale.set(3, 3, 3);
      astronautModel.position.set(0, -1, 0);
      astronautModel.rotation.set(0.3, -0.5, 0);

      // Add a subtle hover animation later
      scene.add(astronautModel);
    },
    undefined,
    (error) => {
      console.error("An error happened loading the model:", error);
    }
  );
}

function loadParticles() {
  const textureLoader = new THREE.TextureLoader();
  const particleTexture = textureLoader.load(STAR_TEXTURE_URL);

  geometry = new THREE.BufferGeometry();
  positions = new Float32Array(PARTICLE_COUNT * 3);
  colors = new Float32Array(PARTICLE_COUNT * 3);
  sizes = new Float32Array(PARTICLE_COUNT);

  const colorObj = new THREE.Color();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    // Initialize positions far away so they swoop in
    positions[i3] = (Math.random() - 0.5) * 100;
    positions[i3 + 1] = (Math.random() - 0.5) * 100;
    positions[i3 + 2] = (Math.random() - 0.5) * 100;

    // Random sizes for depth perception
    sizes[i] = Math.random() * PARTICLE_SIZE + 0.05;
  }

  // --- Generate Target States ---

  // State 1: Singularity (Dense, super bright ball at center)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    // Very tight radius, high energy density
    const r = Math.random() * 1.5 + Math.random();
    states.singularity.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }

  // State 2: Spiral Galaxy
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Parametric spiral equations
    const radius = Math.random() * Math.random() * GALAXY_RADIUS; // Concentrate more near center
    const spinAngle = radius * 0.8; // Tighter spin closer to center
    const branchAngle = (i % 3) * ((Math.PI * 2) / 3); // 3 arms

    const x = Math.cos(spinAngle + branchAngle) * radius;
    const z = Math.sin(spinAngle + branchAngle) * radius;
    // Flattened disk with some vertical spread based on radius distance
    const y =
      (Math.random() - 0.5) * (Math.pow(GALAXY_RADIUS - radius, 2) * 0.015);

    states.galaxy.push(x, y, z);
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  // Custom Shader Material to handle per-particle sizing and additive texture blending
  const material = new THREE.PointsMaterial({
    size: PARTICLE_SIZE,
    map: particleTexture,
    vertexColors: true,
    blending: THREE.AdditiveBlending, // Crucial for glowing overlapping stars
    depthWrite: false, // Prevents weird occlusion artifacts
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
  });

  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  const time = Date.now() * 0.0005;

  // Smooth Mouse Camera Drift
  targetRotation.x += (mouse.x * 0.5 - targetRotation.x) * 0.05;
  targetRotation.y += (mouse.y * 0.2 - targetRotation.y) * 0.05;

  // Rotate the whole scene container slightly based on mouse
  scene.rotation.y = targetRotation.x;
  scene.rotation.x = targetRotation.y;

  // Subtle astronaut float animation
  if (astronautModel) {
    astronautModel.position.y = -1 + Math.sin(time * 2) * 0.2;
    astronautModel.rotation.y += 0.001; // Slow spin
  }

  if (particleSystem && states.galaxy.length > 0) {
    const posArr = geometry.attributes.position.array;
    const colorArr = geometry.attributes.color.array;

    // Determine target state based on mouse hold
    // Mouse Down = Singularity (Compression), Mouse Up = Galaxy (Expansion)
    const targetState = isMouseDown ? states.singularity : states.galaxy;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Lerp position towards target state
      posArr[i3] += (targetState[i3] - posArr[i3]) * TRANSITION_SPEED;
      posArr[i3 + 1] +=
        (targetState[i3 + 1] - posArr[i3 + 1]) * TRANSITION_SPEED;
      posArr[i3 + 2] +=
        (targetState[i3 + 2] - posArr[i3 + 2]) * TRANSITION_SPEED;

      // --- Dynamic Coloring ---
      const distanceFromCenter = Math.sqrt(
        posArr[i3] * posArr[i3] + posArr[i3 + 2] * posArr[i3 + 2]
      );
      let r, g, b;

      if (isMouseDown) {
        // Singularity Mode: Super bright, white/blue hot center
        const heat = 1 - Math.min(distanceFromCenter / 5, 1);
        r = 0.5 + heat * 0.5;
        g = 0.3 + heat * 0.7;
        b = 1.0; // Always blueish
      } else {
        // Galaxy Mode: Colorful spiral arms based on distance
        const normalizedDist = distanceFromCenter / GALAXY_RADIUS;
        r = Math.sin(normalizedDist * Math.PI * 1.5) * 0.5 + 0.5; // Reddish center/mid
        g = Math.sin(normalizedDist * Math.PI * 2.5 + 1) * 0.3 + 0.2; // Less green
        b = Math.cos(normalizedDist * Math.PI + 2) * 0.5 + 0.5; // Blueish outer rims
      }

      colorArr[i3] = r;
      colorArr[i3 + 1] = g;
      colorArr[i3 + 2] = b;
    }

    // Slow rotation of the entire particle system for dynamism
    particleSystem.rotation.y -= 0.0005;

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  }

  // Use composer instead of renderer for Post-Processing
  composer.render();
}
