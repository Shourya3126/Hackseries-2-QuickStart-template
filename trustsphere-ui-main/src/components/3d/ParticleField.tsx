import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles({ count = 500 }) {
  const mesh = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorPrimary = new THREE.Color("hsl(234, 89%, 68%)");
    const colorSecondary = new THREE.Color("hsl(185, 72%, 48%)");
    const colorAccent = new THREE.Color("hsl(160, 67%, 48%)");
    const palette = [colorPrimary, colorSecondary, colorAccent];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return [positions, colors];
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.02;
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function FloatingRing() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.15;
    ref.current.rotation.z = state.clock.elapsedTime * 0.1;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[3, 0.02, 16, 100]} />
      <meshBasicMaterial color="hsl(234, 89%, 68%)" transparent opacity={0.3} />
    </mesh>
  );
}

function FloatingRing2() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.12;
    ref.current.rotation.x = Math.PI * 0.3;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[4, 0.015, 16, 100]} />
      <meshBasicMaterial color="hsl(185, 72%, 48%)" transparent opacity={0.2} />
    </mesh>
  );
}

export default function ParticleField() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Particles count={400} />
        <FloatingRing />
        <FloatingRing2 />
      </Canvas>
    </div>
  );
}
