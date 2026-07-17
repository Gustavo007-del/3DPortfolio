import SceneLights from "./SceneLights";
import Sun from "../planets/Sun";
import OrbitRing from "../planets/OrbitRing";
import EarthOrbit from "../orbits/EarthOrbit";
import PostProcessing from "../effects/PostProcessing";
import StarField from "../stars/StarField";
import Nebula from "../effects/Nebula";

export default function SolarSystem() {
  return (
    <>
      <SceneLights />
      <PostProcessing />
      <Sun />

      <OrbitRing radius={8} />
      <EarthOrbit />

      <Nebula />
      <StarField />

    </>
  );
}