/**
 * Celestial Mechanics and Physics Simulation
 * Handles gravitational forces, tidal effects, and water movement
 */

class CelestialMechanics {
    constructor(config) {
        this.config = config;
        this.G = config.physics.gravitationalConstant;
        this.tidalMesh = null;
        this.waterDisplacement = new Float32Array(config.physics.waterResolution * config.physics.waterResolution);
    }

    /**
     * Calculate gravitational force between two bodies
     * F = G * (m1 * m2) / r^2
     */
    calculateGravitationalForce(mass1, mass2, distance) {
        return this.G * (mass1 * mass2) / Math.pow(distance * 1000, 2);
    }

    /**
     * Calculate tidal force on Earth from Moon and Sun
     * Tidal force = 2 * G * M * R / r^3
     * where M is the mass of the attracting body, R is Earth's radius, r is distance
     */
    calculateTidalForce(moonPosition, sunPosition, earthRadius) {
        const moonMass = 7.342e22; // kg
        const sunMass = 1.989e30; // kg
        const earthRadiusMeters = earthRadius * 1000;

        // Moon's tidal force
        const moonDistance = Math.sqrt(
            moonPosition.x * moonPosition.x +
            moonPosition.y * moonPosition.y +
            moonPosition.z * moonPosition.z
        ) * 1000; // Convert to meters

        const lunarTidalForce = 2 * this.G * moonMass * earthRadiusMeters /
                                Math.pow(moonDistance, 3);

        // Sun's tidal force
        const sunDistance = Math.sqrt(
            sunPosition.x * sunPosition.x +
            sunPosition.y * sunPosition.y +
            sunPosition.z * sunPosition.z
        ) * 1000;

        const solarTidalForce = 2 * this.G * sunMass * earthRadiusMeters /
                                Math.pow(sunDistance, 3);

        return {
            lunar: lunarTidalForce,
            solar: solarTidalForce,
            total: lunarTidalForce + solarTidalForce,
            ratio: lunarTidalForce / solarTidalForce // Moon is typically 2.2x stronger
        };
    }

    /**
     * Calculate tidal bulge height at a point on Earth's surface
     */
    calculateTidalBulgeHeight(latitude, longitude, moonPosition, sunPosition) {
        // Convert lat/lon to 3D point on Earth's surface
        const earthRadius = this.config.celestialBodies.earth.radius;
        const latRad = latitude * Math.PI / 180;
        const lonRad = longitude * Math.PI / 180;

        const pointOnEarth = {
            x: earthRadius * Math.cos(latRad) * Math.cos(lonRad),
            y: earthRadius * Math.sin(latRad),
            z: earthRadius * Math.cos(latRad) * Math.sin(lonRad)
        };

        // Calculate angle between point and moon
        const moonAngle = this.angleBetweenVectors(pointOnEarth, moonPosition);
        const sunAngle = this.angleBetweenVectors(pointOnEarth, sunPosition);

        // Tidal height follows cosine relationship
        // Maximum at sub-lunar point and antipodal point
        const lunarHeight = Math.cos(2 * moonAngle) * 0.5; // ~0.5m max
        const solarHeight = Math.cos(2 * sunAngle) * 0.23; // ~0.23m max (46% of lunar)

        return {
            total: lunarHeight + solarHeight,
            lunar: lunarHeight,
            solar: solarHeight
        };
    }

    /**
     * Calculate angle between two 3D vectors
     */
    angleBetweenVectors(v1, v2) {
        const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
        return Math.acos(dot / (mag1 * mag2));
    }

