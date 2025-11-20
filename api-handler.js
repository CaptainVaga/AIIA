/**
 * API Handler for Real-Time Data
 * Fetches data from various astronomical, tidal, and weather APIs
 */

class APIHandler {
    constructor(config) {
        this.config = config;
        this.cache = {
            moonPhase: null,
            tidalData: null,
            weatherData: null,
            lastUpdate: {}
        };
        this.updateIntervals = {};
    }

    /**
     * Initialize all API connections and start update intervals
     */
    async initialize() {
        console.log('🛰️ Initializing API connections...');

        // Initial data fetch
        await this.updateAllData();

        // Set up periodic updates
        this.updateIntervals.moonPhase = setInterval(
            () => this.updateMoonData(),
            this.config.updateIntervals.moonPhase
        );

        this.updateIntervals.tidal = setInterval(
            () => this.updateTidalData(),
            this.config.updateIntervals.tidalData
        );

        this.updateIntervals.weather = setInterval(
            () => this.updateWeatherData(),
            this.config.updateIntervals.weatherData
        );

        console.log('✅ API Handler initialized');
    }

    /**
     * Update all data sources
     */
    async updateAllData() {
        await Promise.all([
            this.updateMoonData(),
            this.updateTidalData(),
            this.updateWeatherData()
        ]);
    }

    /**
     * Get current moon phase and position using astronomical calculations
     */
    async updateMoonData() {
        try {
            const now = new Date();
            const moonData = this.calculateMoonPhase(now);

            this.cache.moonPhase = {
                phase: moonData.phase,
                phaseName: moonData.phaseName,
                illumination: moonData.illumination,
                age: moonData.age,
                distance: moonData.distance,
                position: moonData.position,
                nextFullMoon: moonData.nextFullMoon,
                nextNewMoon: moonData.nextNewMoon,
                timestamp: now
            };

            this.cache.lastUpdate.moonPhase = now;
            this.updateStatus('astronomy', true);

            return this.cache.moonPhase;
        } catch (error) {
            console.error('❌ Error updating moon data:', error);
            this.updateStatus('astronomy', false);
            return null;
        }
    }

    /**
     * Calculate moon phase using astronomical formulas
     * Based on Jean Meeus algorithms
     */
    calculateMoonPhase(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // Julian Day calculation
        let a = Math.floor((14 - month) / 12);
        let y = year + 4800 - a;
        let m = month + 12 * a - 3;
        let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y +
                 Math.floor(y / 4) - Math.floor(y / 100) +
                 Math.floor(y / 400) - 32045;

        // Days since known new moon (Jan 6, 2000)
        const daysSinceNew = jd - 2451550.1;
        const newMoons = daysSinceNew / 29.53058867;
        const phase = (newMoons % 1);

        // Moon age in days
        const age = phase * 29.53058867;

        // Illumination percentage
        const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100;

        // Phase name
        let phaseName;
        if (illumination < 5) phaseName = 'New Moon';
        else if (illumination < 45) phaseName = 'Waxing Crescent';
        else if (illumination < 55) phaseName = 'First Quarter';
        else if (illumination < 95) phaseName = 'Waxing Gibbous';
        else if (illumination > 95 && illumination <= 100) phaseName = 'Full Moon';
        else if (illumination > 55) phaseName = 'Waning Gibbous';
        else if (illumination > 45) phaseName = 'Last Quarter';
        else phaseName = 'Waning Crescent';

        // Calculate moon distance (average ± variation)
        const distanceVariation = Math.sin(phase * 2 * Math.PI) * 21000;
        const distance = 384400 + distanceVariation; // km

        // Calculate next full and new moons
        const daysToFullMoon = ((0.5 - phase + 1) % 1) * 29.53;
        const daysToNewMoon = ((1 - phase) % 1) * 29.53;

        const nextFullMoon = new Date(date.getTime() + daysToFullMoon * 24 * 60 * 60 * 1000);
        const nextNewMoon = new Date(date.getTime() + daysToNewMoon * 24 * 60 * 60 * 1000);

        // Approximate position (simplified)
        const moonLongitude = (phase * 360) % 360;

        return {
            phase: phase,
            phaseName: phaseName,
            illumination: illumination.toFixed(1),
            age: age.toFixed(1),
            distance: distance.toFixed(0),
            position: {
                longitude: moonLongitude,
                latitude: 0 // Simplified
            },
            nextFullMoon: nextFullMoon,
            nextNewMoon: nextNewMoon
        };
    }

