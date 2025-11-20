/**
 * Main Application Controller
 * AIIA OmniOrO - Real-Time 3D Solar System
 * Operating under Omniplex Ethics & Alignment
 */

class SolarSystemApp {
    constructor() {
        this.config = CONFIG;
        this.apiHandler = null;
        this.mechanics = null;
        this.solarSystem = null;
        this.isInitialized = false;
        this.animationFrameId = null;
        this.lastFrameTime = Date.now();
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 Starting AIIA Solar System Application...');
        console.log('🛡️ Operating under Omniplex Ethics & Alignment');

        try {
            // Get canvas element
            const canvas = document.getElementById('solar-system-canvas');
            if (!canvas) {
                throw new Error('Canvas element not found');
            }

            // Initialize components
            console.log('📡 Initializing API Handler...');
            this.apiHandler = new APIHandler(this.config);
            await this.apiHandler.initialize();

            console.log('🔬 Initializing Celestial Mechanics...');
            this.mechanics = new CelestialMechanics(this.config);

            console.log('🌌 Initializing Solar System...');
            this.solarSystem = new SolarSystem(this.config, this.apiHandler, this.mechanics);
            await this.solarSystem.initialize(canvas);

            // Setup UI
            this.setupUI();

            // Start animation loop
            this.animate();

            // Hide loading screen
            const loadingScreen = document.getElementById('loading-screen');
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1000);

            this.isInitialized = true;
            console.log('✅ Application initialized successfully!');

        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.showError('Failed to initialize application: ' + error.message);
        }
    }

    /**
     * Setup UI event handlers
     */
    setupUI() {
        // Panel toggle
        const toggleBtn = document.getElementById('toggle-panel');
        const panel = document.getElementById('control-panel');
        toggleBtn.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
        });

        // View controls
        document.getElementById('view-system').addEventListener('click', () => {
            this.solarSystem.setCameraView('system');
        });

        document.getElementById('view-earth-moon').addEventListener('click', () => {
            this.solarSystem.setCameraView('earth-moon');
        });

        document.getElementById('view-earth').addEventListener('click', () => {
            this.solarSystem.setCameraView('earth');
        });

        // Scale toggle
        document.getElementById('toggle-scale').addEventListener('click', () => {
            const newMode = this.solarSystem.toggleScaleMode();
            this.showNotification(`Scale mode: ${newMode}`);
        });

        // Labels toggle
        document.getElementById('toggle-labels').addEventListener('click', () => {
            const labelsOn = this.solarSystem.toggleLabels();
            this.showNotification(`Labels: ${labelsOn ? 'ON' : 'OFF'}`);
        });

        // Speed controls
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const speed = parseInt(e.target.dataset.speed);
                this.solarSystem.setTimeSpeed(speed);

                // Update active state
                document.querySelectorAll('.speed-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.target.classList.add('active');

                this.showNotification(`Time speed: ${speed}x`);
            });
        });

        // Set default speed (1x)
        document.querySelector('.speed-btn[data-speed="1"]').classList.add('active');

        // Fullscreen button
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Start UI update loop
        this.updateUI();
        setInterval(() => this.updateUI(), 1000); // Update every second
    }

    /**
     * Update UI with real-time data
     */
    updateUI() {
        // Current time
        const now = new Date();
        document.getElementById('current-time').innerHTML = `
            <div><strong>${now.toLocaleDateString()}</strong></div>
            <div>${now.toLocaleTimeString()}</div>
        `;

        // Moon data
        const moonData = this.apiHandler.getData('moonPhase');
        if (moonData) {
            document.getElementById('moon-phase').innerHTML = `
                <strong>Phase:</strong> <span class="value-highlight">${moonData.phaseName}</span>
            `;
            document.getElementById('moon-illumination').innerHTML = `
                <strong>Illumination:</strong> <span class="value-highlight">${moonData.illumination}%</span>
            `;
            document.getElementById('moon-distance').innerHTML = `
                <strong>Distance:</strong> <span class="value-highlight">${Number(moonData.distance).toLocaleString()} km</span>
            `;
            document.getElementById('moon-position').innerHTML = `
                <strong>Age:</strong> <span class="value-highlight">${moonData.age} days</span>
            `;
        }

        // Tidal data
        const tidalData = this.apiHandler.getData('tidalData');
        if (tidalData) {
            document.getElementById('tidal-force').innerHTML = `
                <strong>Type:</strong> <span class="value-highlight">${tidalData.type}</span>
            `;

            const nextTideTime = new Date(tidalData.nextTide);
            const timeToTide = Math.round((nextTideTime - now) / (1000 * 60)); // minutes
            document.getElementById('next-tide').innerHTML = `
                <strong>Next ${tidalData.highTide ? 'High' : 'Low'} Tide:</strong>
                <span class="value-highlight">~${timeToTide} min</span>
            `;
        }

        // Earth info
        if (this.solarSystem && this.solarSystem.celestialObjects.earth) {
            const earth = this.solarSystem.celestialObjects.earth;
            const rotationDeg = ((earth.rotationAngle * 180 / Math.PI) % 360).toFixed(1);

            document.getElementById('earth-rotation').innerHTML = `
                <strong>Rotation:</strong> <span class="value-highlight">${rotationDeg}°</span>
            `;
            document.getElementById('earth-tilt').innerHTML = `
                <strong>Axial Tilt:</strong> <span class="value-highlight">23.5°</span>
            `;
        }
    }

    /**
     * Animation loop
     */
    animate() {
        this.animationFrameId = requestAnimationFrame(() => this.animate());

        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = currentTime;

        // Update solar system
        if (this.solarSystem) {
            this.solarSystem.update(deltaTime);
            this.solarSystem.render();
        }
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Error entering fullscreen:', err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    /**
     * Show notification
     */
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(3, 169, 244, 0.9);
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: slideDown 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * Show error message
     */
    showError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingContent = loadingScreen.querySelector('.loading-content');

        loadingContent.innerHTML = `
            <h1>❌ Error</h1>
            <p style="color: #f44336; margin-top: 20px;">${message}</p>
            <p style="margin-top: 20px;">Please check the console for details.</p>
        `;

        loadingScreen.style.display = 'flex';
        loadingScreen.classList.remove('hidden');
    }

    /**
     * Clean up and destroy app
     */
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        if (this.apiHandler) {
            this.apiHandler.destroy();
        }

        if (this.solarSystem) {
            this.solarSystem.dispose();
        }

        this.isInitialized = false;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
let app;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new SolarSystemApp();
        app.init();
    });
} else {
    app = new SolarSystemApp();
    app.init();
}

// Make app available globally for debugging
window.solarSystemApp = app;

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});
