// components/scene/SolarSystem.tsx
"use client";

import { useRef } from "react";
import { Mesh } from "three";
import SceneLights from "./SceneLights";
import Sun from "../planets/Sun";
import ClickablePlanet from "../planets/ClickablePlanet";
import DraggablePlanet from "../planets/DraggablePlanet";
import OrbitRing from "../planets/OrbitRing";
import EarthOrbit from "../orbits/EarthOrbit";
import PostProcessing from "../effects/PostProcessing";
import StarField from "../stars/StarField";
import Nebula from "../effects/Nebula";
import PlanetOrbit from "../orbits/PlanetOrbit";
import Mercury from "../planets/Mercury";
import Venus from "../planets/Venus";
import Mars from "../planets/Mars";
import Jupiter from "../planets/Jupiter";
import Saturn from "../planets/Saturn";
import AsteroidBelt from "../planets/AsteroidBelt";
import Atmosphere from "../planets/Atmosphere";
import AlienShuttle from "../effects/AlienShuttle"; 

export default function SolarSystem({ active = true }: { active?: boolean }) {
  const sunRef = useRef<Mesh>(null);

  return (
    <>
      <SceneLights />
      {active && <PostProcessing sunRef={sunRef} />}
      <Sun ref={sunRef} />

      <OrbitRing radius={4} color="#9a9a9a" />
      <PlanetOrbit radius={4} speed={0.6}>
        <DraggablePlanet>
        <ClickablePlanet name="Mercury">
        <Mercury />
        </ClickablePlanet>
        </DraggablePlanet>
      </PlanetOrbit>

      <OrbitRing radius={6} color="#e6d7a3" />
      <PlanetOrbit radius={6} speed={0.35} offset={1.2}>
        <ClickablePlanet name="Venus">
          <DraggablePlanet>
            <Venus />
            <Atmosphere radius={0.9} color="#f0d9a0" intensity={0.6} scale={1.1} />
            </DraggablePlanet>
        </ClickablePlanet>
      </PlanetOrbit>

      
      <OrbitRing radius={8} color="#6ab8ff" />
      <ClickablePlanet name="Earth">
          <DraggablePlanet>
          <EarthOrbit />
        </DraggablePlanet>
     </ClickablePlanet>
      <OrbitRing radius={11} color="#c1440e" />
      <PlanetOrbit radius={11} speed={0.22} offset={2.5}>
        <ClickablePlanet name="Mars">
          <DraggablePlanet>
            <Mars />
            <Atmosphere radius={0.7} color="#e08a5a" intensity={0.35} scale={1.08} />
        </DraggablePlanet>
        </ClickablePlanet>
      </PlanetOrbit>

      <AsteroidBelt innerRadius={13} outerRadius={16} count={350} />

      <OrbitRing radius={19} color="#d4a574" />
      <PlanetOrbit radius={19} speed={0.12} offset={4}>
        
        <ClickablePlanet name="Jupiter">
        <DraggablePlanet>
          <Jupiter />
        </DraggablePlanet>
        </ClickablePlanet>
      </PlanetOrbit>

      <OrbitRing radius={26} color="#e8d5a3" />
      <PlanetOrbit radius={26} speed={0.08} offset={5.5}>
        <ClickablePlanet name="Saturn">
        <DraggablePlanet>
            <Saturn />
        </DraggablePlanet>
        </ClickablePlanet>
      </PlanetOrbit>
    <AlienShuttle /> 
      <Nebula />
      <StarField />
    </>
  );
}