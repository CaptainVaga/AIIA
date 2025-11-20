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

        // Setup object interaction (double-click)
        this.setupObjectInteraction();
    }

    /**
     * Setup object interaction (clicking on celestial bodies)
     */
    setupObjectInteraction() {
        const canvas = document.getElementById('solar-system-canvas');
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        let lastClickTime = 0;
        const doubleClickDelay = 300; // ms

        canvas.addEventListener('click', (event) => {
            const currentTime = Date.now();
            const timeSinceLastClick = currentTime - lastClickTime;

            // Calculate mouse position in normalized device coordinates
            const rect = canvas.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // Update the raycaster
            raycaster.setFromCamera(mouse, this.solarSystem.camera);

            // Get all celestial object meshes
            const celestialMeshes = Object.entries(this.solarSystem.celestialObjects)
                .map(([name, obj]) => ({ mesh: obj.mesh, name: name }));

            // Check for intersections
            const intersects = raycaster.intersectObjects(
                celestialMeshes.map(obj => obj.mesh)
            );

            if (intersects.length > 0) {
                const clickedObject = celestialMeshes.find(
                    obj => obj.mesh === intersects[0].object
                );

                if (clickedObject) {
                    // Single click - show info
                    this.showObjectInfo(clickedObject.name);

                    // Double click detection
                    if (timeSinceLastClick < doubleClickDelay) {
                        this.onDoubleClickObject(clickedObject.name);
                    }
                }
            } else {
                // Clicked on empty space - hide info
                this.hideObjectInfo();
            }

            lastClickTime = currentTime;
        });
    }

    /**
     * Handle double-click on celestial object
     */
    onDoubleClickObject(objectName) {
        console.log(`🎯 Double-clicked on ${objectName}`);

        switch (objectName) {
            case 'earth':
                // Zoom to Earth close-up view
                this.solarSystem.setCameraView('earth');
                this.showNotification(`🌍 Zooming to Earth - Detailed View`);
                break;

            case 'moon':
                // Zoom to Moon
                this.zoomToObject('moon');
                this.showNotification(`🌙 Zooming to Moon`);
                break;

            case 'sun':
                // Zoom to Sun
                this.zoomToObject('sun');
                this.showNotification(`☀️ Zooming to Sun`);
                break;

            default:
                // Zoom to any other planet
                this.zoomToObject(objectName);
                this.showNotification(`Zooming to ${objectName.charAt(0).toUpperCase() + objectName.slice(1)}`);
                break;
        }
    }

    /**
     * Zoom camera to specific object
     */
    zoomToObject(objectName) {
        const obj = this.solarSystem.getCelestialObject(objectName);
        if (!obj) return;

        const position = obj.mesh.position;
        const size = obj.mesh.geometry.parameters.radius;

        // Calculate camera position (5x the object size away)
        const distance = size * 5;

        this.solarSystem.camera.position.set(
            position.x + distance,
            position.y + distance * 0.5,
            position.z + distance
        );

        this.solarSystem.controls.target.copy(position);
        this.solarSystem.controls.update();
    }

    /**
     * Show information about clicked object
     */
    showObjectInfo(objectName) {
        const infoOverlay = document.getElementById('info-overlay');
        const infoContent = document.getElementById('selected-object-info');

        const obj = this.solarSystem.getCelestialObject(objectName);
        if (!obj) return;

        const data = obj.data;
        let info = `<h3>${objectName.charAt(0).toUpperCase() + objectName.slice(1)}</h3>`;

        if (data.radius) {
            info += `<div><strong>Radius:</strong> ${data.radius.toLocaleString()} km</div>`;
        }

        if (data.distance) {
            info += `<div><strong>Distance:</strong> ${data.distance.toLocaleString()} km</div>`;
        }

        if (data.orbitalPeriod) {
            info += `<div><strong>Orbital Period:</strong> ${data.orbitalPeriod.toFixed(1)} days</div>`;
        }

        if (objectName === 'earth') {
            const moonData = this.apiHandler.getData('moonPhase');
            if (moonData) {
                info += `<div style="margin-top: 10px;"><strong>Moon Phase:</strong> ${moonData.phaseName}</div>`;
            }
        }

        info += `<div style="margin-top: 10px; font-size: 0.85em; color: #03a9f4;">💡 Double-click to zoom in</div>`;

        infoContent.innerHTML = info;
        infoOverlay.classList.add('visible');
    }

    /**
     * Hide object info overlay
     */
    hideObjectInfo() {
        const infoOverlay = document.getElementById('info-overlay');
        infoOverlay.classList.remove('visible');
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
