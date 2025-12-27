// ==================================================================================
// MAIN ENGINE - Entry Point & Orchestrator
// ==================================================================================

import { Renderer } from './core/Renderer';
import { PostProcessor } from './core/PostProcessor';
import { ParticleSystem } from './systems/ParticleSystem';
import { AudioEngine } from './systems/AudioEngine';
import { StateMachine } from './systems/StateMachine';
import { LoadingScreen } from './ui/LoadingScreen';
import { HUD } from './ui/HUD';
import { AudioVisualizer } from './ui/AudioVisualizer';
import { CustomCursor } from './ui/CustomCursor';
import { EngineState } from './types';
import { THEMES } from './config/constants';
import './styles/main.css';

class GenesisEngine {
    private renderer!: Renderer;
    private postProcessor!: PostProcessor;
    private particles!: ParticleSystem;
    private audio!: AudioEngine;
    private stateMachine!: StateMachine;
    private hud!: HUD;
    private visualizer!: AudioVisualizer;
    private cursor!: CustomCursor;

    private mouse = { x: 0, y: 0 };
    private shaderIntensity = 0;
    private isInitialized = false;

    constructor() {
        // Initialize loading screen
        const loadingScreen = new LoadingScreen(() => this.start());
        loadingScreen.init();

        // Initialize cursor
        this.cursor = new CustomCursor();
        this.cursor.init();
    }

    private start(): void {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // Core systems
        this.renderer = new Renderer('canvas-container');
        this.audio = new AudioEngine();
        this.audio.init();

        // Particle system with theme
        this.particles = new ParticleSystem(this.renderer.scene, THEMES.cosmic);

        // Post processing
        this.postProcessor = new PostProcessor(
            this.renderer.renderer,
            this.renderer.scene,
            this.renderer.camera
        );

        // State machine
        this.stateMachine = new StateMachine();
        this.setupStateListeners();

        // UI components
        this.hud = new HUD();
        this.hud.activate();

        this.visualizer = new AudioVisualizer();
        this.visualizer.activate();

        // Show UI overlay
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) uiOverlay.style.display = 'flex';

        // Input handlers
        this.setupInputHandlers();

        // Start animation loop
        this.animate();
    }

    private setupStateListeners(): void {
        this.stateMachine.onStateChange((newState) => {
            if (newState === EngineState.SINGULARITY) {
                this.audio.startRiser();
                this.postProcessor.setBloomIntensity(4.0, 1.0);
            } else if (newState === EngineState.IGNITION) {
                this.audio.triggerExplosion();
                this.postProcessor.setBloomIntensity(8.0, 1.5);
                this.particles.explode();

                setTimeout(() => {
                    if (this.stateMachine.isState(EngineState.IGNITION)) {
                        this.stateMachine.setState(EngineState.GALAXY);
                    }
                }, 4000);
            } else if (newState === EngineState.GALAXY) {
                this.audio.playGalaxyAmbient();
                this.postProcessor.setBloomIntensity(2.0, 0.6);
            }

            this.updateStatusMessage(newState);
        });
    }

    private updateStatusMessage(state: EngineState): void {
        const statusMsg = document.getElementById('status-message');
        if (!statusMsg) return;

        statusMsg.className = '';
        switch (state) {
            case EngineState.SINGULARITY:
                statusMsg.innerText = 'CRITICAL: COMPRESSING...';
                statusMsg.classList.add('state-singularity');
                break;
            case EngineState.IGNITION:
                statusMsg.innerText = 'EXPANSION DETECTED';
                statusMsg.classList.add('state-ignition');
                break;
            case EngineState.GALAXY:
                statusMsg.innerText = 'GALAXY STABLE';
                statusMsg.classList.add('state-galaxy');
                break;
            default:
                statusMsg.innerText = 'SYSTEM IDLE. CLICK & HOLD TO COMPRESS.';
                statusMsg.classList.add('state-void');
        }
    }

    private setupInputHandlers(): void {
        document.addEventListener('pointermove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        document.addEventListener('mousedown', () => {
            if (this.stateMachine.state === EngineState.VOID) {
                this.stateMachine.setState(EngineState.SINGULARITY);
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.stateMachine.state === EngineState.SINGULARITY) {
                this.stateMachine.setState(EngineState.IGNITION);
            }
        });
    }

    private animate = (): void => {
        requestAnimationFrame(this.animate);

        const time = Date.now() * 0.001;
        const state = this.stateMachine.state;

        // Update shader intensity
        let targetIntensity = 0;
        if (state === EngineState.SINGULARITY) targetIntensity = 1.0;
        else if (state === EngineState.IGNITION) targetIntensity = 1.5;
        else if (state === EngineState.GALAXY) targetIntensity = 0.3;

        this.shaderIntensity += (targetIntensity - this.shaderIntensity) * 0.05;
        this.particles.setIntensity(this.shaderIntensity);
        this.particles.update(0.016, time);

        // State-specific updates
        if (state === EngineState.SINGULARITY) {
            this.particles.compress();
            this.renderer.shakeCamera(0.2);
            this.audio.modulateRiser(this.shaderIntensity);
        } else if (state === EngineState.IGNITION || state === EngineState.GALAXY) {
            this.particles.updateExpansion();
            if (state === EngineState.GALAXY) {
                this.particles.updateGalaxy(time, this.mouse.x, this.mouse.y);
            }
        }

        // Update UI
        this.hud.updateFPS();
        this.hud.updateIntensity(this.shaderIntensity);
        this.hud.updateState(state);

        const audioData = this.visualizer.generatePseudoData(time, state);
        this.visualizer.draw(audioData, this.shaderIntensity);

        // Render
        this.postProcessor.render();
    };
}

// Initialize engine
document.addEventListener('DOMContentLoaded', () => {
    new GenesisEngine();
});
