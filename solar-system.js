/**
 * Solar System 3D Renderer
 * Creates and manages the 3D visualization of the solar system
 */

class SolarSystem {
    constructor(config, apiHandler, mechanics) {
        this.config = config;
        this.apiHandler = apiHandler;
        this.mechanics = mechanics;

        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Celestial objects
        this.celestialObjects = {};
        this.orbits = {};
        this.labels = [];

        // Time and animation
        this.timeSpeed = 1;
        this.simulationTime = new Date();
        this.lastUpdateTime = Date.now();

        // Scale mode
        this.scaleMode = 'viewable'; // 'realistic', 'viewable', 'logarithmic'
        this.showLabels = true;

        // Textures
        this.textureLoader = null;
        this.loadedTextures = {};

        // Special effects
        this.starfield = null;
        this.sunLight = null;
        this.ambientLight = null;

        // Water simulation
        this.waterMesh = null;
        this.atmosphereMesh = null;
    }

    /**
     * Initialize the 3D scene
     */
    async initialize(canvas) {
        console.log('🌌 Initializing Solar System...');

        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Setup camera
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            this.config.camera.fov,
            aspect,
            this.config.camera.near,
            this.config.camera.far
        );

        this.camera.position.set(
            this.config.camera.initialPosition.x,
            this.config.camera.initialPosition.y,
            this.config.camera.initialPosition.z
        );

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: this.config.rendering.antialiasing,
            alpha: false
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        if (this.config.rendering.shadows) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        // Setup controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 50000;

        // Setup texture loader
        this.textureLoader = new THREE.TextureLoader();
        this.textureLoader.crossOrigin = 'anonymous';

