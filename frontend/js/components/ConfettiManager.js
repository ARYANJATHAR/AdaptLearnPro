// Confetti Animation Component
export const ConfettiManager = {
    maxParticleCount: 150,
    particleSpeed: 2,
    confettiCanvas: null,
    context: null,
    particles: [],
    animationId: null,
    
    startConfetti() {
        // Create canvas if it doesn't exist
        if (!this.confettiCanvas) {
            this.confettiCanvas = document.createElement('canvas');
            this.confettiCanvas.id = 'confetti-canvas';
            this.confettiCanvas.style.position = 'fixed';
            this.confettiCanvas.style.top = '0';
            this.confettiCanvas.style.left = '0';
            this.confettiCanvas.style.width = '100%';
            this.confettiCanvas.style.height = '100%';
            this.confettiCanvas.style.pointerEvents = 'none';
            this.confettiCanvas.style.zIndex = '1000';
            document.body.appendChild(this.confettiCanvas);
            
            // Get the canvas context
            this.context = this.confettiCanvas.getContext('2d');
        }
        
        // Set canvas dimensions
        this.confettiCanvas.width = window.innerWidth;
        this.confettiCanvas.height = window.innerHeight;
        
        // Create particles
        this.particles = [];
        for (let i = 0; i < this.maxParticleCount; i++) {
            this.particles.push({
                x: Math.random() * this.confettiCanvas.width,
                y: Math.random() * this.confettiCanvas.height - this.confettiCanvas.height,
                r: Math.random() * 5 + 5, // radius
                d: Math.random() * this.maxParticleCount, // density
                color: this.getRandomColor(),
                tilt: Math.floor(Math.random() * 10) - 10,
                opacity: Math.random() + 0.5,
                shape: Math.floor(Math.random() * 2) // 0 for circle, 1 for rectangle
            });
        }
        
        // Start animation
        this.animateConfetti();
    },
    
    animateConfetti() {
        this.context.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
        
        for (let i = 0; i < this.maxParticleCount; i++) {
            let p = this.particles[i];
            this.context.beginPath();
            this.context.globalAlpha = p.opacity;
            
            if (p.shape === 0) {
                // Draw circle
                this.context.fillStyle = p.color;
                this.context.arc(p.x, p.y, p.r, 0, Math.PI * 2, false);
            } else {
                // Draw rectangle
                this.context.fillStyle = p.color;
                this.context.rect(p.x, p.y, p.r * 2, p.r * 2);
            }
            
            this.context.closePath();
            this.context.fill();
            
            // Move particles
            p.y += this.particleSpeed;
            p.tilt = Math.sin(p.d) * 15;
            
            // Reset particles when they reach bottom
            if (p.y > this.confettiCanvas.height) {
                this.particles[i] = {
                    x: Math.random() * this.confettiCanvas.width,
                    y: -10,
                    r: p.r,
                    d: p.d,
                    color: this.getRandomColor(),
                    tilt: Math.floor(Math.random() * 10) - 10,
                    opacity: Math.random() + 0.5,
                    shape: Math.floor(Math.random() * 2)
                };
            }
        }
        
        this.animationId = requestAnimationFrame(() => this.animateConfetti());
    },
    
    stopConfetti() {
        cancelAnimationFrame(this.animationId);
        
        // Remove canvas after a delay
        setTimeout(() => {
            if (this.confettiCanvas) {
                this.confettiCanvas.remove();
                this.confettiCanvas = null;
            }
        }, 100);
    },
    
    getRandomColor() {
        const colors = [
            '#FF5252', // red
            '#FF9800', // orange
            '#FFEB3B', // yellow
            '#4CAF50', // green
            '#2196F3', // blue
            '#673AB7', // purple
            '#E91E63'  // pink
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}; 