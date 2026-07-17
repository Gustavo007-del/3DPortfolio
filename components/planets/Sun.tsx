import { useTexture } from "@react-three/drei";

export default function Sun() {
  const texture = useTexture(
    "/textures/sun.png"
  );

  return (
    <mesh>
      <sphereGeometry args={[2, 64, 64]} />

      <meshStandardMaterial
  map={texture}
  emissive="#ff6600"
  emissiveIntensity={4}
/>
    </mesh>
  );
}