        // Create scene elements
        this.createStarfield();
        this.createLighting();
        await this.createCelestialBodies();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        console.log('✅ Solar System initialized');
    }

    /**
     * Create starfield background
     */
    createStarfield() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = this.config.rendering.starfield.count;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        const spread = this.config.rendering.starfield.spread;

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;

            // Random position in sphere
            const radius = spread * (0.5 + Math.random() * 0.5);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Star color (slightly varied)
            const color = 0.8 + Math.random() * 0.2;
            colors[i3] = color;
            colors[i3 + 1] = color * (0.9 + Math.random() * 0.1);
            colors[i3 + 2] = color * (0.9 + Math.random() * 0.1);
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starMaterial = new THREE.PointsMaterial({
            size: this.config.rendering.starfield.size,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        this.starfield = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.starfield);
    }

    /**
     * Create lighting
     */
    createLighting() {
        // Sun light (point light at sun position)
        this.sunLight = new THREE.PointLight(0xffffff, 2, 0);
        this.sunLight.position.set(0, 0, 0);
        if (this.config.rendering.shadows) {
            this.sunLight.castShadow = true;
        }
        this.scene.add(this.sunLight);

        // Ambient light (very dim)
        this.ambientLight = new THREE.AmbientLight(0x222222);
        this.scene.add(this.ambientLight);
    }

    /**
     * Create all celestial bodies
     */
    async createCelestialBodies() {
        const bodies = this.config.celestialBodies;

        // Create Sun
        await this.createCelestialBody('sun', bodies.sun, { x: 0, y: 0, z: 0 });

        // Create planets
        for (const [name, data] of Object.entries(bodies)) {
            if (name === 'sun' || name === 'moon') continue;

            if (data.distance && data.orbitalPeriod) {
                const scaledDistance = this.scaleDistance(data.distance);
                const position = {
                    x: scaledDistance,
                    y: 0,
                    z: 0
                };

                await this.createCelestialBody(name, data, position);

                // Create orbit line
                this.createOrbit(name, scaledDistance);
            }
        }

        // Create Moon (special case - orbits Earth)
        if (bodies.moon && this.celestialObjects.earth) {
            const moonDistance = this.scaleDistance(bodies.moon.distance);
            const earthPos = this.celestialObjects.earth.mesh.position;

            await this.createCelestialBody('moon', bodies.moon, {
                x: earthPos.x + moonDistance,
                y: earthPos.y,
                z: earthPos.z
            });

            // Create moon's orbit around Earth
            this.createOrbit('moon', moonDistance, this.celestialObjects.earth.mesh.position);
        }

        // Add special effects to Earth
        if (this.celestialObjects.earth) {
            this.addEarthAtmosphere();
            this.addEarthOceans();
        }
    }

    /**
     * Create a single celestial body
     */
    async createCelestialBody(name, data, position) {
        const scaledRadius = this.scaleSize(data.radius);

        // Create sphere geometry
        const geometry = new THREE.SphereGeometry(scaledRadius, 64, 64);

        // Create material
        let material;

        if (name === 'sun') {
            // Emissive material for the sun
            material = new THREE.MeshBasicMaterial({
                color: data.color,
                emissive: data.emissive || data.color,
                emissiveIntensity: data.emissiveIntensity || 1
            });
        } else {
            material = new THREE.MeshStandardMaterial({
                color: data.color,
                roughness: 0.8,
                metalness: 0.2
            });

            // Load texture if available
            if (data.texture) {
                try {
                    const texture = await this.loadTexture(data.texture);
                    material.map = texture;
                    material.needsUpdate = true;
                } catch (error) {
                    console.warn(`Failed to load texture for ${name}:`, error);
                }
            }

            // Load normal map if available
            if (data.normalMap) {
                try {
                    const normalMap = await this.loadTexture(data.normalMap);
                    material.normalMap = normalMap;
                    material.needsUpdate = true;
                } catch (error) {
                    console.warn(`Failed to load normal map for ${name}`);
                }
            }

            // Load specular map if available (for Earth)
            if (data.specularMap) {
                try {
                    const specularMap = await this.loadTexture(data.specularMap);
                    material.roughnessMap = specularMap;
                    material.needsUpdate = true;
                } catch (error) {
                    console.warn(`Failed to load specular map for ${name}`);
                }
            }
        }

        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);

        if (this.config.rendering.shadows && name !== 'sun') {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }

        // Add to scene
        this.scene.add(mesh);

        // Store reference
        this.celestialObjects[name] = {
            mesh: mesh,
            data: data,
            angle: 0,
            rotationAngle: 0
        };

        // Add label
        if (this.showLabels) {
            this.createLabel(name, mesh);
        }

        // Add rings for Saturn
        if (data.hasRings && name === 'saturn') {
            this.addSaturnRings(mesh, scaledRadius);
        }

        return mesh;
    }

    /**
     * Load texture with promise
     */
    loadTexture(url) {
        return new Promise((resolve, reject) => {
            // Check cache
            if (this.loadedTextures[url]) {
                resolve(this.loadedTextures[url]);
                return;
            }

            this.textureLoader.load(
                url,
                (texture) => {
                    this.loadedTextures[url] = texture;
                    resolve(texture);
                },
                undefined,
                (error) => {
                    reject(error);
                }
            );
        });
    }

    /**
     * Create orbit line
     */
    createOrbit(name, radius, center = { x: 0, y: 0, z: 0 }) {
        const points = [];
        const segments = 128;

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                center.x + radius * Math.cos(angle),
                center.y,
                center.z + radius * Math.sin(angle)
            ));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.3
        });

        const orbit = new THREE.Line(geometry, material);
        this.scene.add(orbit);
        this.orbits[name] = orbit;
    }

    /**
     * Add atmosphere to Earth
     */
    addEarthAtmosphere() {
        const earth = this.celestialObjects.earth;
        if (!earth) return;

        const scaledRadius = this.scaleSize(this.config.celestialBodies.earth.radius);
        const atmosphereGeometry = new THREE.SphereGeometry(scaledRadius * 1.05, 64, 64);

        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });

        this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        earth.mesh.add(this.atmosphereMesh);
    }

    /**
     * Add ocean layer to Earth (for tidal visualization)
     */
    addEarthOceans() {
        const earth = this.celestialObjects.earth;
        if (!earth) return;

        const scaledRadius = this.scaleSize(this.config.celestialBodies.earth.radius);
        const waterGeometry = new THREE.SphereGeometry(scaledRadius * 1.002, 128, 128);

        const waterMaterial = new THREE.MeshPhongMaterial({
            color: 0x1e90ff,
            transparent: true,
            opacity: 0.6,
            shininess: 100,
            specular: 0xffffff
        });

        this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        earth.mesh.add(this.waterMesh);

        // Store geometry for displacement updates
        this.waterMesh.userData.originalPositions = waterGeometry.attributes.position.array.slice();
    }

    /**
     * Add rings to Saturn
     */
    addSaturnRings(saturnMesh, planetRadius) {
        const innerRadius = planetRadius * 1.2;
        const outerRadius = planetRadius * 2.3;

        const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xc4a144,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2;
        saturnMesh.add(rings);
    }

    /**
     * Create text label for celestial body
     */
    createLabel(name, mesh) {
        // Note: For production, use CSS2DRenderer or sprite-based labels
        // This is a simplified version
        const label = {
            name: name,
            mesh: mesh,
            visible: this.showLabels
        };
        this.labels.push(label);
    }

    /**
     * Scale distance based on current scale mode
     */
    scaleDistance(distance) {
        switch (this.scaleMode) {
            case 'realistic':
                return distance * this.config.rendering.scaleFactor.distance;
            case 'logarithmic':
                return Math.log(distance + 1) * 50;
            case 'viewable':
            default:
                return Math.pow(distance, 0.5) * 0.5;
        }
    }

    /**
     * Scale size based on current scale mode
     */
    scaleSize(radius) {
        const scaleFactor = this.config.rendering.scaleFactor.size;
        return radius * scaleFactor;
    }

    /**
     * Update all celestial positions based on time
     */
    update(deltaTime) {
        // Update simulation time
        this.simulationTime = new Date(
            this.simulationTime.getTime() + deltaTime * this.timeSpeed * 1000
        );

        // Update planetary positions
        const julianDate = this.apiHandler.dateToJulianDate(this.simulationTime);

        Object.entries(this.celestialObjects).forEach(([name, obj]) => {
            if (name === 'sun') {
                // Sun stays at center
                this.rotateCelestialBody(obj, deltaTime);
                return;
            }

            if (name === 'moon' && this.celestialObjects.earth) {
                // Moon orbits Earth
                this.updateMoonPosition(obj, deltaTime);
            } else if (obj.data.orbitalPeriod) {
                // Planets orbit Sun
                this.updatePlanetPosition(obj, deltaTime, julianDate);
            }

            // Rotate the body
            this.rotateCelestialBody(obj, deltaTime);
        });

        // Update water simulation if enabled
        if (this.config.physics.enableOceanSimulation && this.waterMesh) {
            this.updateWaterDisplacement();
        }

        // Update controls
        this.controls.update();
    }

    /**
     * Update planet orbital position
     */
    updatePlanetPosition(planetObj, deltaTime, julianDate) {
        const data = planetObj.data;
        const scaledDistance = this.scaleDistance(data.distance);

        // Calculate orbital angle based on orbital period
        const orbitalSpeed = (2 * Math.PI) / (data.orbitalPeriod * 24 * 3600); // rad/s
        planetObj.angle += orbitalSpeed * deltaTime * this.timeSpeed;

        // Update position
        planetObj.mesh.position.x = scaledDistance * Math.cos(planetObj.angle);
        planetObj.mesh.position.z = scaledDistance * Math.sin(planetObj.angle);
    }

    /**
     * Update moon position relative to Earth
     */
    updateMoonPosition(moonObj, deltaTime) {
        const earth = this.celestialObjects.earth;
        if (!earth) return;

        const moonData = this.apiHandler.getData('moonPhase');
        const data = moonObj.data;
        const scaledDistance = this.scaleDistance(data.distance);

        if (moonData) {
            // Use real moon position data
            const angle = (moonData.position.longitude * Math.PI) / 180;
            moonObj.angle = angle;
        } else {
            // Fallback to calculated position
            const orbitalSpeed = (2 * Math.PI) / (data.orbitalPeriod * 24 * 3600);
            moonObj.angle += orbitalSpeed * deltaTime * this.timeSpeed;
        }

        // Position relative to Earth
        moonObj.mesh.position.x = earth.mesh.position.x + scaledDistance * Math.cos(moonObj.angle);
        moonObj.mesh.position.z = earth.mesh.position.z + scaledDistance * Math.sin(moonObj.angle);
    }

    /**
     * Rotate celestial body on its axis
     */
    rotateCelestialBody(obj, deltaTime) {
        const rotationPeriod = obj.data.rotationPeriod || 1; // days
        const rotationSpeed = (2 * Math.PI) / (rotationPeriod * 24 * 3600); // rad/s

        obj.rotationAngle += rotationSpeed * deltaTime * this.timeSpeed;
        obj.mesh.rotation.y = obj.rotationAngle;

        // Apply axial tilt if specified
        if (obj.data.axialTilt) {
            obj.mesh.rotation.z = (obj.data.axialTilt * Math.PI) / 180;
        }
    }

    /**
     * Update water displacement based on tidal forces
     */
    updateWaterDisplacement() {
        if (!this.waterMesh || !this.celestialObjects.moon) return;

        const moon = this.celestialObjects.moon;
        const sun = this.celestialObjects.sun;

        // Get moon and sun positions
        const moonPos = moon.mesh.position;
        const sunPos = sun.mesh.position;

        // Calculate displacement
        const displacement = this.mechanics.generateWaterDisplacement(
            moonPos,
            sunPos,
            Date.now()
        );

        // Apply displacement to water mesh (simplified)
        const geometry = this.waterMesh.geometry;
        const positions = geometry.attributes.position;
        const originalPositions = this.waterMesh.userData.originalPositions;

        for (let i = 0; i < positions.count; i++) {
            const i3 = i * 3;

            // Get original position
            const x = originalPositions[i3];
            const y = originalPositions[i3 + 1];
            const z = originalPositions[i3 + 2];

            // Calculate displacement based on position
            const lat = Math.asin(y / Math.sqrt(x*x + y*y + z*z)) * 180 / Math.PI;
            const lon = Math.atan2(z, x) * 180 / Math.PI;

            // Get displacement value (simplified)
            const displacementValue = Math.sin(lon * Math.PI / 180) * 0.002;

            // Apply displacement
            const length = Math.sqrt(x*x + y*y + z*z);
            const scale = (1 + displacementValue);

            positions.setXYZ(i, x * scale, y * scale, z * scale);
        }

        positions.needsUpdate = true;
    }

    /**
     * Render the scene
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Set camera view preset
     */
    setCameraView(preset) {
        const earth = this.celestialObjects.earth;
        const moon = this.celestialObjects.moon;

        switch (preset) {
            case 'system':
                this.camera.position.set(0, 500, 1000);
                this.controls.target.set(0, 0, 0);
                break;

            case 'earth-moon':
                if (earth && moon) {
                    const earthPos = earth.mesh.position;
                    this.camera.position.set(
                        earthPos.x + 100,
                        earthPos.y + 50,
                        earthPos.z + 100
                    );
                    this.controls.target.copy(earthPos);
                }
                break;

            case 'earth':
                if (earth) {
                    const earthPos = earth.mesh.position;
                    this.camera.position.set(
                        earthPos.x + 20,
                        earthPos.y + 10,
                        earthPos.z + 20
                    );
                    this.controls.target.copy(earthPos);
                }
                break;
        }

        this.controls.update();
    }

    /**
     * Toggle scale mode
     */
    toggleScaleMode() {
        const modes = ['viewable', 'logarithmic', 'realistic'];
        const currentIndex = modes.indexOf(this.scaleMode);
        this.scaleMode = modes[(currentIndex + 1) % modes.length];

        // Rebuild scene with new scale
        this.rebuildScene();

        return this.scaleMode;
    }

    /**
     * Toggle labels visibility
     */
    toggleLabels() {
        this.showLabels = !this.showLabels;
        this.labels.forEach(label => {
            label.visible = this.showLabels;
        });
        return this.showLabels;
    }

    /**
     * Set time speed multiplier
     */
    setTimeSpeed(speed) {
        this.timeSpeed = speed;
    }

    /**
     * Rebuild scene (when scale changes)
     */
    async rebuildScene() {
        // Clear existing objects (except starfield and lights)
        Object.values(this.celestialObjects).forEach(obj => {
            this.scene.remove(obj.mesh);
        });

        Object.values(this.orbits).forEach(orbit => {
            this.scene.remove(orbit);
        });

        this.celestialObjects = {};
        this.orbits = {};

        // Recreate celestial bodies
        await this.createCelestialBodies();
    }

    /**
     * Get celestial object by name
     */
    getCelestialObject(name) {
        return this.celestialObjects[name];
    }

    /**
     * Clean up resources
     */
    dispose() {
        // Dispose geometries and materials
        Object.values(this.celestialObjects).forEach(obj => {
            obj.mesh.geometry.dispose();
            obj.mesh.material.dispose();
        });

        this.renderer.dispose();
    }
}

// Make available globally
window.SolarSystem = SolarSystem;
