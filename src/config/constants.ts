// ==================================================================================
// CONFIGURATION CONSTANTS
// ==================================================================================

import * as THREE from 'three';
import type { ThemeConfig } from '../types';

export const PARTICLE_CONFIG = {
    count: 50000,
    baseSize: 0.6,
    galaxyRadius: 60,
    galaxyArms: 5,
    galaxySpin: 3.5,
    ignitionForce: 150.0,
    dragCoefficient: 0.965,
    gravityStrength: 0.04
} as const;

export const POSTFX_CONFIG = {
    bloom: {
        threshold: 0.1,
        strength: 2.5,
        radius: 0.55
    },
    chromaticAmount: 0.002,
    filmIntensity: 0.25,
    vignetteDarkness: 0.5,
    vignetteOffset: 0.95
} as const;

// Theme Presets
export const THEMES: Record<string, ThemeConfig> = {
    cosmic: {
        name: 'Cosmic',
        coreColor: new THREE.Color(1, 0.9, 0.5),
        edgeColor: new THREE.Color(0, 0.5, 1),
        bloomStrength: 2.5,
        fogDensity: 0.005,
        particleHue: [0.6, 0.8]
    },
    inferno: {
        name: 'Inferno',
        coreColor: new THREE.Color(1, 1, 0.5),
        edgeColor: new THREE.Color(1, 0.2, 0),
        bloomStrength: 3.0,
        fogDensity: 0.006,
        particleHue: [0.0, 0.15]
    },
    aurora: {
        name: 'Aurora',
        coreColor: new THREE.Color(0.5, 1, 0.8),
        edgeColor: new THREE.Color(0.5, 0, 1),
        bloomStrength: 2.0,
        fogDensity: 0.004,
        particleHue: [0.3, 0.8]
    }
};
