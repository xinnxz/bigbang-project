// ==================================================================================
// HUD - Heads Up Display for Stats
// ==================================================================================

const STATE_NAMES = ['VOID', 'SINGULARITY', 'IGNITION', 'GALAXY'] as const;

export class HUD {
    private hud: HTMLElement | null;
    private fpsEl: HTMLElement | null;
    private stateEl: HTMLElement | null;
    private stateDot: HTMLElement | null;
    private intensityFill: HTMLElement | null;

    private lastTime = performance.now();
    private frameCount = 0;
    private fps = 60;

    constructor() {
        this.hud = document.getElementById('hud');
        this.fpsEl = document.getElementById('hud-fps');
        this.stateEl = document.getElementById('hud-state');
        this.stateDot = document.getElementById('state-dot');
        this.intensityFill = document.getElementById('intensity-fill');
    }

    public activate(): void {
        if (this.hud) this.hud.classList.add('active');
    }

    public updateFPS(): void {
        this.frameCount++;
        const now = performance.now();
        const delta = now - this.lastTime;

        if (delta >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            this.frameCount = 0;
            this.lastTime = now;

            if (this.fpsEl) {
                this.fpsEl.textContent = this.fps.toString();
                this.fpsEl.className = 'hud-value';

                if (this.fps < 30) {
                    this.fpsEl.classList.add('critical');
                } else if (this.fps < 50) {
                    this.fpsEl.classList.add('warning');
                }
            }
        }
    }

    public updateState(state: number): void {
        const stateName = STATE_NAMES[state] || 'VOID';

        if (this.stateEl) {
            this.stateEl.textContent = stateName;
        }

        if (this.stateDot) {
            this.stateDot.className = `state-dot ${stateName.toLowerCase()}`;
        }
    }

    public updateIntensity(value: number): void {
        if (!this.intensityFill) return;

        const percent = Math.min(value * 100, 100);
        this.intensityFill.style.width = `${percent}%`;

        this.intensityFill.className = 'intensity-fill';
        if (value > 0.8) {
            this.intensityFill.classList.add('critical');
        } else if (value > 0.5) {
            this.intensityFill.classList.add('high');
        }
    }
}
