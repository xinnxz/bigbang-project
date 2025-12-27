// ==================================================================================
// LOADING SCREEN UI
// ==================================================================================

export class LoadingScreen {
    private loader: HTMLElement | null;
    private bar: HTMLElement | null;
    private status: HTMLElement | null;
    private particles: HTMLElement | null;
    private onComplete?: () => void;

    constructor(onComplete?: () => void) {
        this.loader = document.getElementById('loader');
        this.bar = document.getElementById('loader-bar');
        this.status = document.getElementById('loader-status');
        this.particles = document.getElementById('loader-particles');
        this.onComplete = onComplete;
    }

    public init(): void {
        this.createParticles(30);
        this.simulateProgress();
    }

    private createParticles(count: number): void {
        if (!this.particles) return;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'loader-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 3}s`;
            particle.style.animationDuration = `${2 + Math.random() * 2}s`;
            this.particles.appendChild(particle);
        }
    }

    private updateProgress(value: number, statusText: string): void {
        if (this.bar) this.bar.style.width = `${value}%`;
        if (this.status) this.status.textContent = statusText;
    }

    private simulateProgress(): void {
        const stages = [
            { progress: 20, text: 'LOADING PARTICLE SYSTEM...' },
            { progress: 40, text: 'INITIALIZING SHADERS...' },
            { progress: 60, text: 'PREPARING AUDIO ENGINE...' },
            { progress: 80, text: 'CONFIGURING POST-PROCESSING...' },
            { progress: 100, text: 'LAUNCHING...' }
        ];

        stages.forEach((stage, i) => {
            setTimeout(() => {
                this.updateProgress(stage.progress, stage.text);

                if (stage.progress === 100) {
                    setTimeout(() => this.complete(), 500);
                }
            }, (i + 1) * 400);
        });
    }

    private complete(): void {
        this.hide();
        if (this.onComplete) this.onComplete();
    }

    public hide(): void {
        if (this.loader) {
            this.loader.classList.add('hidden');
        }
    }
}
