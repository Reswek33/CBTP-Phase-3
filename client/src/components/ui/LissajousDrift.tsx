/* eslint-disable react-hooks/exhaustive-deps */
// src/components/ui/LissajousLoader.tsx
import React, { useEffect, useRef, useState } from "react";

interface LissajousConfig {
  name: string;
  tag: string;
  rotate: boolean;
  particleCount: number;
  trailSpan: number;
  durationMs: number;
  rotationDurationMs: number;
  pulseDurationMs: number;
  strokeWidth: number;
  lissajousAmp: number;
  lissajousAmpBoost: number;
  lissajousAX: number;
  lissajousBY: number;
  lissajousPhase: number;
  lissajousYScale: number;
  formula: (config: LissajousConfig) => string;
  point: (
    progress: number,
    detailScale: number,
    config: LissajousConfig,
  ) => { x: number; y: number };
}

const defaultConfig: LissajousConfig = {
  name: "Lissajous Drift",
  tag: "x = sin(at), y = sin(bt)",
  rotate: false,
  particleCount: 39,
  trailSpan: 0.34,
  durationMs: 4400,
  rotationDurationMs: 48000,
  pulseDurationMs: 5400,
  strokeWidth: 4.7,
  lissajousAmp: 34,
  lissajousAmpBoost: 6,
  lissajousAX: 3,
  lissajousBY: 4,
  lissajousPhase: 1.57,
  lissajousYScale: 0.89,
  formula: (config: LissajousConfig) => {
    return [
      `A = ${config.lissajousAmp.toFixed(1)} + ${config.lissajousAmpBoost.toFixed(1)}s`,
      `x(t) = 50 + sin(${Math.round(config.lissajousAX)}t + ${config.lissajousPhase.toFixed(2)}) · A`,
      `y(t) = 50 + sin(${Math.round(config.lissajousBY)}t) · ${config.lissajousYScale.toFixed(2)}A`,
    ].join("\n");
  },
  point: (progress: number, detailScale: number, config: LissajousConfig) => {
    const t = progress * Math.PI * 2;
    const amp = config.lissajousAmp + detailScale * config.lissajousAmpBoost;
    return {
      x:
        50 +
        Math.sin(Math.round(config.lissajousAX) * t + config.lissajousPhase) *
          amp,
      y:
        50 +
        Math.sin(Math.round(config.lissajousBY) * t) *
          (amp * config.lissajousYScale),
    };
  },
};

interface LissajousLoaderProps {
  /** Custom configuration (optional) */
  config?: Partial<LissajousConfig>;
  /** Size of the loader in pixels or vw/vh */
  size?: string | number;
  /** Show formula text */
  showFormula?: boolean;
  /** Show title and tag */
  showMeta?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Loading text to display */
  loadingText?: string;
  /** Color of the loader */
  color?: string;
}

