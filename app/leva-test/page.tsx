// app/leva-test/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useControls } from "leva";

const Leva = dynamic(() => import("leva").then((mod) => mod.Leva), {
  ssr: false,
});

function Controls() {
  const { value } = useControls({ value: 1 });
  return <p>Value: {value}</p>;
}

export default function LevaTestPage() {
  return (
    <div style={{ padding: 40 }}>
      <Leva />
      <Controls />
      <h1>Leva Test</h1>
    </div>
  );
}