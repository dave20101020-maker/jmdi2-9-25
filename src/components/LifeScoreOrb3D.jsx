import React, {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
} from "react";
import { AppSettingsContext } from "@/context/appSettingsContext";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import "./lifeScoreOrb.css";

/**
 * Props:
 * - lifeScore: number 0–100
 * - pillarScores: [
 *     { id: "sleep", label: "Sleep", color: "#4ADE80", score: 72 },
 *     ...
 *   ]
 * - onPillarClick?: (pillarId: string) => void
 */
export default function LifeScoreOrb3D({
  lifeScore = 0,
  pillarScores = [],
  onPillarClick,
}) {
  const { settings } = useContext(AppSettingsContext);
  const [supportsWebGL, setSupportsWebGL] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const clampedLifeScore = Math.max(0, Math.min(100, lifeScore));

  useEffect(() => {
    // Detect prefers-reduced-motion
    if (typeof window !== "undefined" && "matchMedia" in window) {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const effective =
        (settings?.reduceMotion ?? null) !== null
          ? settings.reduceMotion
          : mq.matches;
      setReduceMotion(!!effective);
      const handler = (e) => setReduceMotion(e.matches);
      mq.addEventListener?.("change", handler);
    }
    // Check WebGL availability gracefully
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setSupportsWebGL(!!gl);
    } catch {
      setSupportsWebGL(false);
    }
  }, [settings?.reduceMotion]);

  return (
    <div className="life-orb-wrapper" aria-label="Life Score visualization">
      {/* 3D scene or static fallback */}
      {supportsWebGL ? (
        <Canvas
          camera={{ position: [0, 0, 7], fov: 40 }}
          className="life-orb-canvas"
          dpr={[1, 1.5]}
          frameloop={reduceMotion ? "demand" : "always"}
        >
          <color attach="background" args={["transparent"]} />

          {/* Soft lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 10]} intensity={1.2} />
          <pointLight position={[-4, -4, -6]} intensity={0.8} />

          <Suspense fallback={null}>
            <LifeOrbMesh
              lifeScore={clampedLifeScore}
              reduceMotion={reduceMotion}
            />
            <OrbitingPillars
              pillarScores={pillarScores}
              onPillarClick={onPillarClick}
              reduceMotion={reduceMotion}
            />
          </Suspense>
        </Canvas>
      ) : (
        <div
          className="life-orb-canvas"
          role="img"
          aria-label="Static Life Score orb"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
          }}
        >
          {/* simple static circle fallback */}
          <div className="life-orb-score-circle" />
        </div>
      )}

      {/* Crisp 2D overlay for text */}
      <div className="life-orb-overlay" aria-hidden={false}>
        <div className="life-orb-score-circle" aria-live="polite">
          <div className="life-orb-score-value">{clampedLifeScore}</div>
          <div className="life-orb-score-label">Life Score</div>
        </div>
      </div>
    </div>
  );
}

function LifeOrbMesh({ lifeScore, reduceMotion }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const spin = reduceMotion ? 0 : delta * 0.35;
    const wobble = reduceMotion
      ? 0
      : Math.sin(state.clock.elapsedTime * 0.25) * 0.2;
    meshRef.current.rotation.y += spin;
    meshRef.current.rotation.x = wobble;
  });

  // glow intensity based on score
  const glow = 0.35 + (lifeScore / 100) * 0.65;

  return (
    <group>
      {/* main glowing sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.8, 64, 64]} />
        <meshStandardMaterial
          color="#FACC15" // amber-400
          emissive="#FACC15"
          emissiveIntensity={glow}
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>

      {/* subtle aura ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.3, 2.9, 64]} />
        <meshBasicMaterial
          color="#FACC15"
          opacity={0.28}
          transparent
          side={2}
        />
      </mesh>
    </group>
  );
}

function OrbitingPillars({ pillarScores, onPillarClick, reduceMotion }) {
  const groupRef = useRef();

  // slow continuous orbit
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const orbit = reduceMotion ? 0 : delta * 0.25; // speed of orbit
    groupRef.current.rotation.z += orbit;
  });

  const orbitItems = useMemo(() => {
    if (!pillarScores || pillarScores.length === 0) return [];
    const count = pillarScores.length;
    const radius = 3.4; // distance from centre

    return pillarScores.map((pillar, index) => {
      const angle = (index / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      return { ...pillar, x, y, angle };
    });
  }, [pillarScores]);

  return (
    <group ref={groupRef}>
      {orbitItems.map((item) => (
        <PillarDot
          key={item.id}
          item={item}
          onClick={() => onPillarClick && onPillarClick(item.id)}
        />
      ))}
    </group>
  );
}

function PillarDot({ item, onClick }) {
  const dotRef = useRef();

  useFrame((_, delta) => {
    if (!dotRef.current) return;
    // tiny pulsing / wobble
    const base = 1;
    const pulse = Math.sin(Date.now() * 0.002 + item.angle) * 0.08;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    dotRef.current.scale.setScalar(prefersReduced ? base : base + pulse);
  });

  // score → size + glow
  const normScore = Math.max(0, Math.min(100, item.score ?? 0));
  const baseSize = 0.16;
  const size = baseSize + (normScore / 100) * 0.12;
  const glow = 0.4 + (normScore / 100) * 0.9;

  return (
    <group position={[item.x, item.y, 0]}>
      <mesh
        ref={dotRef}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`${item.label} pillar score ${item.score ?? 0}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={item.color || "#38BDF8"} // fallback sky-400
          emissive={item.color || "#38BDF8"}
          emissiveIntensity={glow}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* label + score in 2D so it stays readable */}
      <Html
        center
        distanceFactor={7}
        style={{
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.9)",
            textShadow: "0 0 4px rgba(0,0,0,0.8)",
          }}
        >
          {item.score ?? 0}
        </div>
        <div
          style={{
            fontSize: "0.6rem",
            color: "rgba(255,255,255,0.75)",
            textShadow: "0 0 4px rgba(0,0,0,0.8)",
          }}
        >
          {item.label}
        </div>
      </Html>
    </group>
  );
}
