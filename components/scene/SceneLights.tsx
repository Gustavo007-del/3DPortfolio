export default function SceneLights() {
  return (
    <>
      {/* Global light */}
      <ambientLight intensity={0.3} />

      {/* Sun light */}
      <pointLight
        position={[0, 0, 0]}
        intensity={80}
      />
    </>
  );
}