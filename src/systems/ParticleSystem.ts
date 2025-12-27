// ==================================================================================
// PARTICLE SYSTEM - Galaxy Particles with Nebula Shaders
// ==================================================================================

import * as THREE from 'three';
import nebulaVert from '../shaders/nebula.vert';
import nebulaFrag from '../shaders/nebula.frag';
import { PARTICLE_CONFIG, THEMES } from '../config/constants';
import type { ThemeConfig } from '../types';

export class ParticleSystem {
    public particles: THREE.Points;
    public geometry: THREE.BufferGeometry;
    public material: THREE.ShaderMaterial;
    public velocities: Float32Array;
    public galaxyTargets: Float32Array;

    private config = PARTICLE_CONFIG;

    constructor(scene: THREE.Scene, theme: ThemeConfig = THEMES.cosmic) {
        this.geometry = new THREE.BufferGeometry();
        this.velocities = new Float32Array(this.config.count * 3);
        this.galaxyTargets = new Float32Array(this.config.count * 3);

        // Initialize buffers
        const positions = new Float32Array(this.config.count * 3);
        const colors = new Float32Array(this.config.count * 3);
        const sizes = new Float32Array(this.config.count);
        const colorObj = new THREE.Color();

        for (let i = 0; i < this.config.count; i++) {
            const i3 = i * 3;

            // Random spherical distribution
            const r = Math.random() * 200 + 50;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);

            positions[i3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.1;
            positions[i3 + 2] = r * Math.cos(phi);

            // Initial velocities
            this.velocities[i3] = (Math.random() - 0.5) * 0.1;
            this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
            this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

            // Colors based on theme
            const [hueMin, hueMax] = theme.particleHue;
            colorObj.setHSL(
                hueMin + Math.random() * (hueMax - hueMin),
                0.5,
                0.3 + Math.random() * 0.4
            );
            colors[i3] = colorObj.r;
            colors[i3 + 1] = colorObj.g;
            colors[i3 + 2] = colorObj.b;

            sizes[i] = this.config.baseSize * (Math.random() * 0.8 + 0.2);
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Generate galaxy targets
        this.generateGalaxyTargets();

        // Shader material
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0xffffff) },
                uTime: { value: 0.0 },
                uIntensity: { value: 0.0 }
            },
            vertexShader: nebulaVert,
            fragmentShader: nebulaFrag,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            vertexColors: true
        });

        this.particles = new THREE.Points(this.geometry, this.material);
        scene.add(this.particles);
    }

    private generateGalaxyTargets(): void {
        for (let i = 0; i < this.config.count; i++) {
            const i3 = i * 3;
            const armIndex = i % this.config.galaxyArms;
            const radius = Math.pow(Math.random(), 1.5) * this.config.galaxyRadius;
            const spinOffset = radius * this.config.galaxySpin;
            const armAngleOffset = (armIndex / this.config.galaxyArms) * Math.PI * 2;
            const finalAngle = spinOffset + armAngleOffset;

            this.galaxyTargets[i3] = Math.cos(finalAngle) * radius + (Math.random() - 0.5) * 1.5;
            const heightThickness = 1.0 - radius / this.config.galaxyRadius;
            this.galaxyTargets[i3 + 1] = (Math.random() - 0.5) * heightThickness * 4;
            this.galaxyTargets[i3 + 2] = Math.sin(finalAngle) * radius + (Math.random() - 0.5) * 1.5;
        }
    }

    public update(_deltaTime: number, time: number): void {
        this.material.uniforms.uTime.value = time;
    }

    public setIntensity(intensity: number): void {
        this.material.uniforms.uIntensity.value = intensity;
    }

    public compress(): void {
        const positions = this.geometry.attributes.position.array as Float32Array;
        const colors = this.geometry.attributes.customColor.array as Float32Array;

        for (let i = 0; i < this.config.count * 3; i += 3) {
            positions[i] *= 0.85;
            positions[i + 1] *= 0.85;
            positions[i + 2] *= 0.85;

            colors[i] = Math.min(colors[i] + 0.05, 1.0);
            colors[i + 1] = Math.min(colors[i + 1] + 0.04, 0.9);
            colors[i + 2] = Math.min(colors[i + 2] + 0.02, 0.8);
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.customColor.needsUpdate = true;
    }

    public explode(): void {
        const positions = this.geometry.attributes.position.array as Float32Array;
        const colors = this.geometry.attributes.customColor.array as Float32Array;

        for (let i = 0; i < this.config.count; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 0.1;
            positions[i3 + 1] = (Math.random() - 0.5) * 0.1;
            positions[i3 + 2] = (Math.random() - 0.5) * 0.1;

            let vx = Math.random() - 0.5;
            let vy = (Math.random() - 0.5) * 0.3;
            let vz = Math.random() - 0.5;
            const len = Math.sqrt(vx * vx + vy * vy + vz * vz);
            const forceVariation = Math.random() * 0.8 + 0.2;

            this.velocities[i3] = (vx / len) * this.config.ignitionForce * forceVariation;
            this.velocities[i3 + 1] = (vy / len) * this.config.ignitionForce * forceVariation;
            this.velocities[i3 + 2] = (vz / len) * this.config.ignitionForce * forceVariation;

            colors[i3] = 1.0;
            colors[i3 + 1] = 1.0;
            colors[i3 + 2] = 1.0;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.customColor.needsUpdate = true;
    }

    public updateExpansion(): void {
        const positions = this.geometry.attributes.position.array as Float32Array;
        const colors = this.geometry.attributes.customColor.array as Float32Array;

        for (let i = 0; i < this.config.count; i++) {
            const i3 = i * 3;

            // Apply velocity
            positions[i3] += this.velocities[i3];
            positions[i3 + 1] += this.velocities[i3 + 1];
            positions[i3 + 2] += this.velocities[i3 + 2];

            // Drag
            this.velocities[i3] *= this.config.dragCoefficient;
            this.velocities[i3 + 1] *= this.config.dragCoefficient;
            this.velocities[i3 + 2] *= this.config.dragCoefficient;

            // Lerp to galaxy positions
            const lerpFactor = 0.005;
            positions[i3] += (this.galaxyTargets[i3] - positions[i3]) * lerpFactor;
            positions[i3 + 1] += (this.galaxyTargets[i3 + 1] - positions[i3 + 1]) * lerpFactor;
            positions[i3 + 2] += (this.galaxyTargets[i3 + 2] - positions[i3 + 2]) * lerpFactor;

            // Color transition
            colors[i3] = Math.max(colors[i3] - 0.01, 0.3);
            colors[i3 + 1] = Math.max(colors[i3 + 1] - 0.005, 0.5);
            colors[i3 + 2] = Math.min(colors[i3 + 2] + 0.01, 1.0);
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.customColor.needsUpdate = true;
    }

    public updateGalaxy(time: number, mouseX: number, mouseY: number): void {
        const positions = this.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < this.config.count; i++) {
            const i3 = i * 3;

            // Slow rotation
            const angle = time * 0.03;
            const cos = Math.cos(angle * 0.01);
            const sin = Math.sin(angle * 0.01);
            const x = positions[i3];
            const z = positions[i3 + 2];
            positions[i3] = x * cos - z * sin;
            positions[i3 + 2] = x * sin + z * cos;

            // Mouse influence
            positions[i3] += mouseX * 0.002 * (30 - Math.abs(positions[i3])) * 0.01;
            positions[i3 + 1] -= mouseY * 0.001 * (20 - Math.abs(positions[i3 + 1])) * 0.01;
        }

        this.geometry.attributes.position.needsUpdate = true;
    }

    public dispose(): void {
        this.geometry.dispose();
        this.material.dispose();
    }
}