export const LissajousLoader: React.FC<LissajousLoaderProps> = ({
  config: customConfig,
  size = "min(72vmin, 420px)",
  showFormula = true,
  showMeta = true,
  className = "",
  loadingText,
  color = "currentColor",
}) => {
  const groupRef = useRef<SVGGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const particlesRef = useRef<SVGCircleElement[]>([]);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(performance.now());

  const [formulaText, setFormulaText] = useState<string>("");
  const [mergedConfig] = useState<LissajousConfig>(() => ({
    ...defaultConfig,
    ...customConfig,
  }));

  // Initialize particles
  useEffect(() => {
    if (!groupRef.current) return;

    // Clear existing particles
    while (groupRef.current.firstChild) {
      groupRef.current.removeChild(groupRef.current.firstChild);
    }

    // Create new particles
    const particles: SVGCircleElement[] = [];
    for (let i = 0; i < mergedConfig.particleCount; i++) {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.setAttribute("fill", color);
      groupRef.current.appendChild(circle);
      particles.push(circle);
    }
    particlesRef.current = particles;

    // Set formula text
    if (showFormula && typeof mergedConfig.formula === "function") {
      setFormulaText(mergedConfig.formula(mergedConfig));
    }

    // Set stroke width
    if (pathRef.current) {
      pathRef.current.setAttribute(
        "stroke-width",
        String(mergedConfig.strokeWidth),
      );
    }
  }, [mergedConfig, showFormula, color]);

  // Animation helpers
  const normalizeProgress = (progress: number) => {
    return ((progress % 1) + 1) % 1;
  };

  const getDetailScale = (time: number) => {
    const pulseProgress =
      (time % mergedConfig.pulseDurationMs) / mergedConfig.pulseDurationMs;
    const pulseAngle = pulseProgress * Math.PI * 2;
    return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;
  };

  const getRotation = (time: number) => {
    if (!mergedConfig.rotate) return 0;
    return (
      -(
        (time % mergedConfig.rotationDurationMs) /
        mergedConfig.rotationDurationMs
      ) * 360
    );
  };

  const buildPath = (detailScale: number, steps = 480) => {
    const points: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const point = mergedConfig.point(i / steps, detailScale, mergedConfig);
      points.push(
        `${i === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
      );
    }
    return points.join(" ");
  };

  const getParticle = (
    index: number,
    progress: number,
    detailScale: number,
  ) => {
    const tailOffset = index / (mergedConfig.particleCount - 1);
    const point = mergedConfig.point(
      normalizeProgress(progress - tailOffset * mergedConfig.trailSpan),
      detailScale,
      mergedConfig,
    );
    const fade = Math.pow(1 - tailOffset, 0.56);
    return {
      x: point.x,
      y: point.y,
      radius: 0.9 + fade * 2.7,
      opacity: 0.04 + fade * 0.96,
    };
  };

  // Animation loop
  useEffect(() => {
    const render = (now: number) => {
      const time = now - startTimeRef.current;
      const progress =
        (time % mergedConfig.durationMs) / mergedConfig.durationMs;
      const detailScale = getDetailScale(time);

      if (groupRef.current) {
        groupRef.current.setAttribute(
          "transform",
          `rotate(${getRotation(time)} 50 50)`,
        );
      }

      if (pathRef.current) {
        pathRef.current.setAttribute("d", buildPath(detailScale));
      }

      particlesRef.current.forEach((node, index) => {
        if (node) {
          const particle = getParticle(index, progress, detailScale);
          node.setAttribute("cx", particle.x.toFixed(2));
          node.setAttribute("cy", particle.y.toFixed(2));
          node.setAttribute("r", particle.radius.toFixed(2));
          node.setAttribute("opacity", particle.opacity.toFixed(3));
          node.setAttribute("fill", color);
        }
      });

      animationRef.current = requestAnimationFrame(render);
    };

    startTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mergedConfig, color]);

  // Handle size conversion
  const sizeStyle = typeof size === "number" ? `${size}px` : size;

  return (
    <div
      className={`demo ${className}`}
      style={{
        display: "grid",
        gap: "20px",
        justifyItems: "center",
        padding: "32px",
      }}
    >
      <div
        className="frame"
        style={{
          width: sizeStyle,
          aspectRatio: "1",
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          aria-hidden="true"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
          <g ref={groupRef} id="group">
            <path
              ref={pathRef}
              id="path"
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.1"
            />
          </g>
        </svg>
      </div>

      {showMeta && (
        <div
          className="meta"
          style={{ display: "grid", gap: "6px", textAlign: "center" }}
        >
          <div
            className="title"
            style={{ fontSize: "22px", fontWeight: 700, color }}
          >
            {loadingText || mergedConfig.name}
          </div>
          {!loadingText && (
            <div
              className="tag"
              style={{
                fontSize: "13px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.58)",
              }}
            >
              {mergedConfig.tag}
            </div>
          )}
        </div>
      )}

      {showFormula && formulaText && (
        <pre
          className="formula"
          style={{
            maxWidth: "min(92vw, 720px)",
            padding: "14px 16px",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.03)",
            color: "rgba(255,255,255,0.82)",
            font: "13px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace",
            whiteSpace: "pre-wrap",
          }}
        >
          {formulaText}
        </pre>
      )}
    </div>
  );
};

// Alternative compact version without text
export const CompactLissajousLoader: React.FC<{
  size?: number;
  color?: string;
  className?: string;
}> = ({ size = 40, color = "currentColor", className = "" }) => {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <LissajousLoader
        size={size}
        showFormula={false}
        showMeta={false}
        color={color}
        config={{
          particleCount: 20,
          strokeWidth: 3,
          durationMs: 3000,
          pulseDurationMs: 4000,
        }}
      />
    </div>
  );
};

// Loading overlay component
export const LissajousOverlay: React.FC<{
  isLoading: boolean;
  message?: string;
}> = ({ isLoading, message = "Loading..." }) => {
  if (!isLoading) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <LissajousLoader
        size="min(72vmin, 300px)"
        loadingText={message}
        showFormula={false}
      />
    </div>
  );
};

export default LissajousLoader;
