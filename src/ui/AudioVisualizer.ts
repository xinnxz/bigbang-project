// ==================================================================================
// AUDIO VISUALIZER - Frequency Bar Canvas Renderer
// ==================================================================================

export class AudioVisualizer {
    private canvas: HTMLCanvasElement | null;
    private ctx: CanvasRenderingContext2D | null = null;
    private isActive = false;

    constructor() {
        this.canvas = document.getElementById('audio-visualizer') as HTMLCanvasElement;
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }
    }

    private resize(): void {
        if (this.canvas) {
            this.canvas.width = 400;
            this.canvas.height = 80;
        }
    }

    public activate(): void {
        this.isActive = true;
        if (this.canvas) this.canvas.classList.add('active');
    }

    public deactivate(): void {
        this.isActive = false;
        if (this.canvas) this.canvas.classList.remove('active');
    }

    public draw(frequencyData: Uint8Array, intensity: number = 0): void {
        if (!this.isActive || !this.ctx || !this.canvas) return;

        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);

        const barCount = 64;
        const barWidth = (width / barCount) - 1;
        const dataStep = Math.floor(frequencyData.length / barCount);

        for (let i = 0; i < barCount; i++) {
            const dataIndex = i * dataStep;
            const value = frequencyData[dataIndex] || 0;
            const barHeight = (value / 255) * height;

            const hue = 200 + (i / barCount) * 60 + intensity * 30;
            const saturation = 70 + intensity * 30;
            const lightness = 40 + (value / 255) * 30;

            const gradient = this.ctx.createLinearGradient(0, height, 0, height - barHeight);
            gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`);
            gradient.addColorStop(1, `hsla(${hue + 20}, ${saturation}%, ${lightness + 20}%, 0.4)`);

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(i * (barWidth + 1), height - barHeight, barWidth, barHeight);

            if (value > 180) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
            } else {
                this.ctx.shadowBlur = 0;
            }
        }
    }

    public generatePseudoData(time: number, state: number): Uint8Array {
        const data = new Uint8Array(64);
        const stateBoost = state === 1 ? 80 : state === 2 ? 150 : state === 3 ? 40 : 20;

        for (let i = 0; i < 64; i++) {
            const baseValue = Math.sin(time * 2 + i * 0.2) * 50 + 50;
            data[i] = Math.min(255, baseValue + Math.random() * stateBoost);
        }

        return data;
    }
}
