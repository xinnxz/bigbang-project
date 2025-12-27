export class InputManager {
  constructor(targetElement) {
    this.target = targetElement;
    this.events = {};

    this.target.addEventListener("mousemove", (e) => {
      // Normalize to -1 ... 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.emit("mousemove", { x, y });
    });

    this.target.addEventListener("mousedown", (e) => {
      this.emit("mousedown", e);
    });

    window.addEventListener("keydown", (e) => {
      this.emit("keydown", e.code);
    });
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach((cb) => cb(data));
    }
  }
}
