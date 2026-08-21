"use client";

import React, { useEffect, useRef } from "react";

const TAU = Math.PI * 2;
const MAX_PARTICLES = 24000;
const MIN_PARTICLES = 2000;
const DPR_CAP = 2;

const R_IN = 0.15;
const R_OUT = 4.2;
const Z_FLOOR = 2.5;
const NEAR_PLANE = 0.6;
const FOV = 45;
const ROLL = -0.25;

const EXPOSURE = 1 / 90 + 0.51 / 12;
const RADIAL_AT_50 = 0.1;
const SPIN_AT_50 = 0.15;

const VERTEX_SHADER = `
precision highp float;

attribute vec3 aSeed;
attribute vec2 aCorner;

uniform float uPhase;
uniform float uSpin;
uniform float uDu;
uniform float uDSpin;
uniform float uTwist;
uniform float uFunnel;
uniform float uHalfWidth;
uniform float uTilt;
uniform float uOrbit;
uniform float uDist;
uniform float uFocal;
uniform float uAspect;
uniform float uAccentMix;
uniform vec2 uShift;

varying float vAlpha;
varying vec2 vCorner;
varying float vAcc;

#define TAU 6.28318530718
#define R_IN ${R_IN}
#define R_OUT ${R_OUT}
#define Z_FLOOR ${Z_FLOOR}
#define NEAR_PLANE ${NEAR_PLANE}
#define ROLL ${ROLL}

float radiusOf(float u) {
  return mix(float(R_IN), float(R_OUT), clamp(u, 0.0, 1.0));
}

float spiralOf(float u) {
  return uTwist * log(
    (float(R_OUT) + 0.35) /
    (radiusOf(u) + 0.35)
  );
}

vec3 surf(float u, float seedV, float spin) {
  float uc = fract(u);
  float r = radiusOf(uc);

  float a =
    seedV * TAU +
    spiralOf(uc) +
    spin;

  float well = uFunnel / (r + 0.12);

  float z =
    float(Z_FLOOR) *
    (1.0 - exp(-well / float(Z_FLOOR))) -
    0.6;

  return vec3(
    r * cos(a),
    r * sin(a),
    z
  );
}

mat3 rotX(float t) {
  float c = cos(t);
  float s = sin(t);

  return mat3(
    1.0, 0.0, 0.0,
    0.0, c, s,
    0.0, -s, c
  );
}

mat3 rotY(float t) {
  float c = cos(t);
  float s = sin(t);

  return mat3(
    c, 0.0, -s,
    0.0, 1.0, 0.0,
    s, 0.0, c
  );
}

mat3 rotZ(float t) {
  float c = cos(t);
  float s = sin(t);

  return mat3(
    c, s, 0.0,
    -s, c, 0.0,
    0.0, 0.0, 1.0
  );
}

void main() {

  vCorner = aCorner;

  vAcc =
    step(
      1.0 - uAccentMix,
      aSeed.z
    );

  float u0 =
    fract(aSeed.x - uPhase);

  vec3 p0 =
    surf(
      u0,
      aSeed.y,
      uSpin
    );

  vec3 p1 =
    surf(
      u0 + uDu,
      aSeed.y,
      uSpin + uDSpin
    );

  mat3 cam =
    rotX(1.5707963 - uTilt) *
    rotY(uOrbit) *
    rotZ(float(ROLL));

  vec3 pivot =
    vec3(0.0, 0.15, 0.0);

  vec3 e0 =
    cam * (p0 - pivot);

  vec3 e1 =
    cam * (p1 - pivot);

  float zd0 =
    e0.z + uDist;

  float zd1 =
    e1.z + uDist;

  if (
    zd0 < float(NEAR_PLANE) ||
    zd1 < float(NEAR_PLANE)
  ) {
    vAlpha = 0.0;

    gl_Position =
      vec4(2.0, 2.0, 0.0, 1.0);

    return;
  }

  vec2 sp0 =
    e0.xy *
    uFocal /
    zd0;

  vec2 sp1 =
    e1.xy *
    uFocal /
    zd1;

  vec2 d =
    sp1 - sp0;

  float len =
    length(d);

  vec2 tangent =
    len > 0.000001
      ? d / len
      : vec2(1.0, 0.0);

  vec2 normal =
    vec2(
      -tangent.y,
      tangent.x
    );

  float width =
    uHalfWidth *
    uFocal /
    zd0;

  float lengthPx =
    max(
      len,
      2.0 * width
    );

  vec2 screen =
    sp0 +
    tangent *
      (aCorner.y * lengthPx) +
    normal *
      (aCorner.x * width);

  vec2 ndc =
    vec2(
      (screen.x - uShift.x) /
        uAspect,
      screen.y - uShift.y
    );

  gl_Position =
    vec4(
      ndc * zd0,
      0.0,
      zd0
    );

  float edge =
    smoothstep(
      0.0,
      0.20,
      u0
    ) *
    (
      1.0 -
      smoothstep(
        0.62,
        1.0,
        u0
      )
    );

  float depthAtt =
    pow(
      clamp(
        uDist / zd0,
        0.0,
        1.0
      ),
      3.0
    );

  vAlpha =
    edge *
    mix(
      0.35,
      1.0,
      aSeed.z
    ) *
    mix(
      0.05,
      1.0,
      depthAtt
    );
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec3 uBase;
uniform vec3 uAccent;

varying float vAlpha;
varying vec2 vCorner;
varying float vAcc;

void main() {

  float distanceFromCenter =
    abs(vCorner.x * 2.0);

  float glow =
    exp(
      -8.0 *
      distanceFromCenter *
      distanceFromCenter
    );

  float taper =
    smoothstep(
      0.0,
      0.25,
      vCorner.y
    );

  float alpha =
    vAlpha *
    glow *
    taper;

  if (alpha < 0.004)
    discard;

  vec3 color =
    mix(
      uBase,
      uAccent,
      vAcc
    );

  gl_FragColor =
    vec4(
      color * alpha,
      alpha
    );
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
) {
  const shader =
    gl.createShader(type);

  if (!shader)
    return null;

  gl.shaderSource(
    shader,
    source
  );

  gl.compileShader(shader);

  if (
    !gl.getShaderParameter(
      shader,
      gl.COMPILE_STATUS
    )
  ) {
    console.error(
      gl.getShaderInfoLog(shader)
    );

    gl.deleteShader(shader);

    return null;
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext
) {
  const vertex =
    compileShader(
      gl,
      gl.VERTEX_SHADER,
      VERTEX_SHADER
    );

  const fragment =
    compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      FRAGMENT_SHADER
    );

  if (!vertex || !fragment)
    return null;

  const program =
    gl.createProgram();

  if (!program)
    return null;

  gl.attachShader(
    program,
    vertex
  );

  gl.attachShader(
    program,
    fragment
  );

  gl.linkProgram(program);

  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (
    !gl.getProgramParameter(
      program,
      gl.LINK_STATUS
    )
  ) {
    console.error(
      gl.getProgramInfoLog(program)
    );

    gl.deleteProgram(program);

    return null;
  }

  return program;
}

function parseColor(
  value: string
): [number, number, number] {

  if (!value)
    return [1, 1, 1];

  const color =
    value.trim();

  if (color.startsWith("#")) {

    let hex =
      color.slice(1);

    if (
      hex.length === 3 ||
      hex.length === 4
    ) {
      hex =
        hex
          .split("")
          .map(
            char =>
              char + char
          )
          .join("");
    }

    const number =
      parseInt(
        hex.slice(0, 6),
        16
      );

    if (Number.isNaN(number))
      return [1, 1, 1];

    return [
      ((number >> 16) & 255) / 255,
      ((number >> 8) & 255) / 255,
      (number & 255) / 255,
    ];
  }

  const match =
    color.match(
      /rgba?\\(([^)]+)\\)/i
    );

  if (match) {

    const parts =
      match[1]
        .split(",")
        .map(Number);

    return [
      (parts[0] || 0) / 255,
      (parts[1] || 0) / 255,
      (parts[2] || 0) / 255,
    ];
  }

  return [1, 1, 1];
}

interface GravitationalVortexProps {
  progress?: number;
  background?: string;
  baseColor?: string;
  accentColor?: string;
  density?: number;
  dotSize?: number;
  speed?: number;
  direction?: "inward" | "outward";
  scale?: number;
  tiltX?: number;
  tiltY?: number;
  twist?: number;
  funnel?: number;
  style?: React.CSSProperties;
}

export default function GravitationalVortex({
  progress = 0,
  background = "transparent",
  baseColor = "#8fe0ff",
  accentColor = "#ffaa44",
  density = 18,
  dotSize = 300,
  speed = 28,
  direction = "inward",
  scale = 100,
  tiltX = 55,
  tiltY = 0,
  twist = 32,
  funnel = 55,
  style,
}: GravitationalVortexProps) {

  const hostRef =
    useRef<HTMLDivElement>(null);

  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const liveRef =
    useRef({
      progress: 0,
    });

  liveRef.current.progress =
    Math.max(
      0,
      Math.min(
        100,
        progress
      )
    );

  useEffect(() => {

    const host =
      hostRef.current;

    const canvas =
      canvasRef.current;

    if (!host || !canvas)
      return;

    const gl =
      canvas.getContext(
        "webgl",
        {
          alpha: true,
          antialias: true,
          premultipliedAlpha: true,
          depth: false,
          powerPreference:
            "high-performance",
        }
      );

    if (!gl)
      return;

    const program =
      createProgram(gl);

    if (!program)
      return;

    gl.useProgram(program);

    const seedLocation =
      gl.getAttribLocation(
        program,
        "aSeed"
      );

    const cornerLocation =
      gl.getAttribLocation(
        program,
        "aCorner"
      );

    const uniform =
      (name: string) =>
        gl.getUniformLocation(
          program,
          name
        );

    const u = {
      phase: uniform("uPhase"),
      spin: uniform("uSpin"),
      du: uniform("uDu"),
      dspin: uniform("uDSpin"),
      twist: uniform("uTwist"),
      funnel: uniform("uFunnel"),
      halfWidth: uniform("uHalfWidth"),
      tilt: uniform("uTilt"),
      orbit: uniform("uOrbit"),
      dist: uniform("uDist"),
      focal: uniform("uFocal"),
      aspect: uniform("uAspect"),
      accentMix: uniform("uAccentMix"),
      shift: uniform("uShift"),
      base: uniform("uBase"),
      accent: uniform("uAccent"),
    };

    const VERTS = 6;

    const seeds =
      new Float32Array(
        MAX_PARTICLES *
          VERTS *
          3
      );

    const corners =
      new Float32Array(
        MAX_PARTICLES *
          VERTS *
          2
      );

    let seed = 1337;

    const random = () => {
      seed =
        (seed * 16807) %
        2147483647;

      return (
        (seed - 1) /
        2147483646
      );
    };

    const quad = [
      [-0.5, 0],
      [0.5, 0],
      [-0.5, 1],
      [0.5, 0],
      [0.5, 1],
      [-0.5, 1],
    ];

    for (
      let i = 0;
      i < MAX_PARTICLES;
      i++
    ) {

      const u0 =
        random();

      const arm =
        (
          Math.floor(
            random() * 5
          ) +
          (random() - 0.5) *
            0.85
        ) / 5;

      const jitter =
        random();

      for (
        let k = 0;
        k < VERTS;
        k++
      ) {

        const seedIndex =
          (i * VERTS + k) * 3;

        seeds[seedIndex] =
          u0;

        seeds[
          seedIndex + 1
        ] = arm;

        seeds[
          seedIndex + 2
        ] = jitter;

        const cornerIndex =
          (i * VERTS + k) * 2;

        corners[cornerIndex] =
          quad[k][0];

        corners[
          cornerIndex + 1
        ] = quad[k][1];
      }
    }

    const seedBuffer =
      gl.createBuffer();

    const cornerBuffer =
      gl.createBuffer();

    if (
      !seedBuffer ||
      !cornerBuffer
    )
      return;

    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      seedBuffer
    );

    gl.bufferData(
      gl.ARRAY_BUFFER,
      seeds,
      gl.STATIC_DRAW
    );

    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      cornerBuffer
    );

    gl.bufferData(
      gl.ARRAY_BUFFER,
      corners,
      gl.STATIC_DRAW
    );

    gl.enable(
      gl.BLEND
    );

    gl.blendFunc(
      gl.ONE,
      gl.ONE
    );

    gl.clearColor(
      0,
      0,
      0,
      0
    );

    const focal =
      1 /
      Math.tan(
        ((FOV * Math.PI) /
          180) /
          2
      );

    let phase = 0;
    let spin = 0;
    let raf = 0;
    let lastTime = 0;

    const base =
      parseColor(baseColor);

    const accent =
      parseColor(accentColor);

    const render =
      (time: number) => {

        raf =
          requestAnimationFrame(
            render
          );

        const dt =
          lastTime
            ? Math.min(
                0.05,
                (time -
                  lastTime) /
                  1000
              )
            : 1 / 60;

        lastTime = time;

        const p =
          liveRef.current
            .progress / 100;

        const effectiveSpeed =
          speed *
          (0.35 + p * 0.65);

        const directionSign =
          direction ===
          "outward"
            ? -1
            : 1;

        const radialRate =
          (effectiveSpeed /
            50) *
          RADIAL_AT_50 *
          directionSign;

        const spinRate =
          (effectiveSpeed /
            50) *
          SPIN_AT_50 *
          directionSign;

        phase +=
          dt *
          radialRate;

        phase -=
          Math.floor(
            phase
          );

        spin +=
          dt *
          spinRate;

        spin -=
          Math.floor(
            spin / TAU
          ) *
          TAU;

        const dpr =
          Math.min(
            window.devicePixelRatio ||
              1,
            DPR_CAP
          );

        const width =
          host.clientWidth;

        const height =
          host.clientHeight;

        const w =
          Math.max(
            1,
            Math.floor(
              width * dpr
            )
          );

        const h =
          Math.max(
            1,
            Math.floor(
              height * dpr
            )
          );

        if (
          canvas.width !== w ||
          canvas.height !== h
        ) {
          canvas.width = w;
          canvas.height = h;
        }

        gl.viewport(
          0,
          0,
          w,
          h
        );

        gl.clear(
          gl.COLOR_BUFFER_BIT
        );

        gl.useProgram(
          program
        );

        gl.bindBuffer(
          gl.ARRAY_BUFFER,
          seedBuffer
        );

        gl.enableVertexAttribArray(
          seedLocation
        );

        gl.vertexAttribPointer(
          seedLocation,
          3,
          gl.FLOAT,
          false,
          0,
          0
        );

        gl.bindBuffer(
          gl.ARRAY_BUFFER,
          cornerBuffer
        );

        gl.enableVertexAttribArray(
          cornerLocation
        );

        gl.vertexAttribPointer(
          cornerLocation,
          2,
          gl.FLOAT,
          false,
          0,
          0
        );

        const funnelValue =
          (funnel / 100) *
          4.5 *
          (0.5 + p * 0.5);

        const twistValue =
          (twist / 100) *
          20;

        const tilt =
          (tiltX *
            Math.PI) /
          180;

        const orbit =
          (tiltY *
            Math.PI) /
          180;

        const distance =
          (6.2 * 100) /
          Math.max(
            1,
            scale
          );

        gl.uniform1f(
          u.phase,
          phase
        );

        gl.uniform1f(
          u.spin,
          spin
        );

        gl.uniform1f(
          u.du,
          -radialRate *
            EXPOSURE
        );

        gl.uniform1f(
          u.dspin,
          spinRate *
            EXPOSURE
        );

        gl.uniform1f(
          u.twist,
          twistValue
        );

        gl.uniform1f(
          u.funnel,
          funnelValue
        );

        gl.uniform1f(
          u.halfWidth,
          (dotSize / 100) *
            0.0051
        );

        gl.uniform1f(
          u.tilt,
          tilt
        );

        gl.uniform1f(
          u.orbit,
          orbit
        );

        gl.uniform1f(
          u.dist,
          Math.max(
            NEAR_PLANE + 1,
            distance
          )
        );

        gl.uniform1f(
          u.focal,
          focal
        );

        gl.uniform1f(
          u.aspect,
          w /
            Math.max(
              1,
              h
            )
        );

        gl.uniform1f(
          u.accentMix,
          0.5
        );

        gl.uniform2f(
          u.shift,
          0,
          0
        );

        gl.uniform3fv(
          u.base,
          base
        );

        gl.uniform3fv(
          u.accent,
          accent
        );

        const count =
          Math.round(
            MIN_PARTICLES +
              (density / 100) *
                (MAX_PARTICLES -
                  MIN_PARTICLES)
          );

        gl.drawArrays(
          gl.TRIANGLES,
          0,
          count * VERTS
        );
      };

    raf =
      requestAnimationFrame(
        render
      );

    return () => {

      cancelAnimationFrame(
        raf
      );

      gl.deleteBuffer(
        seedBuffer
      );

      gl.deleteBuffer(
        cornerBuffer
      );

      gl.deleteProgram(
        program
      );
    };

  }, [
    baseColor,
    accentColor,
    density,
    dotSize,
    speed,
    direction,
    scale,
    tiltX,
    tiltY,
    twist,
    funnel,
  ]);

  return (
    <div
      ref={hostRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        background,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}