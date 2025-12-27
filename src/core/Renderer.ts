// ==================================================================================
// RENDERER MODULE - Three.js Scene, Camera, Renderer Setup
// ==================================================================================

import * as THREE from 'three';

export class Renderer {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    private container: HTMLElement;

    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`Container #${containerId} not found`);
        this.container = container;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.005);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 20, 120);

        // WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            depth: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 2.0;

        this.container.appendChild(this.renderer.domElement);

        // Handle resize
        window.addEventListener('resize', this.onResize.bind(this));
    }

    private onResize(): void {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    public shakeCamera(intensity: number = 0.2): void {
        this.camera.position.x += (Math.random() - 0.5) * intensity;
        this.camera.position.y += (Math.random() - 0.5) * intensity;
    }

    public dispose(): void {
        window.removeEventListener('resize', this.onResize.bind(this));
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}
