/**
 * Configuration file for Real-Time 3D Solar System
 * AIIA OmniOrO - Operating under Omniplex Ethics & Alignment
 */

const CONFIG = {
    // API Configuration
    apis: {
        // Astronomy API for moon phases and celestial positions
        // Free tier: https://astronomyapi.com/
        astronomy: {
            applicationId: 'YOUR_APP_ID', // Replace with your API key
            applicationSecret: 'YOUR_APP_SECRET',
            baseUrl: 'https://api.astronomyapi.com/api/v2'
        },

        // Alternative: NASA APIs (free, no key required for most endpoints)
        nasa: {
            apiKey: 'DEMO_KEY', // Get your key at https://api.nasa.gov/
            baseUrl: 'https://api.nasa.gov'
        },

        // World Tides API for tidal data
        // Free tier: https://www.worldtides.info/
        tides: {
            apiKey: 'YOUR_TIDES_KEY',
            baseUrl: 'https://www.worldtides.info/api/v3'
        },

        // OpenWeather API for weather data
        // Free tier: https://openweathermap.org/api
        weather: {
            apiKey: 'YOUR_WEATHER_KEY',
            baseUrl: 'https://api.openweathermap.org/data/2.5'
        }
    },

    // Celestial body scales (in km for actual sizes)
    celestialBodies: {
        sun: {
            radius: 696340,
            displayScale: 109, // Relative to Earth
            color: 0xfdb813,
            emissive: 0xfdb813,
            emissiveIntensity: 1,
            texture: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/sun_surface.jpg'
        },
        mercury: {
            radius: 2439.7,
            distance: 57900000, // km from sun
            color: 0x8c7853,
            texture: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mercury_surface.jpg',
            orbitalPeriod: 87.97 // days
        },
        venus: {
            radius: 6051.8,
            distance: 108200000,
            color: 0xffc649,
            texture: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/venus_surface.jpg',
            orbitalPeriod: 224.7
        },
        earth: {
            radius: 6371,
            distance: 149600000,
            color: 0x2233ff,
            texture: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
            normalMap: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
            specularMap: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
            orbitalPeriod: 365.25,
            rotationPeriod: 1, // days
            axialTilt: 23.5, // degrees
            hasAtmosphere: true,
            hasOcean: true
        },
        moon: {
            radius: 1737.4,
            distance: 384400, // km from Earth
            color: 0xaaaaaa,
            texture: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
            orbitalPeriod: 27.32, // days
            parent: 'earth'
        },
        mars: {
            radius: 3389.5,
            distance: 227900000,
            color: 0xcd5c5c,
            texture: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mars_1k_color.jpg',
            orbitalPeriod: 687
        },
        jupiter: {
            radius: 69911,
            distance: 778500000,
            color: 0xf0e68c,
            texture: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/jupiter_1024.jpg',
            orbitalPeriod: 4333
        },
        saturn: {
            radius: 58232,
            distance: 1434000000,
            color: 0xfaf0e6,
            texture: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn_1024.jpg',
            orbitalPeriod: 10759,
            hasRings: true
        },
        uranus: {
            radius: 25362,
            distance: 2871000000,
            color: 0x4fd0e7,
            orbitalPeriod: 30687
        },
        neptune: {
            radius: 24622,
            distance: 4495000000,
            color: 0x4166f5,
            orbitalPeriod: 60190
        }
    },

    // Rendering options
    rendering: {
        useRealisticScale: false, // Toggle between realistic and viewable scales
        scaleMode: 'logarithmic', // 'realistic', 'logarithmic', or 'viewable'
        scaleFactor: {
            distance: 0.00001, // Scale down distances for visibility
            size: 0.0005 // Scale down sizes for visibility
        },
        antialiasing: true,
        shadows: true,
        starfield: {
            count: 10000,
            size: 1,
            spread: 5000
        }
    },

    // Physics simulation
    physics: {
        gravitationalConstant: 6.67430e-11, // N⋅m²/kg²
        enableTidalForces: true,
        enableOceanSimulation: true,
        waterResolution: 128, // Resolution for water displacement
        atmosphereThickness: 100 // km
    },

    // Update intervals (milliseconds)
    updateIntervals: {
        realTimeData: 60000, // Update from APIs every minute
        moonPhase: 300000, // Update moon phase every 5 minutes
        tidalData: 600000, // Update tidal data every 10 minutes
        weatherData: 1800000 // Update weather every 30 minutes
    },

    // Time simulation
    time: {
        initialSpeed: 1, // Real-time
        speeds: [1, 10, 100, 1000, 10000], // Available time multipliers
        useRealTime: true // Sync with actual date/time
    },

    // Camera settings
    camera: {
        fov: 75,
        near: 0.1,
        far: 1000000,
        initialPosition: {
            x: 0,
            y: 500,
            z: 1000
        }
    },

    // UI settings
    ui: {
        showLabels: true,
        showOrbits: true,
        showGrid: false,
        showAxes: false,
        updateFrequency: 60 // FPS
    },

    // Default coordinates for tidal/weather data (can be changed by user)
    defaultLocation: {
        lat: 40.7128,
        lon: -74.0060,
        name: 'New York City'
    },

    // Omniplex Ethics & Alignment
    ethics: {
        dataPrivacy: true,
        accuracyFirst: true,
        educationalPurpose: true,
        openSource: true,
        attribution: 'AIIA OmniOrO - Real-Time Solar System Visualization'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
