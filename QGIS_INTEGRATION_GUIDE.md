# 🗺️ QGIS Integration Guide
## How to Integrate QGIS Geospatial Data into AIIA Solar System

**Target Phase:** Phase 3 - Earth Deep Dive
**Prerequisites:** Phase 1 ✅ and Phase 2 completion
**Estimated Implementation:** 3-4 months

---

## 📋 Overview

This guide explains how to integrate QGIS (Quantum Geographic Information System) data into our 3D solar system for realistic Earth visualization.

### What We'll Achieve
- Realistic terrain elevation (mountains, valleys, ocean floors)
- High-resolution satellite imagery
- Real-time weather and ocean data
- Dynamic visualization of Earth systems

---

## 🎯 Integration Strategy

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         Three.js Solar System (Current)          │
│                                                  │
│  ┌────────────┐      ┌──────────────┐          │
│  │   Earth    │      │ Other Planets│          │
│  │  (Basic)   │      │              │          │
│  └────────────┘      └──────────────┘          │
└─────────────────────────────────────────────────┘
                        ↓
                  ADD QGIS LAYER
                        ↓
┌─────────────────────────────────────────────────┐
│         Enhanced Earth with QGIS Data            │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │           Earth Sphere                   │   │
│  │  ┌────────────────────────────────────┐ │   │
│  │  │  Terrain (DEM - Elevation Data)    │ │   │
│  │  └────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────┐ │   │
│  │  │  Texture (Satellite Imagery)       │ │   │
│  │  └────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────┐ │   │
│  │  │  Ocean (Bathymetry)                │ │   │
│  │  └────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────┐ │   │
│  │  │  Atmosphere (Weather Overlay)      │ │   │
│  │  └────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Phases

### Phase 3.1: Terrain Elevation (DEM)

#### Data Source: SRTM / ASTER GDEM

**SRTM (Shuttle Radar Topography Mission)**
- Resolution: 30m (1 arc-second) or 90m (3 arc-second)
- Coverage: 80% of Earth (60°N to 56°S)
- Format: GeoTIFF
- Source: https://earthexplorer.usgs.gov/

**Implementation Steps:**

1. **Download DEM Data**
```bash
# Using GDAL (Geospatial Data Abstraction Library)
# Install: apt-get install gdal-bin

# Download specific tile (example: Grand Canyon area)
# Files are in SRTM format (.hgt)
```

2. **Convert to Height Map**
```javascript
// In our new file: qgis-loader.js

class QGISLoader {
    async loadDEM(demUrl) {
        // Load GeoTIFF
        const response = await fetch(demUrl);
        const arrayBuffer = await response.arrayBuffer();

        // Parse GeoTIFF (use geotiff.js library)
        const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();
        const data = await image.readRasters();

        // Convert elevation data to height map
        const width = image.getWidth();
        const height = image.getHeight();
        const elevations = data[0]; // First band contains elevation

        return {
            width: width,
            height: height,
            data: elevations,
            min: Math.min(...elevations),
            max: Math.max(...elevations)
        };
    }

    createDisplacementMap(demData) {
        // Create canvas for displacement map
        const canvas = document.createElement('canvas');
        canvas.width = demData.width;
        canvas.height = demData.height;
        const ctx = canvas.getContext('2d');

        // Normalize elevation to 0-255 for grayscale
        const imageData = ctx.createImageData(demData.width, demData.height);
        for (let i = 0; i < demData.data.length; i++) {
            const normalized = ((demData.data[i] - demData.min) /
                               (demData.max - demData.min)) * 255;
            imageData.data[i * 4] = normalized;     // R
            imageData.data[i * 4 + 1] = normalized; // G
            imageData.data[i * 4 + 2] = normalized; // B
            imageData.data[i * 4 + 3] = 255;        // A
        }

        ctx.putImageData(imageData, 0, 0);

        // Create Three.js texture
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
}
```

