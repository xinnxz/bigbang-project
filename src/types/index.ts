// ==================================================================================
// TYPE DEFINITIONS FOR GENESIS ENGINE
// ==================================================================================

import * as THREE from 'three';

// Engine States
export enum EngineState {
    VOID = 0,
    SINGULARITY = 1,
    IGNITION = 2,
    GALAXY = 3
}

// Theme Configuration
export interface ThemeConfig {
    name: string;
    coreColor: THREE.Color;
    edgeColor: THREE.Color;
    bloomStrength: number;
    fogDensity: number;
    particleHue: [number, number];
}

export interface EngineConfig {
    particles: {
        count: number;
        baseSize: number;
        galaxyRadius: number;
        galaxyArms: number;
        galaxySpin: number;
        ignitionForce: number;
        dragCoefficient: number;
        gravityStrength: number;
    };
    postfx: {
        bloom: { threshold: number; strength: number; radius: number };
        chromaticAmount: number;
        filmIntensity: number;
        vignetteDarkness: number;
        vignetteOffset: number;
    };
    theme: ThemeConfig;
}
