"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { BUMP, COLOR, SURFACE, TEX_H, TEX_W, drawBack, drawFront, type Palette } from "./faces";

// ISO/IEC 7810 ID-1: 85.6 × 54 mm, ~3.2 mm corners. Thickness is exaggerated so it reads.
const W = 3.37;
const H = W * (54 / 85.6);
const R = 0.13;
const DEPTH = 0.045;
const BEVEL = 0.008;
const FACE_Z = DEPTH / 2 + BEVEL + 0.0008;

function cardShape() {
  const s = new THREE.Shape();
  const x = -W / 2;
  const y = -H / 2;
  s.moveTo(x + R, y);
  s.lineTo(x + W - R, y);
  s.quadraticCurveTo(x + W, y, x + W, y + R);
  s.lineTo(x + W, y + H - R);
  s.quadraticCurveTo(x + W, y + H, x + W - R, y + H);
  s.lineTo(x + R, y + H);
  s.quadraticCurveTo(x, y + H, x, y + H - R);
  s.lineTo(x, y + R);
  s.quadraticCurveTo(x, y, x + R, y);
  return s;
}

// ShapeGeometry UVs are raw x/y; remap them to 0–1 so a texture covers the face exactly.
function faceGeometry(shape: THREE.Shape) {
  const g = new THREE.ShapeGeometry(shape, 12);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (pos.getX(i) + W / 2) / W, (pos.getY(i) + H / 2) / H);
  }
  return g;
}

type Draw = (ctx: CanvasRenderingContext2D, p: Palette, font: string) => void;

function useFaceTextures(draw: Draw) {
  const gl = useThree((s) => s.gl);
  const textures = useMemo(() => {
    const make = (srgb: boolean) => {
      const canvas = document.createElement("canvas");
      canvas.width = TEX_W;
      canvas.height = TEX_H;
      const t = new THREE.CanvasTexture(canvas);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = gl.capabilities.getMaxAnisotropy();
      return t;
    };
    return { map: make(true), surface: make(false), bump: make(false) };
  }, [gl]);

  useEffect(() => {
    const font = getComputedStyle(document.documentElement).getPropertyValue("--font-inter") || "sans-serif";
    const paint = () => {
      for (const [t, p] of [
        [textures.map, COLOR],
        [textures.surface, SURFACE],
        [textures.bump, BUMP],
      ] as const) {
        draw((t.image as HTMLCanvasElement).getContext("2d")!, p, font);
        t.needsUpdate = true;
      }
    };
    paint();
    // Repaint once Inter has loaded so the wordmark isn't drawn in a fallback face.
    document.fonts.load(`600 64px ${font}`).then(paint, () => {});
    return () => Object.values(textures).forEach((t) => t.dispose());
  }, [draw, textures]);

  return textures;
}

function Face({ draw, back = false, geometry }: { draw: Draw; back?: boolean; geometry: THREE.BufferGeometry }) {
  const t = useFaceTextures(draw);
  return (
    <mesh geometry={geometry} position-z={back ? -FACE_Z : FACE_Z} rotation-y={back ? Math.PI : 0}>
      <meshPhysicalMaterial
        map={t.map}
        roughnessMap={t.surface}
        metalnessMap={t.surface}
        bumpMap={t.bump}
        bumpScale={1.6}
        roughness={1}
        metalness={1}
        clearcoat={0.35}
        clearcoatRoughness={0.35}
        envMapIntensity={1.15}
      />
    </mesh>
  );
}

const Y = new THREE.Vector3(0, 1, 0);
const X = new THREE.Vector3(1, 0, 0);