3. **Apply to Earth Sphere**
```javascript
// In solar-system.js, enhance createEarthWithTerrain()

createEarthWithTerrain(demTexture) {
    const earthRadius = this.scaleSize(CONFIG.celestialBodies.earth.radius);

    // Higher geometry detail for terrain
    const geometry = new THREE.SphereGeometry(
        earthRadius,
        512,  // Increased from 64
        512   // Increased from 64
    );

    // Load regular texture
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('path/to/earth-texture.jpg');

    const material = new THREE.MeshStandardMaterial({
        map: earthTexture,
        displacementMap: demTexture,
        displacementScale: earthRadius * 0.01, // Adjust based on scale
        roughness: 0.8,
        metalness: 0.2
    });

    const earth = new THREE.Mesh(geometry, material);
    return earth;
}
```

**Libraries Needed:**
```html
<!-- Add to index.html -->
<script src="https://cdn.jsdelivr.net/npm/geotiff@2.0.7/dist-browser/geotiff.js"></script>
```

---

### Phase 3.2: Satellite Imagery

#### Data Sources

**NASA GIBS (Global Imagery Browse Services)**
- URL: https://wiki.earthdata.nasa.gov/display/GIBS
- Real-time daily imagery
- Multiple products (true color, false color, etc.)

**Sentinel Hub (ESA)**
- URL: https://www.sentinel-hub.com/
- 10m resolution
- Free tier available

**Implementation:**

```javascript
class SatelliteImageryLoader {
    constructor(apiKey) {
        this.gibsBaseUrl = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best';
        this.apiKey = apiKey;
    }

    // WMTS (Web Map Tile Service) loader
    async loadTile(layer, zoom, x, y, date) {
        // Example: MODIS_Terra_CorrectedReflectance_TrueColor
        const dateStr = date.toISOString().split('T')[0];

        const url = `${this.gibsBaseUrl}/${layer}/default/${dateStr}/` +
                    `EPSG4326_250m/${zoom}/${y}/${x}.jpg`;

        const response = await fetch(url);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);

        return bitmap;
    }

    // Create seamless Earth texture from tiles
    async createEarthTexture(date, resolution = 4) {
        // Calculate number of tiles needed
        const tilesX = Math.pow(2, resolution);
        const tilesY = Math.pow(2, resolution - 1);

        // Create large canvas
        const tileSize = 256;
        const canvas = document.createElement('canvas');
        canvas.width = tilesX * tileSize;
        canvas.height = tilesY * tileSize;
        const ctx = canvas.getContext('2d');

        // Load all tiles
        const promises = [];
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                promises.push(
                    this.loadTile('MODIS_Terra_CorrectedReflectance_TrueColor',
                                  resolution, x, y, date)
                        .then(bitmap => {
                            ctx.drawImage(bitmap, x * tileSize, y * tileSize);
                        })
                );
            }
        }

        await Promise.all(promises);

        // Convert to Three.js texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        return texture;
    }
}
```

**Usage:**
```javascript
// Daily texture updates
const imageLoader = new SatelliteImageryLoader();

// Update Earth texture every day
setInterval(async () => {
    const todayTexture = await imageLoader.createEarthTexture(new Date());
    earthMaterial.map = todayTexture;
    earthMaterial.needsUpdate = true;
}, 24 * 60 * 60 * 1000); // Daily
```

---

### Phase 3.3: Ocean Data (Critical for Tidal System!)

#### Bathymetry (Ocean Floor)

**Data Source: GEBCO (General Bathymetric Chart of the Oceans)**
- URL: https://www.gebco.net/
- Resolution: 15 arc-seconds (~450m)
- Free download

