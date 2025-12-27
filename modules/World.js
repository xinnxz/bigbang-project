import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

// --- SHADERS (Embedded for single-file portability if needed, but module structure is cleaner) ---
const VERTEX_SHADER = `
    uniform float uTime;
    uniform float uSize;
    uniform float uAudioHigh; // High freq impact
    uniform float uAudioLow;  // Low freq impact
    
    attribute float aScale;
    attribute vec3 aRandomness;
    attribute float aSpeed;
    
    varying vec3 vColor;
    varying float vDist;

    void main() {
        vec3 pos = position;
        
        // Audio reactive displacement (Warp effect)
        float warp = sin(pos.x * 0.1 + uTime) * cos(pos.z * 0.1 + uTime) * uAudioLow * 2.0;
        pos.y += warp;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // Size attenuation
        vDist = -mvPosition.z;
        float sizeAudio = uSize * (1.0 + uAudioHigh * 3.0 * aScale); 
        gl_PointSize = sizeAudio * (300.0 / -mvPosition.z);
        
        // Pass color logic to fragment
        // Base color mixes based on distance from center
        float distFromCenter = length(pos);
        vec3 colorCore = vec3(1.0, 0.9, 0.5); // Warm white
        vec3 colorEdge = vec3(0.0, 0.5, 1.0); // Cyan Blue
        
        vColor = mix(colorCore, colorEdge, smoothstep(0.0, 50.0, distFromCenter));
    }
`;

const FRAGMENT_SHADER = `
    uniform vec3 uColor;
    varying vec3 vColor;
    varying float vDist;

    void main() {
        // Soft circular particle
        vec2 coord = gl_PointCoord - vec2(0.5);
        float r = length(coord);
        if (r > 0.5) discard;
        
        // Soft glow falloff
        float glow = 1.0 - (r * 2.0);
        glow = pow(glow, 1.5);
        
        // Distance fog logic
        float fog = smoothstep(150.0, 50.0, vDist);
        
        gl_FragColor = vec4(vColor * uColor, glow * fog);
    }
`;

export class World {
  constructor(container) {
    this.container = container;
    this.particleCount = 50000; // Increased count
    this.mouse = new THREE.Vector2();
    this.targetRotation = new THREE.Vector2();

    this.initScene();
    this.initPostProcessing();
    this.initParticles();
    this.handleResize();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050505, 0.002);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 100);

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
  }

  initPostProcessing() {
    this.renderScene = new RenderPass(this.scene, this.camera);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    this.bloomPass.threshold = 0.2;
    this.bloomPass.strength = 1.2;
    this.bloomPass.radius = 0.5;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderScene);
    this.composer.addPass(this.bloomPass);
  }

  initParticles() {
    this.geometry = new THREE.BufferGeometry();

    const pos = new Float32Array(this.particleCount * 3);
    const scales = new Float32Array(this.particleCount);
    const randomness = new Float32Array(this.particleCount * 3);
    const speeds = new Float32Array(this.particleCount);

    // --- GALAXY GENERATION ALGORITHM ---
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      // Generate Spiral Galaxy Shape
      const radius = Math.random() * 50 + 5;
      const spinAngle = radius * 0.5;
      const branchAngle = (i % 3) * ((Math.PI * 2) / 3); // 3 Arms

      const randomOffset = Math.random() ** 2 * 10; // Spread

      pos[i3] =
        Math.cos(spinAngle + branchAngle) * radius +
        (Math.random() - 0.5) * randomOffset;
      pos[i3 + 1] = (Math.random() - 0.5) * (10 - radius * 0.1); // Height decreases with radius
      pos[i3 + 2] =
        Math.sin(spinAngle + branchAngle) * radius +
        (Math.random() - 0.5) * randomOffset;

      scales[i] = Math.random();
      speeds[i] = Math.random() * 0.5 + 0.5;

      randomness[i3] = Math.random();
      randomness[i3 + 1] = Math.random();
      randomness[i3 + 2] = Math.random();
    }

    this.geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    this.geometry.setAttribute(
      "aRandomness",
      new THREE.BufferAttribute(randomness, 3)
    );
    this.geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 8.0 },
        uColor: { value: new THREE.Color(1, 1, 1) },
        uAudioHigh: { value: 0 },
        uAudioLow: { value: 0 },
      },
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);
  }

  updateMouse(normalizedPos) {
    // normalizedPos is -1 to 1
    this.targetRotation.x = normalizedPos.y * 0.5; // Look Up/Down
    this.targetRotation.y = normalizedPos.x * 0.5; // Look Left/Right
  }

  triggerExplosion() {
    // Simple logic to set a flag or modify uniforms for an explosion effect
    this.bloomPass.strength = 5.0; // Flash effect
    setTimeout(() => {
      this.bloomPass.strength = 1.2;
    }, 300);
  }

  initBigBang() {
    // Reset particles to center for a second, then explode
    // This would require complex attribute animation, for now we simulate via camera zoom
    this.camera.position.z = 5;
    this.bloomPass.strength = 10.0;
  }

  update(dt, time, audioData, avgVolume) {
    // 1. Audio Analysis Separation
    // Split audio data (0-255) into Lows (Bass) and Highs (Treble)
    const lowerHalf = audioData.slice(0, audioData.length / 2);
    const upperHalf = audioData.slice(audioData.length / 2, audioData.length);

    const lowAvg = lowerHalf.reduce((a, b) => a + b, 0) / lowerHalf.length;
    const highAvg = upperHalf.reduce((a, b) => a + b, 0) / upperHalf.length;

    const lowNorm = lowAvg / 255;
    const highNorm = highAvg / 255;

    // 2. Update Uniforms
    this.material.uniforms.uTime.value = time * 0.001;
    this.material.uniforms.uAudioLow.value = THREE.MathUtils.lerp(
      this.material.uniforms.uAudioLow.value,
      lowNorm,
      0.1
    );
    this.material.uniforms.uAudioHigh.value = THREE.MathUtils.lerp(
      this.material.uniforms.uAudioHigh.value,
      highNorm,
      0.1
    );

    // 3. Audio Reactive Camera Shake
    if (lowNorm > 0.6) {
      // On heavy bass
      this.camera.position.x += (Math.random() - 0.5) * 0.5;
      this.camera.position.y += (Math.random() - 0.5) * 0.5;
    }

    // 4. Smooth Camera Rotation (Mouse Follow)
    // Interpolate current rotation towards target
    const currentRotX = this.particles.rotation.x;
    const currentRotY = this.particles.rotation.y;

    this.particles.rotation.x +=
      (this.targetRotation.x - currentRotX) * dt * 2.0;
    this.particles.rotation.y +=
      (this.targetRotation.y - currentRotY) * dt * 2.0;

    // 5. Automatic Rotation (The Galaxy Spin)
    this.particles.rotation.z += 0.05 * dt + lowNorm * 0.1; // Spin faster on bass

    // 6. Camera Zoom Logic (Big Bang Recovery)
    if (this.camera.position.z < 100) {
      this.camera.position.z += (100 - this.camera.position.z) * 0.02;
      // Decay bloom
      this.bloomPass.strength = THREE.MathUtils.lerp(
        this.bloomPass.strength,
        1.2 + lowNorm * 2.0,
        0.05
      );
    } else {
      // Beat pulse bloom
      this.bloomPass.strength = THREE.MathUtils.lerp(
        this.bloomPass.strength,
        1.2 + lowNorm,
        0.1
      );
    }

    this.composer.render();
  }

  handleResize() {
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
    });
  }
}
