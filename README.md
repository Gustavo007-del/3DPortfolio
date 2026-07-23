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
│  ├─ leva-test
│  │  └─ page.tsx
│  ├─ Nwisland
│  │  └─ page.tsx
│  ├─ page.tsx
│  └─ study
│     └─ page.tsx
├─ components
│  ├─ AnimationDebugger.tsx
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
│  ├─ effects
│  │  ├─ Nebula.tsx
│  │  └─ PostProcessing.tsx
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
│  │  └─ MoonOrbit.tsx
│  ├─ planets
│  │  ├─ Earth.tsx
│  │  ├─ Moon.tsx
│  │  ├─ OrbitRing.tsx
│  │  └─ Sun.tsx
│  ├─ Portfolio
│  │  ├─ CompassRose.tsx
│  │  ├─ ExplorerOverlay.module.css
│  │  ├─ ExplorerOverlay.tsx
│  │  ├─ fonts.ts
│  │  ├─ ScrollCameraRig.tsx
│  │  └─ useScrollProgress.ts
│  ├─ scene
│  │  ├─ SceneLights.tsx
│  │  └─ SolarSystem.tsx
│  ├─ sections
│  │  ├─ ContactSection.tsx
│  │  ├─ ProjectsSection.tsx
│  │  ├─ SkillsSection.tsx
│  │  ├─ StatsSection.tsx
│  │  ├─ TestimonialsSection.tsx
│  │  └─ TimelineSection.tsx
│  ├─ stars
│  │  └─ StarField.tsx
│  └─ StudyCards.tsx
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
