import SceneLights from "./SceneLights";
import Sun from "../planets/Sun";
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
import PlanetLabel from "./PlanetLabel";

export default function SolarSystem({ active = true }: { active?: boolean }) {
  return (
    <>
      <SceneLights />
      {active && <PostProcessing />}
      <Sun />

      {/* Mercury */}
      <OrbitRing radius={4} />
      <PlanetOrbit radius={4} speed={0.6}>
        <Mercury />
        <PlanetLabel text="Mercury" color="#b0b0b0" />
      </PlanetOrbit>

      {/* Venus */}
      <OrbitRing radius={6} />
      <PlanetOrbit radius={6} speed={0.35} offset={1.2}>
        <Venus />
        <PlanetLabel text="Venus" color="#e6d7a3" />
      </PlanetOrbit>

      {/* Earth */}
      <OrbitRing radius={8} />
      <EarthOrbit />

      {/* Mars */}
      <OrbitRing radius={11} />
      <PlanetOrbit radius={11} speed={0.22} offset={2.5}>
        <Mars />
        <PlanetLabel text="Mars" color="#c1440e" />
      </PlanetOrbit>

      {/* Asteroid Belt */}
      <AsteroidBelt innerRadius={13} outerRadius={16} count={350} />

      {/* Jupiter */}
      <OrbitRing radius={19} />
      <PlanetOrbit radius={19} speed={0.12} offset={4}>
        <Jupiter />
        <PlanetLabel text="Jupiter" color="#d4a574" />
      </PlanetOrbit>

      {/* Saturn */}
      <OrbitRing radius={26} />
      <PlanetOrbit radius={26} speed={0.08} offset={5.5}>
        <Saturn />
        <PlanetLabel text="Saturn" color="#e8d5a3" />
      </PlanetOrbit>

      <Nebula />
      <StarField />
    </>
  );
}
