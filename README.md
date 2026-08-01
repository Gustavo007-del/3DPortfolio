# Shijil 3D Portfolio

## Stack (2026 Industry Standard)
- Next.js 16.1 (Turbopack)
- React 19.2
- @react-three/fiber v9 (React 19 compatible)
- @react-three/drei v9.116
- Three.js 0.174
- Framer Motion 12
- Tailwind CSS 3.4
- TypeScript 5.4

## Setup
```bash
npm install --legacy-peer-deps
```

## Add your avatar
Put `avatar.glb` in `public/models/`

## Run
```bash
npm run dev
```
Open http://localhost:3000

## Avatar interactions
- Mouse move → head + arms follow
- Fast mouse move → avatar walks
- Hover avatar → scales up



```
3DPortfolio
├─ .dist
├─ app
│  ├─ animate
│  │  └─ page.tsx
│  ├─ globals.css
│  ├─ island
│  │  └─ page.tsx
│  ├─ leva-test
│  │  └─ page.tsx
│  ├─ Nwisland
│  │  └─ page.tsx
│  ├─ page.tsx
│  └─ study
│     └─ page.tsx
├─ components
│  ├─ AnimationDebugger.tsx
│  ├─ Audio
│  │  ├─ AudioButton.tsx
│  │  ├─ AudioController.tsx
│  │  ├─ AudioDebug.tsx
│  │  ├─ audioDefaults.ts
│  │  ├─ AudioManager.ts
│  │  ├─ AudioMixer.ts
│  │  ├─ AudioProvider.tsx
│  │  ├─ AudioSettings.ts
│  │  ├─ audioTypes.ts
│  │  └─ AudioZone.tsx
│  ├─ Avatar.tsx
│  ├─ AvatarCanvas.tsx
│  ├─ birds
│  │  ├─ BirdController.tsx
│  │  ├─ BirdDebug.tsx
│  │  ├─ BirdField.tsx
│  │  ├─ BirdGeometry.ts
│  │  ├─ BirdMaterial.ts
│  │  └─ birdTypes.ts
│  ├─ CameraController.tsx
│  ├─ CameraInspector.tsx
│  ├─ canvas
│  │  ├─ IslandPrewarm.tsx
│  │  ├─ WorldCamera.tsx
│  │  └─ WorldInput.tsx
│  ├─ each-frame
│  │  └─ WorldLOD.tsx
│  ├─ effects
│  │  ├─ Nebula.tsx
│  │  └─ PostProcessing.tsx
│  ├─ Environment
│  │  └─ ParticleEngine
│  │     ├─ ParticleController.tsx
│  │     ├─ ParticleDebug.tsx
│  │     ├─ particleDefaults.ts
│  │     ├─ ParticleEmitter.tsx
│  │     ├─ ParticleEngine.tsx
│  │     ├─ ParticleField.tsx
│  │     ├─ ParticleMaterial.ts
│  │     ├─ particleMath.ts
│  │     ├─ ParticleRenderer.tsx
│  │     ├─ ParticleTrigger.tsx
│  │     └─ particleTypes.ts
│  ├─ ExampleAnimationScenarios.tsx
│  ├─ fire
│  │  ├─ CloudLayer.tsx
│  │  ├─ Firefly.tsx
│  │  ├─ FireflyController.tsx
│  │  ├─ FireflyField.tsx
│  │  ├─ FireflyMaterial.ts
│  │  ├─ Mist.tsx
│  │  ├─ MistController.tsx
│  │  ├─ MistMaterial.ts
│  │  ├─ ParticleSystem.tsx
│  │  ├─ Torch.tsx
│  │  ├─ TorchController.tsx
│  │  └─ WindContext.tsx
│  ├─ HeroSection.tsx
│  ├─ Island
│  │  ├─ AudioZones.tsx
│  │  ├─ CameraDebugPanel.tsx
│  │  ├─ GradientSkyController.tsx
│  │  ├─ IslandScene.tsx
│  │  ├─ LightController.tsx
│  │  ├─ LightDebugHelper.tsx
│  │  ├─ MountainController.tsx
│  │  ├─ OppositeLightController.tsx
│  │  ├─ PostProcessingController.tsx
│  │  ├─ SceneAtmosphereController.tsx
│  │  ├─ SkyController.tsx
│  │  ├─ WaterPlane.tsx
│  │  └─ WaterPlaneController.tsx
│  ├─ Journey
│  │  ├─ CameraDebug.tsx
│  │  ├─ cameraHelpers.ts
│  │  ├─ ChapterPanel.tsx
│  │  ├─ JourneyCamera.tsx
│  │  ├─ JourneyDirector.tsx
│  │  ├─ JourneyProvider.tsx
│  │  └─ JourneyUI.tsx
│  ├─ NavBar.tsx
│  ├─ orbits
│  │  ├─ EarthOrbit.tsx
│  │  ├─ MoonOrbit.tsx
│  │  └─ PlanetOrbit.tsx
│  ├─ planets
│  │  ├─ AsteroidBelt.tsx
│  │  ├─ Earth.tsx
│  │  ├─ Jupiter.tsx
│  │  ├─ Mars.tsx
│  │  ├─ Mercury.tsx
│  │  ├─ Moon.tsx
│  │  ├─ OrbitRing.tsx
│  │  ├─ Saturn.tsx
│  │  ├─ Sun.tsx
│  │  └─ Venus.tsx
│  ├─ Portfolio
│  │  ├─ CompassRose.tsx
│  │  ├─ ExplorerOverlay.module.css
│  │  ├─ ExplorerOverlay.tsx
│  │  ├─ fonts.ts
│  │  ├─ ScrollCameraRig.tsx
│  │  └─ useScrollProgress.ts
│  ├─ scene
│  │  ├─ LoadingScreen.tsx
│  │  ├─ LoadingTracker.tsx
│  │  ├─ PlanetLabel.tsx
│  │  ├─ SceneLights.tsx
│  │  ├─ SolarSystem.tsx
│  │  └─ SpaceOverlay.tsx
│  ├─ sections
│  │  ├─ ContactSection.tsx
│  │  ├─ ProjectsSection.tsx
│  │  ├─ SkillsSection.tsx
│  │  ├─ StatsSection.tsx
│  │  ├─ TestimonialsSection.tsx
│  │  └─ TimelineSection.tsx
│  ├─ stars
│  │  └─ StarField.tsx
│  ├─ StudyCards.tsx
│  ├─ systems
│  │  ├─ TransitionFade.tsx
│  │  └─ WorldDebug.tsx
│  └─ World
│     ├─ Transition
│     │  ├─ CloudField.tsx
│     │  ├─ CloudMaterial.ts
│     │  ├─ CloudTransition.tsx
│     │  ├─ CloudVeil.tsx
│     │  ├─ CloudVeilMaterial.ts
│     │  └─ TransitionManager.tsx
│     ├─ WorldManager.tsx
│     ├─ WorldState.tsx
│     └─ WorldTimeline.ts
├─ config
│  └─ colors.ts
├─ hooks
│  ├─ useAvatarController.ts
│  └─ useWind.tsx
├─ lib
│  ├─ camera.ts
│  ├─ journey.ts
│  ├─ JourneyTransition.ts
│  ├─ portfolioData.ts
│  └─ ui.ts
├─ next.config.mjs
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ public
│  ├─ astronaut.glb
│  ├─ audio
│  │  ├─ bell.mp3
│  │  ├─ birds.mp3
│  │  ├─ click.mp3
│  │  ├─ fire.mp3
│  │  ├─ hover.mp3
│  │  ├─ insects.mp3
│  │  ├─ sea2.mp3
│  │  └─ wind.mp3
│  ├─ hdr
│  │  └─ qwantani_dusk_2_1k.hdr
│  ├─ models
│  │  ├─ avatar.glb
│  │  ├─ car.blend
│  │  ├─ car.glb
│  │  ├─ mountain.glb
│  │  ├─ README.md
│  │  └─ shiba.glb
│  └─ textures
│     ├─ earth.png
│     ├─ moon.png
│     └─ sun.png
├─ README.md
├─ tailwind.config.ts
└─ tsconfig.json

```