    /**
     * Calculate tidal forces based on moon and sun positions
     */
    async updateTidalData() {
        try {
            const moonData = this.cache.moonPhase || await this.updateMoonData();

            // Calculate tidal force based on moon distance and phase
            const distance = parseFloat(moonData.distance);
            const baseTidalForce = 1 / Math.pow(distance / 384400, 3);

            // Solar contribution (about 46% of lunar effect)
            const solarTidalForce = baseTidalForce * 0.46;
            const totalTidalForce = baseTidalForce + solarTidalForce;

            // Determine tide type
            let tideType;
            const illumination = parseFloat(moonData.illumination);
            if (illumination > 95 || illumination < 5) {
                tideType = 'Spring Tide'; // New or Full moon
            } else if (illumination > 45 && illumination < 55) {
                tideType = 'Neap Tide'; // Quarter moons
            } else {
                tideType = 'Normal Tide';
            }

            // Estimate next high/low tide (simplified)
            const now = new Date();
            const hoursToNextTide = (6.2 - (now.getHours() % 6.2));
            const nextTideTime = new Date(now.getTime() + hoursToNextTide * 60 * 60 * 1000);

            this.cache.tidalData = {
                force: totalTidalForce,
                type: tideType,
                nextTide: nextTideTime,
                highTide: hoursToNextTide < 3,
                moonInfluence: baseTidalForce,
                sunInfluence: solarTidalForce,
                timestamp: now
            };

            this.cache.lastUpdate.tidal = now;
            this.updateStatus('tidal', true);

            return this.cache.tidalData;
        } catch (error) {
            console.error('❌ Error updating tidal data:', error);
            this.updateStatus('tidal', false);
            return null;
        }
    }

    /**
     * Update weather data (placeholder for real API integration)
     */
    async updateWeatherData() {
        try {
            // This is a placeholder - in production, you would call a real weather API
            // Example: OpenWeatherMap, WeatherAPI, etc.

            this.cache.weatherData = {
                temperature: 20 + Math.random() * 10,
                humidity: 50 + Math.random() * 30,
                pressure: 1013 + (Math.random() - 0.5) * 20,
                windSpeed: Math.random() * 20,
                cloudCover: Math.random() * 100,
                timestamp: new Date()
            };

            this.cache.lastUpdate.weather = new Date();
            this.updateStatus('weather', true);

            return this.cache.weatherData;
        } catch (error) {
            console.error('❌ Error updating weather data:', error);
            this.updateStatus('weather', false);
            return null;
        }
    }

    /**
     * Get planetary positions using Keplerian orbital elements
     * This is a simplified calculation - for production, use JPL HORIZONS or similar
     */
    calculatePlanetaryPositions(date) {
        const positions = {};
        const julianDate = this.dateToJulianDate(date);
        const T = (julianDate - 2451545.0) / 36525; // Julian centuries since J2000

        // Simplified orbital calculations for each planet
        Object.keys(this.config.celestialBodies).forEach(body => {
            const bodyData = this.config.celestialBodies[body];
            if (bodyData.orbitalPeriod && body !== 'moon' && body !== 'sun') {
                const meanAnomaly = (2 * Math.PI * (julianDate % bodyData.orbitalPeriod)) / bodyData.orbitalPeriod;
                const distance = bodyData.distance;

                positions[body] = {
                    x: distance * Math.cos(meanAnomaly),
                    y: 0,
                    z: distance * Math.sin(meanAnomaly),
                    angle: meanAnomaly
                };
            }
        });

        return positions;
    }

    /**
     * Convert date to Julian Date
     */
    dateToJulianDate(date) {
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const d = date.getDate();
        const h = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

        let a = Math.floor((14 - m) / 12);
        let y2 = y + 4800 - a;
        let m2 = m + 12 * a - 3;

        let jdn = d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 +
                  Math.floor(y2 / 4) - Math.floor(y2 / 100) +
                  Math.floor(y2 / 400) - 32045;

        return jdn + (h - 12) / 24;
    }

    /**
     * Update UI status indicators
     */
    updateStatus(apiName, connected) {
        const statusElement = document.getElementById(`${apiName}-status`);
        if (statusElement) {
            statusElement.textContent = connected ? '🟢' : '🔴';
            statusElement.className = 'status-indicator ' + (connected ? 'connected' : 'error');
        }
    }

    /**
     * Get cached data
     */
    getData(type) {
        return this.cache[type];
    }

    /**
     * Clean up intervals
     */
    destroy() {
        Object.values(this.updateIntervals).forEach(interval => {
            clearInterval(interval);
        });
    }
}

// Make available globally
window.APIHandler = APIHandler;
