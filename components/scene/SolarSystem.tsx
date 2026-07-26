import SceneLights from "./SceneLights";
import Sun from "../planets/Sun";
import OrbitRing from "../planets/OrbitRing";
import EarthOrbit from "../orbits/EarthOrbit";
import PostProcessing from "../effects/PostProcessing";
import StarField from "../stars/StarField";
import Nebula from "../effects/Nebula";

// active defaults true so the standalone app/animate/page.tsx route (if kept as
// a dev route) behaves exactly as before with zero changes required there.
export default function SolarSystem({ active = true }: { active?: boolean }) {
  return (
    <>
      <SceneLights />
      {active && <PostProcessing />}
      <Sun />

      <OrbitRing radius={8} />
      <EarthOrbit />

      <Nebula />
      <StarField />
    </>
  );
}