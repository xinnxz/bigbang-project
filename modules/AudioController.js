export class AudioController {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512; // Resolution of frequency bars
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    this.source = null;
    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);
  }

  async loadTrack(file) {
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    // Stop previous track
    if (this.source) {
      this.source.stop();
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

    this.source = this.ctx.createBufferSource();
    this.source.buffer = audioBuffer;

    // Connect nodes: Source -> Analyser -> Gain -> Speakers
    this.source.connect(this.analyser);
    this.analyser.connect(this.gainNode);

    this.source.loop = true;
  }

  play() {
    if (this.source) this.source.start(0);
  }

  getFrequencyData() {
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  getAverageVolume() {
    let sum = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      sum += this.dataArray[i];
    }
    return sum / this.bufferLength;
  }
}
