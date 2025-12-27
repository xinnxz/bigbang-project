import * as THREE from "three";
import { World } from "./modules/World.js";
import { AudioController } from "./modules/AudioController.js";
import { InputManager } from "./modules/InputManager.js";

class App {
  constructor() {
    this.container = document.getElementById("canvas-container");
    this.lastTime = 0;

    // Initialize Modules
    this.world = new World(this.container);
    this.audio = new AudioController();
    this.input = new InputManager(this.container);

    // Bind Input to World
    this.input.on("mousemove", (pos) => this.world.updateMouse(pos));
    this.input.on("mousedown", () => this.world.triggerExplosion());

    // Bind UI
    this.setupUI();

    // Start Loop
    this.animate(0);

    // Hide Loader
    setTimeout(() => {
      document.getElementById("load-bar").style.width = "100%";
      setTimeout(() => {
        document.getElementById("loader").style.opacity = "0";
        setTimeout(() => document.getElementById("loader").remove(), 1000);
      }, 500);
    }, 1000);
  }

  setupUI() {
    const upload = document.getElementById("upload-input");
    const status = document.getElementById("audio-status");
    const instruction = document.getElementById("instruction");

    upload.addEventListener("change", async (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        instruction.innerText = "DECODING AUDIO STREAM...";
        status.innerText = "PROCESSING";
        status.style.color = "#ffaa00";

        await this.audio.loadTrack(file);

        this.audio.play();
        status.innerText = "ACTIVE";
        status.style.color = "#00ff00";
        instruction.innerText = "CLICK MOUSE TO DETONATE // MOVE TO ROTATE";

        // Trigger Big Bang in World
        this.world.initBigBang();
      }
    });
  }

  animate(time) {
    requestAnimationFrame((t) => this.animate(t));

    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // 1. Get Audio Data
    const audioData = this.audio.getFrequencyData();
    const avgVolume = this.audio.getAverageVolume();

    // 2. Update HUD
    document.getElementById("db-level").innerText =
      avgVolume.toFixed(1) + " dB";
    document.getElementById("fps-count").innerText = Math.round(1 / dt);
    document.getElementById("p-count").innerText =
      this.world.particleCount.toLocaleString();

    // 3. Update World with Audio & Input Data
    this.world.update(dt, time, audioData, avgVolume);
  }
}

// Start the Engine
new App();
