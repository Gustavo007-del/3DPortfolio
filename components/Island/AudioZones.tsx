// components/Island/AudioZones.tsx

"use client";

import AudioZone from "@/components/Audio/AudioZone";

export default function AudioZones() {
  return (
    <>
      <AudioZone position={[0,0,0]} radius={18} sound="fire" bus="Environment" />
    <AudioZone position={[20,0,20]} radius={40} sound="wind" bus="Ambient" />
    <AudioZone position={[10,5,10]} radius={35} sound="birds" bus="Ambient" />
    <AudioZone position={[-15,0,-15]} radius={30} sound="insects" bus="Ambient" />
    {/* <AudioZone position={[-15,0,-15]} radius={30} sound="bell" bus="Ambient" /> */}
    </>
  );
}