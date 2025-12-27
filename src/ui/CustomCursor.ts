// ==================================================================================
// CUSTOM CURSOR - Animated Dot + Ring + Trail
// ==================================================================================

export class CustomCursor {
    private dot: HTMLElement | null;
    private ring: HTMLElement | null;
    private mouseX = 0;
    private mouseY = 0;
    private ringX = 0;
    private ringY = 0;
    private isActive = false;
    private animationId: number | null = null;

    constructor() {
        this.dot = document.getElementById('cursor-dot');
        this.ring = document.getElementById('cursor-ring');
    }

    public init(): void {
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mousedown', () => this.onMouseDown());
        document.addEventListener('mouseup', () => this.onMouseUp());
        document.addEventListener('mouseleave', () => this.hide());
        document.addEventListener('mouseenter', () => this.show());

        this.animate();
    }

    private onMouseMove(e: MouseEvent): void {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;

        if (this.dot) {
            this.dot.style.left = `${this.mouseX}px`;
            this.dot.style.top = `${this.mouseY}px`;
        }

        // Create trail
        if (Math.random() > 0.7) {
            this.createTrail(this.mouseX, this.mouseY);
        }
    }

    private onMouseDown(): void {
        this.isActive = true;
        if (this.ring) this.ring.classList.add('active');
    }

    private onMouseUp(): void {
        this.isActive = false;
        if (this.ring) this.ring.classList.remove('active');
    }

    private hide(): void {
        if (this.dot) this.dot.style.opacity = '0';
        if (this.ring) this.ring.style.opacity = '0';
    }

    private show(): void {
        if (this.dot) this.dot.style.opacity = '1';
        if (this.ring) this.ring.style.opacity = '1';
    }

    private createTrail(x: number, y: number): void {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.style.left = `${x}px`;
        trail.style.top = `${y}px`;
        document.body.appendChild(trail);

        setTimeout(() => trail.remove(), 600);
    }

    private animate(): void {
        // Smooth ring follow with easing
        this.ringX += (this.mouseX - this.ringX) * 0.15;
        this.ringY += (this.mouseY - this.ringY) * 0.15;

        if (this.ring) {
            this.ring.style.left = `${this.ringX}px`;
            this.ring.style.top = `${this.ringY}px`;
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    public dispose(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}
