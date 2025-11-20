# 🌌 AIIA Real-Time 3D Solar System

**OmniOrO - Operating under Omniplex Ethics & Alignment**

A comprehensive, interactive 3D visualization of our solar system with real-time astronomical data, focusing on lunar cycles, tidal effects, atmospheric conditions, and water movement dynamics.

![Version](https://img.shields.io/badge/version-1.0.0--phase1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Phase%201-orange)

## 🌟 Features

### Phase 1 (Current)

- **Real-Time Astronomical Data Integration**
  - Live moon phase tracking and position calculation
  - Accurate planetary orbital mechanics
  - Tidal force calculations based on lunar and solar positions
  - Continuous data updates from astronomical APIs

- **Moon Cycle & Tidal Effects** 🌙
  - Precise moon phase visualization
  - Real-time tidal force calculations
  - Spring and neap tide predictions
  - Tidal bulge height modeling
  - Water displacement mapping based on gravitational forces

- **Earth Systems Simulation** 🌍
  - Atmosphere layer with transparency effects
  - Ocean water simulation with tidal deformation
  - Weather data integration (temperature, pressure, wind)
  - Earth's axial tilt and rotation visualization

- **Water Movement Dynamics** 💧
  - Real-time water displacement based on moon position
  - Ocean current calculations
  - Coriolis effect simulation
  - Tidal gradient modeling

- **Interactive 3D Visualization**
  - Full-screen space view with zoom capabilities
  - Three viewing modes: Full System, Earth-Moon, Earth Close-up
  - Realistic scale mode with toggleable viewing scales
  - Orbit visualization for all celestial bodies
  - Real planetary textures from NASA

- **Advanced Physics**
  - Gravitational force calculations
  - Tidal force modeling (lunar + solar)
  - Orbital mechanics using Keplerian elements
  - Earth rotation and axial tilt physics

- **User Controls**
  - Interactive camera controls (orbit, pan, zoom)
  - Time speed adjustment (1x, 10x, 100x, 1000x)
  - Toggle between scale modes (realistic, logarithmic, viewable)
  - Show/hide celestial labels
  - Fullscreen mode support

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Optional: API keys for enhanced real-time data (see API Configuration)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/CaptainVaga/AIIA.git
   cd AIIA
   ```

2. **Open in browser**
   - Simply open `index.html` in your web browser
   - No build process or server required!

3. **Optional: Configure API keys**
   - Edit `config.js` and add your API keys (see API Configuration section)

### Running the Application

```bash
# Option 1: Direct file access
open index.html

# Option 2: Use a local server (recommended)
python -m http.server 8000
# Then navigate to http://localhost:8000

# Option 3: Use Node.js
npx http-server
```

## 📁 Project Structure

```
AIIA/
├── index.html              # Main HTML file
├── styles.css              # Styling and UI design
├── config.js               # Configuration and API keys
├── api-handler.js          # Real-time data API integration
├── celestial-mechanics.js  # Physics calculations
├── solar-system.js         # 3D rendering and visualization
├── app.js                  # Main application controller
├── README.md              # This file
└── We333 *.docx           # Omniplex Ethics protocols
```

## 🔧 Configuration

### API Configuration

The application uses several APIs for real-time data. Edit `config.js` to add your API keys:

#### 1. Astronomy API (Moon Phases & Positions)
```javascript
astronomy: {
    applicationId: 'YOUR_APP_ID',
    applicationSecret: 'YOUR_APP_SECRET',
    baseUrl: 'https://api.astronomyapi.com/api/v2'
}
```
- Free tier available at: https://astronomyapi.com/
- Features: Moon phases, lunar positions, astronomical events

#### 2. NASA APIs (Free)
```javascript
nasa: {
    apiKey: 'DEMO_KEY', // Get your key at https://api.nasa.gov/
    baseUrl: 'https://api.nasa.gov'
}
```
- Free API key at: https://api.nasa.gov/
- Features: Planetary imagery, astronomical data, APOD

#### 3. World Tides API (Tidal Data)
```javascript
tides: {
    apiKey: 'YOUR_TIDES_KEY',
    baseUrl: 'https://www.worldtides.info/api/v3'
}
```
- Free tier available at: https://www.worldtides.info/
- Features: Tidal predictions, high/low tide times

#### 4. OpenWeather API (Weather Data)
```javascript
weather: {
    apiKey: 'YOUR_WEATHER_KEY',
    baseUrl: 'https://api.openweathermap.org/data/2.5'
}
```
- Free tier available at: https://openweathermap.org/api
- Features: Weather conditions, temperature, pressure

**Note:** The application works without API keys using built-in astronomical calculations, but real-time data enhances accuracy.

## 🎮 Controls & Interaction

### Mouse Controls
- **Left Click + Drag**: Rotate camera around the solar system
- **Right Click + Drag**: Pan camera
- **Scroll Wheel**: Zoom in/out

### UI Controls

#### View Presets
- **Full System**: Overview of entire solar system
- **Earth-Moon**: Focus on Earth-Moon system
- **Earth Close-up**: Detailed Earth view with atmosphere and oceans

#### Time Controls
- **1x**: Real-time speed
- **10x**: 10x faster
- **100x**: 100x faster (see daily changes)
- **1000x**: 1000x faster (see monthly changes)

#### Display Options
- **Toggle Scale Mode**: Switch between realistic, logarithmic, and viewable scales
- **Toggle Labels**: Show/hide celestial body names
- **Fullscreen**: Enter/exit fullscreen mode

### Keyboard Shortcuts (Future Enhancement)
_Coming in Phase 2_

## 📊 Real-Time Data Display

The control panel shows:

### 🌙 Moon Status
- Current phase (New, Waxing Crescent, First Quarter, etc.)
- Illumination percentage
- Distance from Earth (km)
- Moon age (days since new moon)

### 🌊 Tidal Effects
- Tide type (Spring, Neap, Normal)
- Time until next high/low tide
- Tidal force strength

### 🌍 Earth Status
- Current rotation angle
- Axial tilt (23.5°)
- Day/night cycle

### 📡 API Status
- Real-time connection indicators
- 🟢 Connected | 🔴 Disconnected

## 🔬 Physics & Calculations

### Gravitational Forces
The application uses Newton's law of universal gravitation:

```
F = G × (m₁ × m₂) / r²
```

Where:
- `G` = 6.67430×10⁻¹¹ N⋅m²/kg² (gravitational constant)
- `m₁, m₂` = masses of celestial bodies
- `r` = distance between bodies

### Tidal Forces
Tidal forces are calculated using:

```
F_tidal = 2 × G × M × R / r³
```

Where:
- `M` = mass of attracting body (Moon or Sun)
- `R` = Earth's radius
- `r` = distance to attracting body

### Moon Phase Calculation
Uses Jean Meeus astronomical algorithms:

1. Calculate Julian Date
2. Compute days since known new moon (J2000.0)
3. Calculate lunar cycle position
4. Determine illumination percentage
5. Identify phase name

### Orbital Mechanics
Simplified Keplerian orbital elements:

```
Mean Anomaly = 2π × (time mod orbital_period) / orbital_period
Position = distance × [cos(M), 0, sin(M)]
```

## 🎨 Visualization Features

### Scale Modes

1. **Viewable Mode** (Default)
   - Optimized for visibility and interaction
   - Logarithmic distance scaling
   - Enhanced planet sizes

2. **Logarithmic Mode**
   - Logarithmic scaling for both size and distance
   - Better representation of vast distances
   - Maintains visual hierarchy

3. **Realistic Mode**
   - True-to-scale sizes and distances
   - Educational but challenging to navigate
   - Demonstrates actual cosmic scale

### Visual Effects

- **Starfield Background**: 10,000 stars with color variation
- **Dynamic Lighting**: Sun as primary light source
- **Planetary Textures**: High-resolution NASA imagery
- **Atmospheric Glow**: Earth's atmosphere layer
- **Ocean Rendering**: Specular water with tidal deformation
- **Orbital Paths**: Visualized orbits for all planets
- **Saturn's Rings**: Accurate ring system visualization

## 🔐 Omniplex Ethics & Alignment

This project operates under the We333 protocols, emphasizing:

- **Data Privacy**: No user data collection
- **Accuracy First**: Scientific accuracy in all calculations
- **Educational Purpose**: Open-source and freely accessible
- **Attribution**: Proper credit to data sources
- **Safety**: No harmful or misleading information

See the We333 protocol documents for full ethical guidelines.

## 🛠️ Technical Stack

### Core Technologies
- **Three.js** (r128): 3D rendering engine
- **JavaScript ES6+**: Application logic
- **HTML5 Canvas**: Rendering surface
- **CSS3**: UI styling with glassmorphism effects

### APIs & Data Sources
- Astronomy API: Moon phases and positions
- NASA APIs: Planetary data and imagery
- World Tides API: Tidal predictions
- OpenWeather API: Weather data

### Algorithms & Methods
- Jean Meeus astronomical algorithms
- Keplerian orbital mechanics
- Newton's gravitational laws
- Tidal force calculations
- Julian Date conversions

## 📈 Performance

### Optimization Features
- Efficient geometry reuse
- Texture caching
- Level-of-detail rendering
- RequestAnimationFrame for smooth 60 FPS
- Minimal DOM manipulation

### System Requirements
- **Minimum**: Dual-core processor, 4GB RAM, WebGL-capable GPU
- **Recommended**: Quad-core processor, 8GB RAM, dedicated GPU
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## 🗺️ Roadmap

### Phase 1 (Current) ✅
- [x] Real-time solar system visualization
- [x] Moon cycle and tidal effects
- [x] Earth atmosphere and oceans
- [x] Water movement simulation
- [x] Interactive controls
- [x] To-scale representation
- [x] Real imagery integration

### Phase 2 (Planned)
- [ ] Additional moons for Jupiter, Saturn
- [ ] Asteroid belt visualization
- [ ] Comet tracking
- [ ] Solar flares and space weather
- [ ] Real-time satellite tracking
- [ ] Enhanced weather patterns
- [ ] Aurora borealis simulation
- [ ] Eclipses prediction and visualization

### Phase 3 (Future)
- [ ] Beyond solar system (nearby stars)
- [ ] Exoplanet integration
- [ ] Time-lapse recording
- [ ] VR/AR support
- [ ] Mobile app version
- [ ] Educational modules
- [ ] Multiplayer observation mode

## 🐛 Known Issues

### Phase 1
- Texture loading may be slow on first load (cached afterwards)
- Water displacement is simplified (performance trade-off)
- Some API calls may fail without keys (fallback to calculations)
- Realistic scale mode is difficult to navigate (by design)

## 🤝 Contributing

We welcome contributions! This project follows Omniplex Ethics principles.

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Comment complex physics calculations
- Test across multiple browsers
- Maintain 60 FPS performance
- Respect Omniplex Ethics principles

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **NASA**: Planetary textures and astronomical data
- **Three.js**: Amazing 3D rendering library
- **Astronomy APIs**: Real-time celestial data
- **Jean Meeus**: Astronomical algorithms
- **We333 Protocols**: Ethical framework
- **Open Source Community**: Continuous inspiration

## 📧 Contact & Support

- **Project Lead**: CaptainVaga
- **Repository**: https://github.com/CaptainVaga/AIIA
- **Issues**: https://github.com/CaptainVaga/AIIA/issues

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

## 📚 Additional Resources

### Learning Resources
- [Three.js Documentation](https://threejs.org/docs/)
- [Orbital Mechanics Basics](https://en.wikipedia.org/wiki/Orbital_mechanics)
- [Tidal Forces Explained](https://en.wikipedia.org/wiki/Tidal_force)
- [Moon Phases](https://en.wikipedia.org/wiki/Lunar_phase)

### Data Sources
- [NASA Open Data](https://data.nasa.gov/)
- [JPL Horizons](https://ssd.jpl.nasa.gov/horizons.cgi)
- [USNO Astronomical Data](https://aa.usno.navy.mil/)

---

**Built with 💙 for space enthusiasts and learners everywhere**

*"The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself."* - Carl Sagan

---

## Version History

### v1.0.0-phase1 (Current)
- Initial release
- Real-time solar system visualization
- Moon cycle tracking
- Tidal effect simulation
- Earth atmosphere and ocean
- Interactive 3D controls
- Multiple viewing modes
- Real-time data integration
