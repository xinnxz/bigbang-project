// ==================================================================================
// AUDIO ENGINE - Web Audio API Synthesis
// ==================================================================================

interface AudioNodes {
    osc: OscillatorNode;
    gain: GainNode;
}

export class AudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private riserOsc: OscillatorNode | null = null;
    private riserLfo: OscillatorNode | null = null;
    private riserGain: GainNode | null = null;
    private oscillators: AudioNodes[] = [];

    public init(): void {
        if (this.ctx) return;

        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);
    }

    public startRiser(): void {
        if (!this.ctx || !this.masterGain) return;

        this.riserOsc = this.ctx.createOscillator();
        this.riserGain = this.ctx.createGain();
        this.riserLfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();

        this.riserOsc.type = 'sawtooth';
        this.riserOsc.frequency.setValueAtTime(80, this.ctx.currentTime);
        this.riserLfo.type = 'sine';
        this.riserLfo.frequency.value = 8;
        lfoGain.gain.value = 20;

        this.riserLfo.connect(lfoGain);
        lfoGain.connect(this.riserOsc.frequency);
        this.riserOsc.connect(this.riserGain);
        this.riserGain.connect(this.masterGain);

        this.riserGain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        this.riserOsc.start();
        this.riserLfo.start();
    }

    public modulateRiser(intensity: number): void {
        if (!this.ctx || !this.riserOsc || !this.riserGain) return;

        const targetFreq = 80 + intensity * 400;
        const targetGain = 0.1 + intensity * 0.3;

        this.riserOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
        this.riserGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    }

    public stopRiser(): void {
        if (this.riserOsc) {
            this.riserOsc.stop();
            this.riserOsc = null;
        }
        if (this.riserLfo) {
            this.riserLfo.stop();
            this.riserLfo = null;
        }
    }

    public triggerExplosion(): void {
        if (!this.ctx || !this.masterGain) return;

        this.stopRiser();

        // White Noise Burst
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 1000;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1, this.ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.5);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start();

        // Sub-Bass Kick
        const kick = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kick.frequency.setValueAtTime(150, this.ctx.currentTime);
        kick.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.5);
        kickGain.gain.setValueAtTime(1, this.ctx.currentTime);
        kickGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1);
        kick.connect(kickGain);
        kickGain.connect(this.masterGain);
        kick.start();
        kick.stop(this.ctx.currentTime + 1);
    }

    public playGalaxyAmbient(): void {
        if (!this.ctx || !this.masterGain) return;

        const frequencies = [110, 165, 220, 330];
        frequencies.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.value = 0.02 / (i + 1);
            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start();
            this.oscillators.push({ osc, gain });
        });
    }

    public resetGalaxy(): void {
        if (!this.ctx) return;

        this.oscillators.forEach((o) => {
            o.gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 1);
            o.osc.stop(this.ctx!.currentTime + 1);
        });
        this.oscillators = [];
    }

    public dispose(): void {
        this.stopRiser();
        this.resetGalaxy();
        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
        }
    }
}