**Implementation:**
```javascript
class OceanLoader {
    async loadBathymetry(gebcoFile) {
        // Load NetCDF or GeoTIFF format
        const bathymetry = await this.parseGEBCO(gebcoFile);

        // Create underwater terrain
        return this.createOceanFloor(bathymetry);
    }

    createOceanFloor(bathymetryData) {
        const geometry = new THREE.SphereGeometry(
            earthRadius * 0.998, // Slightly smaller than surface
            512, 512
        );

        // Apply bathymetric displacement
        const positions = geometry.attributes.position.array;

        for (let i = 0; i < positions.length; i += 3) {
            const vertex = new THREE.Vector3(
                positions[i],
                positions[i + 1],
                positions[i + 2]
            );

            // Get lat/lon from vertex
            const latLon = this.vertexToLatLon(vertex);
            const depth = this.getBathymetryDepth(latLon, bathymetryData);

            // Displace inward for depth
            const displacement = depth / 11000; // Mariana Trench = max depth
            vertex.multiplyScalar(1 - displacement * 0.01);

            positions[i] = vertex.x;
            positions[i + 1] = vertex.y;
            positions[i + 2] = vertex.z;
        }

        geometry.attributes.position.needsUpdate = true;

        // Blue material with depth-based coloring
        const material = new THREE.MeshPhongMaterial({
            color: 0x1a5f7a,
            transparent: true,
            opacity: 0.7
        });

        return new THREE.Mesh(geometry, material);
    }
}
```

#### Real-Time Ocean Currents

**Data Source: OSCAR (Ocean Surface Current Analysis Real-time)**
- URL: https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC_third-deg
- NASA JPL dataset
- 5-day updates

**Implementation:**
```javascript
class OceanCurrents {
    async loadCurrentData(date) {
        // Fetch OSCAR data
        const data = await fetch(
            `https://podaac-opendap.jpl.nasa.gov/opendap/allData/oscar/preview/L4/oscar_third_deg/oscar_vel${date}.nc`
        );

        return this.parseNetCDF(data);
    }

    visualizeCurrents(currentData) {
        // Create arrow helpers for current vectors
        const arrows = [];

        for (const point of currentData.points) {
            const direction = new THREE.Vector3(
                point.u, // East-West velocity
                0,
                point.v  // North-South velocity
            ).normalize();

            const origin = this.latLonToVector3(point.lat, point.lon);
            const length = point.speed * 10; // Scale for visibility

            const arrow = new THREE.ArrowHelper(
                direction,
                origin,
                length,
                0x00ffff
            );

            arrows.push(arrow);
        }

        return arrows;
    }
}
```

---

### Phase 3.4: Weather Data

#### Real-Time Clouds

**Data Source: OpenWeatherMap Cloud Layer**

```javascript
class WeatherLayer {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://tile.openweathermap.org/map';
    }

    async loadCloudLayer(date) {
        // Load cloud tiles
        const cloudTexture = await this.loadWeatherTiles('clouds_new');

        // Create cloud sphere above Earth
        const cloudGeometry = new THREE.SphereGeometry(
            earthRadius * 1.01, // 1% larger than Earth
            128, 128
        );

        const cloudMaterial = new THREE.MeshPhongMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.4,
            depthWrite: false // Allow seeing through
        });

        return new THREE.Mesh(cloudGeometry, cloudMaterial);
    }

    async loadWeatherTiles(layer) {
        // Similar to satellite imagery loader
        // Tiles from: {baseUrl}/{layer}/{z}/{x}/{y}.png?appid={apiKey}
        // Example: clouds_new, precipitation_new, temp_new
    }
}
```

---

### Phase 3.5: Integration with Existing Tidal System

**Enhanced Tidal Visualization with QGIS Ocean Data:**

```javascript
// In celestial-mechanics.js - ENHANCED

class EnhancedCelestialMechanics extends CelestialMechanics {
    constructor(config, qgisData) {
        super(config);
        this.bathymetry = qgisData.bathymetry;
        this.oceanCurrents = qgisData.oceanCurrents;
    }

