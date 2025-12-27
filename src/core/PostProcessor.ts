// ==================================================================================
// POST PROCESSOR - Effect Composer with Bloom, Chromatic, Film, Vignette
// ==================================================================================

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { chromaticAberration, vignette } from '../shaders/postfx';
import { POSTFX_CONFIG } from '../config/constants';

export class PostProcessor {
    public composer: EffectComposer;
    public bloomPass: UnrealBloomPass;
    private chromaticPass: ShaderPass;
    private filmPass: FilmPass;
    private vignettePass: ShaderPass;

    constructor(
        renderer: THREE.WebGLRenderer,
        scene: THREE.Scene,
        camera: THREE.Camera
    ) {
        const size = new THREE.Vector2(window.innerWidth, window.innerHeight);

        // Effect Composer
        this.composer = new EffectComposer(renderer);

        // Render Pass
        const renderPass = new RenderPass(scene, camera);
        this.composer.addPass(renderPass);

        // Bloom Pass
        this.bloomPass = new UnrealBloomPass(
            size,
            POSTFX_CONFIG.bloom.strength,
            0.4,
            POSTFX_CONFIG.bloom.threshold
        );
        this.bloomPass.threshold = POSTFX_CONFIG.bloom.threshold;
        this.bloomPass.strength = POSTFX_CONFIG.bloom.strength;
        this.bloomPass.radius = POSTFX_CONFIG.bloom.radius;
        this.composer.addPass(this.bloomPass);

        // Chromatic Aberration Pass
        this.chromaticPass = new ShaderPass(chromaticAberration as any);
        this.chromaticPass.uniforms['amount'].value = POSTFX_CONFIG.chromaticAmount;
        this.composer.addPass(this.chromaticPass);

        // Film Pass
        this.filmPass = new FilmPass(POSTFX_CONFIG.filmIntensity, false);
        this.composer.addPass(this.filmPass);

        // Vignette Pass
        this.vignettePass = new ShaderPass(vignette as any);
        this.vignettePass.uniforms['darkness'].value = POSTFX_CONFIG.vignetteDarkness;
        this.vignettePass.uniforms['offset'].value = POSTFX_CONFIG.vignetteOffset;
        this.composer.addPass(this.vignettePass);

        // Handle resize
        window.addEventListener('resize', this.onResize.bind(this));
    }

    private onResize(): void {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.composer.setSize(width, height);
    }

    public setBloomIntensity(strength: number, radius?: number): void {
        this.bloomPass.strength = strength;
        if (radius !== undefined) {
            this.bloomPass.radius = radius;
        }
    }

    public render(): void {
        this.composer.render();
    }

    public dispose(): void {
        window.removeEventListener('resize', this.onResize.bind(this));
    }
}