function Card() {
  const group = useRef<THREE.Group>(null);
  const gl = useThree((s) => s.gl);
  const drag = useRef({ active: false, x: 0, y: 0, t: 0, vx: 0, vy: 0 });

  const { body, face } = useMemo(() => {
    const shape = cardShape();
    const body = new THREE.ExtrudeGeometry(shape, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 3,
      curveSegments: 12,
    });
    body.translate(0, 0, -DEPTH / 2);
    return { body, face: faceGeometry(shape) };
  }, []);

  // Drag anywhere on the canvas to rotate the card about the screen's axes.
  useEffect(() => {
    const el = gl.domElement;
    const d = drag.current;
    el.style.cursor = "grab";
    const down = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      Object.assign(d, { active: true, x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, vy: 0 });
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!d.active || !group.current) return;
      const now = performance.now();
      const ay = (e.clientX - d.x) * 0.009;
      const ax = (e.clientY - d.y) * 0.009;
      const q = group.current.quaternion;
      q.premultiply(new THREE.Quaternion().setFromAxisAngle(Y, ay));
      q.premultiply(new THREE.Quaternion().setFromAxisAngle(X, ax));
      const dt = Math.max((now - d.t) / 1000, 1 / 240);
      d.vx = THREE.MathUtils.clamp(ay / dt, -12, 12);
      d.vy = THREE.MathUtils.clamp(ax / dt, -12, 12);
      Object.assign(d, { x: e.clientX, y: e.clientY, t: now });
    };
    const up = (e: PointerEvent) => {
      d.active = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.style.cursor = "grab";
      // A pause before letting go means no fling.
      if (performance.now() - d.t > 80) d.vx = d.vy = 0;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  const tmp = useMemo(
    () => ({ q: new THREE.Quaternion(), target: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, "YXZ") }),
    []
  );

  useFrame((_, delta) => {
    const g = group.current;
    const d = drag.current;
    if (!g || d.active) return;
    const dt = Math.min(delta, 1 / 20);

    // Coast on the release velocity, then turn slowly on its own and settle back upright.
    const decay = Math.exp(-3 * dt);
    d.vx *= decay;
    d.vy *= decay;
    g.quaternion.premultiply(tmp.q.setFromAxisAngle(Y, (d.vx + 0.32) * dt));
    g.quaternion.premultiply(tmp.q.setFromAxisAngle(X, d.vy * dt));

    tmp.e.setFromQuaternion(g.quaternion, "YXZ");
    tmp.target.setFromEuler(tmp.e.set(-0.1, tmp.e.y, 0, "YXZ"));
    const settle = Math.hypot(d.vx, d.vy) < 0.6 ? 1.4 : 0.2;
    g.quaternion.slerp(tmp.target, 1 - Math.exp(-settle * dt));
  });

  return (
    <group ref={group} rotation={[-0.1, -0.45, 0]}>
      <mesh geometry={body}>
        <meshPhysicalMaterial color="#C9A24D" metalness={1} roughness={0.28} envMapIntensity={1.2} />
      </mesh>
      <Face draw={drawFront} geometry={face} />
      <Face draw={drawBack} geometry={face} back />
    </group>
  );
}

function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#b4aa96"]} />
      {/* Softboxes: long strips overhead give the gold its moving highlights. */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {[-6, -2, 2, 6].map((x) => (
          <Lightformer key={x} form="rect" intensity={2.2} position={[x, 0, 4]} scale={[1.2, 14, 1]} />
        ))}
      </group>
      <Lightformer form="rect" intensity={3} position={[-6, 1, 1]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} color="#fff4e2" />
      <Lightformer form="rect" intensity={1.6} position={[6, 0, 2]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} />
      <Lightformer form="ring" intensity={1.4} position={[0, 2, 8]} scale={4} />
    </Environment>
  );
}

export default function Card3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7.4], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping }}
      style={{ touchAction: "none" }}
      aria-label="Mesh card. Drag to rotate."
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 5]} intensity={1.1} />
      <Float speed={1.3} rotationIntensity={0.12} floatIntensity={0.45} floatingRange={[-0.08, 0.08]}>
        <Card />
      </Float>
      <ContactShadows position={[0, -1.55, 0]} opacity={0.32} scale={7} blur={2.8} far={3} resolution={512} color="#1F1A14" />
      <Studio />
    </Canvas>
  );
}
