// components/Environment/Fireflies/FireflyMaterial.ts
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { Color, AdditiveBlending } from 'three';

export const FireflyMaterial = shaderMaterial(
  { uTime: 0, uColor: new Color('#ffb347'), uCoreColor: new Color('#fff6d5'), uWind: [0, 0, 0] },
  /* vertex */ `
attribute float aSize;
attribute float aBlinkSpeed;
attribute float aBlinkOffset;
attribute float aBrightness;
attribute float aSeed;
uniform float uTime;
uniform vec3 uWind;
varying float vFlicker;
varying float vBrightness;
varying vec2 vUv;
void main(){
  vUv=uv;
  vBrightness=aBrightness;
  float blink=sin(uTime*aBlinkSpeed+aBlinkOffset)*0.5+0.5;
  float microFlicker=sin(uTime*(17.+aSeed*23.)+aSeed*6.2831)*0.15+0.85;
  vFlicker=pow(blink,1.8)*microFlicker;
  vec4 mvPosition=modelViewMatrix*instanceMatrix*vec4(position*aSize,1.);
  mvPosition.xyz+=uWind*aSize*0.3;
  gl_Position=projectionMatrix*mvPosition;
}
`,
  /* fragment */ `
uniform vec3 uColor;
uniform vec3 uCoreColor;
varying float vFlicker;
varying float vBrightness;
varying vec2 vUv;
void main(){
  vec2 c=vUv-0.5;
  float d=length(c)*2.;
  float glow=smoothstep(1.,0.,d);
  glow=pow(glow,2.2);
  float core=smoothstep(0.35,0.,d);
  vec3 col=mix(uColor,uCoreColor,core);
  float alpha=glow*vFlicker*vBrightness;
  if(alpha<0.003)discard;
  gl_FragColor=vec4(col*(1.+core*1.5),alpha);
}
`
);

FireflyMaterial.key = 'FireflyMaterial';
extend({ FireflyMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    fireflyMaterial: any;
  }
}

export const fireflyMaterialDefaults = {
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
};