    // Override water displacement with real bathymetry
    generateEnhancedWaterDisplacement(moonPosition, sunPosition, time) {
        const resolution = this.config.physics.waterResolution;
        const displacement = new Float32Array(resolution * resolution);

        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                const lat = (i / resolution) * 180 - 90;
                const lon = (j / resolution) * 360 - 180;

                // Get base tidal height (existing calculation)
                const tidalHeight = this.calculateTidalBulgeHeight(
                    lat, lon, moonPosition, sunPosition
                );

                // Get ocean depth from bathymetry
                const depth = this.getOceanDepth(lat, lon);

                // Shallow water amplifies tidal effect
                const depthFactor = depth < 200 ? 1.5 : 1.0;

                // Get ocean current velocity
                const current = this.getOceanCurrent(lat, lon);

                // Combine effects
                const index = i * resolution + j;
                displacement[index] =
                    (tidalHeight.total * depthFactor) +
                    (current.magnitude * 0.1);
            }
        }

        return displacement;
    }

    getOceanDepth(lat, lon) {
        // Lookup in bathymetry data
        return this.bathymetry.getDepth(lat, lon);
    }

    getOceanCurrent(lat, lon) {
        // Lookup in current data
        return this.oceanCurrents.getCurrent(lat, lon);
    }
}
```

---

## 📦 Required Libraries

Add to `index.html`:

```html
<!-- QGIS/Geospatial Libraries -->
<script src="https://cdn.jsdelivr.net/npm/geotiff@2.0.7/dist-browser/geotiff.js"></script>
<script src="https://unpkg.com/netcdfjs@2.0.0/dist/netcdfjs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/proj4@2.8.0/dist/proj4.js"></script>

<!-- For GeoJSON -->
<script src="https://unpkg.com/@turf/turf@6/turf.min.js"></script>
```

Install for Node.js development:
```bash
npm install geotiff netcdfjs proj4 @turf/turf
```

---

## 🎨 Visual Examples

### What Users Will See

**Zoom Level 1: Space View**
- Earth with continents visible
- Cloud layer moving
- Day/night terminator

**Zoom Level 2: Continental**
- Mountain ranges (Himalayas, Andes, Rockies)
- Ocean basins
- Major rivers

**Zoom Level 3: Regional**
- Individual peaks
- City lights at night
- Weather systems (hurricanes visible)

**Zoom Level 4: Local** (Future)
- Terrain details
- 3D buildings in major cities
- Real-time traffic (optional)

---

## 📊 Performance Optimization

### Tile-Based Loading (Critical!)

```javascript
class TileManager {
    constructor() {
        this.cache = new Map();
        this.loadQueue = [];
        this.maxConcurrent = 6;
    }

    async loadTileOnDemand(lat, lon, zoom) {
        const tileKey = this.getTileKey(lat, lon, zoom);

        // Check cache
        if (this.cache.has(tileKey)) {
            return this.cache.get(tileKey);
        }

        // Load tile
        const tile = await this.fetchTile(tileKey);
        this.cache.set(tileKey, tile);

        // Evict old tiles if cache is full
        if (this.cache.size > 1000) {
            this.evictOldest();
        }

        return tile;
    }