    /**
     * Generate water displacement map based on tidal forces
     */
    generateWaterDisplacement(moonPosition, sunPosition, time) {
        const resolution = this.config.physics.waterResolution;

        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                // Convert grid to lat/lon
                const lat = (i / resolution) * 180 - 90;
                const lon = (j / resolution) * 360 - 180;

                // Calculate tidal height at this point
                const tidalHeight = this.calculateTidalBulgeHeight(
                    lat, lon, moonPosition, sunPosition
                );

                // Add some wave motion for realism
                const waveOffset = Math.sin(time * 0.001 + lon * 0.1) * 0.1;

                const index = i * resolution + j;
                this.waterDisplacement[index] = tidalHeight.total + waveOffset;
            }
        }

        return this.waterDisplacement;
    }

    /**
     * Calculate ocean current velocity based on tidal forces
     * Simplified model: currents flow from high to low tide areas
     */
    calculateOceanCurrents(moonPosition, sunPosition, latitude, longitude) {
        // Calculate tidal gradient (change in tidal height)
        const delta = 0.1; // Small step for gradient calculation

        const heightCenter = this.calculateTidalBulgeHeight(
            latitude, longitude, moonPosition, sunPosition
        ).total;

        const heightEast = this.calculateTidalBulgeHeight(
            latitude, longitude + delta, moonPosition, sunPosition
        ).total;

        const heightNorth = this.calculateTidalBulgeHeight(
            latitude + delta, longitude, moonPosition, sunPosition
        ).total;

        // Gradient gives us the flow direction (water flows downhill)
        const gradientX = (heightEast - heightCenter) / delta;
        const gradientY = (heightNorth - heightCenter) / delta;

        // Current velocity is proportional to gradient
        const velocityScale = 0.5; // m/s per meter of height difference
        const velocity = {
            east: -gradientX * velocityScale,
            north: -gradientY * velocityScale,
            magnitude: Math.sqrt(gradientX * gradientX + gradientY * gradientY) * velocityScale
        };

        return velocity;
    }

    /**
     * Calculate Earth's rotation effect (Coriolis)
     */
    calculateCoriolisEffect(latitude, velocity) {
        const omega = 7.2921e-5; // Earth's angular velocity (rad/s)
        const latRad = latitude * Math.PI / 180;

        // Coriolis parameter
        const f = 2 * omega * Math.sin(latRad);

        return {
            deflection: f * velocity,
            direction: latitude > 0 ? 'right' : 'left' // Northern/Southern hemisphere
        };
    }

    /**
     * Calculate atmospheric pressure changes due to tidal forces
     * Atmospheric tides are much smaller than ocean tides
     */
    calculateAtmosphericTide(latitude, longitude, moonPosition, sunPosition) {
        const tidalHeight = this.calculateTidalBulgeHeight(
            latitude, longitude, moonPosition, sunPosition
        );

        // Atmospheric pressure change (very small, ~100 Pa)
        const pressureChange = tidalHeight.total * 20; // Pascals

        return {
            pressure: 101325 + pressureChange, // Standard pressure + change
            change: pressureChange
        };
    }

    /**
     * Calculate Roche limit (how close a body can get before tidal forces tear it apart)
     */
    calculateRocheLimit(primaryRadius, primaryDensity, secondaryDensity) {
        // Rigid body Roche limit
        return primaryRadius * 2.456 * Math.pow(primaryDensity / secondaryDensity, 1/3);
    }

    /**
     * Calculate tidal locking (synchronous rotation)
     * Returns time to tidal lock in years
     */
    calculateTidalLockingTime(satelliteRadius, orbitalRadius, planetMass) {
        // Simplified formula - actual calculation is complex
        const k2 = 0.3; // Love number (rigidity)
        const Q = 100; // Tidal dissipation factor

        // Very simplified estimate
        const lockingTime = (orbitalRadius ** 6) / (satelliteRadius ** 3 * planetMass);

        return lockingTime / (365.25 * 24 * 3600); // Convert to years
    }

    /**
     * Calculate Spring vs Neap tide strength
     */
    calculateTideStrength(moonPhase) {
        // Spring tides occur at new and full moon (0° and 180°)
        // Neap tides occur at quarter moons (90° and 270°)
        const phaseAngle = moonPhase * 360;

        // Strength varies sinusoidally
        const alignment = Math.cos(phaseAngle * Math.PI / 180);
        const baseStrength = 1.0;
        const variation = 0.4; // Spring tides are ~40% stronger than neaps

        return baseStrength + (alignment * variation);
    }

    /**
     * Simulate water movement over time
     */
    updateWaterSimulation(deltaTime, moonPosition, sunPosition, earthRotation) {
        // This would update a water simulation mesh in real-time
        // For now, we calculate the displacement map

        const currentTime = Date.now();
        const displacement = this.generateWaterDisplacement(
            moonPosition,
            sunPosition,
            currentTime
        );

        return {
            displacement: displacement,
            rotation: earthRotation,
            timestamp: currentTime
        };
    }

    /**
     * Calculate libration (wobble) of the Moon
     */
    calculateLunarLibration(time) {
        // Moon's libration allows us to see ~59% of its surface over time
        const T = time / (365.25 * 24 * 3600 * 1000); // Time in years

        return {
            longitude: 7.9 * Math.sin(2 * Math.PI * T * 12.37), // degrees
            latitude: 6.7 * Math.sin(2 * Math.PI * T * 12.37),  // degrees
            diurnal: 1.0 // Small daily wobble
        };
    }

    /**
     * Get tidal information for display
     */
    getTidalInfo(moonData, sunPosition) {
        if (!moonData) return null;

        const moonPos = {
            x: Math.cos(moonData.position.longitude * Math.PI / 180) * moonData.distance,
            y: 0,
            z: Math.sin(moonData.position.longitude * Math.PI / 180) * moonData.distance
        };

        const tidalForce = this.calculateTidalForce(
            moonPos,
            sunPosition || { x: 149600000, y: 0, z: 0 },
            this.config.celestialBodies.earth.radius
        );

        const tideStrength = this.calculateTideStrength(moonData.phase);

        return {
            force: tidalForce,
            strength: tideStrength,
            type: tideStrength > 1.2 ? 'Spring Tide' : tideStrength < 0.8 ? 'Neap Tide' : 'Normal Tide'
        };
    }
}

// Make available globally
window.CelestialMechanics = CelestialMechanics;
