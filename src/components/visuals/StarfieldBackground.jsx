import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function StarfieldBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    let scene, camera, renderer, particles;
    let rafId;
    let disposed = false;
    const particleCount = 1000;
    const speedFactor = 0.005;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const color = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      positions.push(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200
      );

      color.setHSL(0.6 + Math.random() * 0.1, 0.5, 0.7 + Math.random() * 0.2);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const animate = () => {
      if (disposed) return;
      rafId = requestAnimationFrame(animate);
      particles.rotation.x += speedFactor * 0.1;
      particles.rotation.y += speedFactor * 0.2;
      particles.rotation.z += speedFactor * 0.05;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      disposed = true;
      if (typeof rafId === "number") {
        cancelAnimationFrame(rafId);
      }

      if (particles) {
        scene?.remove?.(particles);
        particles.geometry?.dispose?.();
        particles.material?.dispose?.();
      }

      renderer?.dispose?.();
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 -z-10 w-full h-full" />
  );
}
