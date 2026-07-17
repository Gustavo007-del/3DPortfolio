import { Ring } from "@react-three/drei";

type Props = {
  radius: number;
};

export default function OrbitRing({
  radius,
}: Props) {
  return (
    <Ring
      args={[
        radius - 0.02,
        radius + 0.02,
        128,
      ]}
      rotation={[
        -Math.PI / 2,
        0,
        0,
      ]}
    >
      <meshBasicMaterial
        wireframe
      />
    </Ring>
  );
}