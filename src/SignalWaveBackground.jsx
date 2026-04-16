import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function useReducedMotion() {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);
}

function WaveMesh() {
  const meshRef = useRef(null);
  const basePositionsRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const pointerSmoothRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const reduceMotion = useReducedMotion();
  const { camera } = useThree();

  useEffect(() => {
    const geometry = meshRef.current?.geometry;
    if (!geometry) return;
    basePositionsRef.current = Float32Array.from(geometry.attributes.position.array);
  }, []);

  useEffect(() => {
    const onPointerMove = (event) => {
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = 1 - (event.clientY / window.innerHeight) * 2;
    };

    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = total <= 0 ? 0 : window.scrollY / total;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [reduceMotion]);

  useFrame((state) => {
    const geometry = meshRef.current?.geometry;
    const basePositions = basePositionsRef.current;
    if (!geometry || !basePositions) return;

    const positions = geometry.attributes.position;
    const time = state.clock.elapsedTime;
    const pointerX = pointerRef.current.x;
    const pointerY = pointerRef.current.y;
    pointerSmoothRef.current.x = lerp(pointerSmoothRef.current.x, pointerX, 0.08);
    pointerSmoothRef.current.y = lerp(pointerSmoothRef.current.y, pointerY, 0.08);

    const px = pointerSmoothRef.current.x;
    const py = pointerSmoothRef.current.y;
    const scroll = scrollRef.current;
    const scrollPhase = scroll * Math.PI * 2;
    const amplitude = 0.5 + scroll * 0.85;
    const pointerWorldX = px * 80;
    const pointerWorldY = py * 80;

    if (!reduceMotion) {
      camera.position.x = lerp(camera.position.x, px * 1.2, 0.04);
      camera.position.y = lerp(camera.position.y, 5 + py * 0.6, 0.04);
      camera.lookAt(0, 0, 0);
    }

    for (let i = 0; i < positions.count; i += 1) {
      const i3 = i * 3;
      const x = basePositions[i3];
      const y = basePositions[i3 + 1];
      const dx = x - pointerWorldX;
      const dy = y - pointerWorldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const cursorInfluence = Math.exp(-dist * 0.045);
      const baseWave =
        Math.sin(x * 0.13 + time * 0.9 + scrollPhase * 0.7) * (0.44 * amplitude) +
        Math.cos(y * 0.11 + time * 0.76 - scrollPhase * 0.5) * (0.35 * amplitude);
      const cursorWave =
        Math.sin(dist * 0.42 - time * 2.6 + scrollPhase) * (0.95 * cursorInfluence);

      positions.array[i3 + 2] = baseWave + cursorWave;
    }

    positions.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[200, 200, 120, 120]} />
      <meshBasicMaterial color="#C9A84C" wireframe transparent opacity={0.12} />
    </mesh>
  );
}

export default function SignalWaveBackground() {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#0A0A0A] pointer-events-none">
      <Canvas camera={{ position: [0, 5, 15], fov: 60 }} dpr={[1, 1.6]}>
        <WaveMesh />
      </Canvas>
    </div>
  );
}