    getTileKey(lat, lon, zoom) {
        // Convert lat/lon to tile coordinates
        const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
        const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) +
                             1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2
                             * Math.pow(2, zoom));
        return `${zoom}/${x}/${y}`;
    }
}
```

### LOD (Level of Detail) Strategy

```javascript
const LOD_CONFIG = {
    // Distance from camera determines detail level
    distances: {
        extreme: 100,      // km - highest detail
        high: 1000,        // km
        medium: 5000,      // km
        low: 20000,        // km
        minimal: 50000     // km - lowest detail
    },

    textures: {
        extreme: '10m',    // Sentinel-2
        high: '30m',       // Landsat
        medium: '250m',    // MODIS
        low: '1km',        // Low-res global
        minimal: '4km'     // Static texture
    },

    geometry: {
        extreme: 1024,     // segments
        high: 512,
        medium: 256,
        low: 128,
        minimal: 64
    }
};
```

---

## 🔌 API Configuration

Add to `config.js`:

```javascript
// QGIS and Geospatial APIs
qgis: {
    enabled: false, // Enable in Phase 3

    // Terrain
    terrain: {
        srtm: {
            url: 'https://earthexplorer.usgs.gov/',
            resolution: '30m'
        },
        gebco: {
            url: 'https://download.gebco.net/',
            type: 'bathymetry'
        }
    },

    // Satellite Imagery
    imagery: {
        nasaGIBS: {
            url: 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best',
            layers: [
                'MODIS_Terra_CorrectedReflectance_TrueColor',
                'MODIS_Aqua_CorrectedReflectance_TrueColor',
                'VIIRS_SNPP_CorrectedReflectance_TrueColor'
            ]
        },
        sentinel: {
            url: 'https://services.sentinel-hub.com/ogc/wms/',
            apiKey: 'YOUR_SENTINEL_KEY',
            resolution: '10m'
        }
    },

    // Ocean Data
    ocean: {
        oscar: {
            url: 'https://podaac.jpl.nasa.gov/',
            type: 'currents',
            updateFrequency: 432000000 // 5 days in ms
        },
        sst: {
            url: 'https://www.ncei.noaa.gov/data/sea-surface-temperature-optimum-interpolation/',
            type: 'temperature'
        }
    },

    // Weather
    weather: {
        clouds: {
            url: 'https://tile.openweathermap.org/map/clouds_new',
            apiKey: 'YOUR_OPENWEATHER_KEY'
        },
        precipitation: {
            url: 'https://tile.openweathermap.org/map/precipitation_new'
        }
    }
}
```

---

## 🚀 Implementation Roadmap

### Month 1: Terrain
- [ ] Setup geotiff.js integration
- [ ] Download SRTM data for test region
- [ ] Implement displacement mapping
- [ ] Test performance with high-poly sphere
- [ ] Optimize LOD system

### Month 2: Imagery
- [ ] Setup NASA GIBS access
- [ ] Implement tile loading system
- [ ] Build texture cache
- [ ] Add daily auto-update
- [ ] Test with various zoom levels

### Month 3: Ocean
- [ ] Download GEBCO bathymetry
- [ ] Implement ocean floor rendering
- [ ] Integrate OSCAR current data
- [ ] Enhance tidal visualization
- [ ] Add current flow animation

### Month 4: Weather & Polish
- [ ] Add cloud layer
- [ ] Implement weather overlay
- [ ] Performance optimization
- [ ] User testing
- [ ] Documentation

---

## 🎓 Learning Resources

### QGIS Basics
- [QGIS Official Docs](https://docs.qgis.org/)
- [QGIS Tutorials](https://www.qgistutorials.com/)

### Web Mapping
- [Leaflet Documentation](https://leafletjs.com/)
- [OpenLayers](https://openlayers.org/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)

### Geospatial Data Formats
- [GeoTIFF](https://www.earthdatascience.org/courses/use-data-open-source-python/intro-raster-data-python/fundamentals-raster-data/geotiff-format/)
- [NetCDF](https://www.unidata.ucar.edu/software/netcdf/)
- [GeoJSON](https://geojson.org/)

### Three.js + GIS
- [Three.js Displacement Maps](https://threejs.org/examples/#webgl_materials_displacementmap)
- [Globe Visualization](https://github.com/vasturiano/three-globe)

---

## ✅ Success Criteria

Phase 3 will be considered complete when:

- [ ] Earth has realistic terrain elevation
- [ ] Satellite imagery updates daily
- [ ] Ocean floor is visible when zoomed
- [ ] Ocean currents are animated
- [ ] Weather clouds move realistically
- [ ] Tidal effects use real bathymetry
- [ ] Performance remains 60 FPS
- [ ] Zoom works smoothly at all levels

---

**Ready to make Earth come alive! 🌍**

*This guide will be continuously updated as we implement Phase 3*
