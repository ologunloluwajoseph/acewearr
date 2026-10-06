"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
//  AceWears Splash Loader
//  Shows on first visit (or when localStorage is cleared) — displays:
//  - A large 3D Ace Spade in the center with a gold gradient + shine sweep
//  - 4 pulsing loading dots below it with a mirrored shadow reflection
//  - 2 smaller glowing Diamond Aces at top-left and top-right, zooming in/out
//  - Auto-dismisses after ~3.5s or when the user clicks/taps
// ============================================================================

const SPLASH_KEY = "acewears-splash-seen";
const SPLASH_DURATION = 3500;

export function SplashLoader() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show on first visit OR if localStorage was cleared
    const seen = localStorage.getItem(SPLASH_KEY);
    if (!seen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        localStorage.setItem(SPLASH_KEY, "1");
      }, SPLASH_DURATION);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(SPLASH_KEY, "1");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          onClick={dismiss}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at center, #0A1128 0%, #060B1B 60%, #030611 100%)",
          }}
        >
          {/* Ambient glows */}
          <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-amber/10 blur-[100px]" />
          <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-teal/10 blur-[100px]" />

          {/* ===== Two smaller glowing Diamond Aces at top sides — zooming in/out ===== */}
          <motion.div
            className="absolute left-[12%] top-[18%] sm:left-[18%] sm:top-[20%]"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.6, 1, 0.6], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <DiamondAce />
          </motion.div>
          <motion.div
            className="absolute right-[12%] top-[18%] sm:right-[18%] sm:top-[20%]"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.6, 1, 0.6], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <DiamondAce />
          </motion.div>

          {/* ===== Central 3D Ace Spade ===== */}
          <div className="relative flex flex-col items-center">
            {/* The spade */}
            <motion.div
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.2 }}
              className="relative"
            >
              <AceSpade3D />
            </motion.div>

            {/* Shine sweep overlay on the spade */}
            <motion.div
              className="pointer-events-none absolute inset-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div
                className="absolute -inset-y-4 w-24 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                style={{ filter: "blur(8px)", skewX: "-20deg" }}
                initial={{ x: -100 }}
                animate={{ x: 250 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
              />
            </motion.div>

            {/* Brand text */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-4 text-2xl font-bold tracking-wide text-white"
            >
              <span className="text-amber">A</span>ceWears
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 1 }}
              className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/50"
            >
              Threads Reimagined
            </motion.p>
          </div>

          {/* ===== 4 Loading dots + shadow reflection ===== */}
          <div className="mt-10 flex flex-col items-center">
            {/* Dots */}
            <div className="flex gap-3">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="h-3 w-3 rounded-full bg-amber"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* Shadow reflection of the 4 dots */}
            <div
              className="mt-1 flex gap-3 scale-y-[-1] opacity-30 blur-[2px]"
              style={{ maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)", WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)" }}
            >
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="h-3 w-3 rounded-full bg-amber"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Tap to skip */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 text-[10px] uppercase tracking-wider text-white/30"
          >
            Tap to continue
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
//  3D Ace Spade — SVG with gold gradient, depth shadow, and shine
// ============================================================================
function AceSpade3D() {
  return (
    <svg width="120" height="140" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Gold gradient for the spade body */}
        <linearGradient id="spadeGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE9BF" />
          <stop offset="30%" stopColor="#FF9F1C" />
          <stop offset="60%" stopColor="#E08800" />
          <stop offset="100%" stopColor="#8A5300" />
        </linearGradient>
        {/* Highlight gradient */}
        <linearGradient id="spadeHighlight" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        {/* Drop shadow filter for 3D depth */}
        <filter id="spadeShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Spade body — heart shape inverted with stem */}
      <g filter="url(#spadeShadow)">
        {/* Main spade shape */}
        <path
          d="M60 10
             C 50 25, 25 35, 25 60
             C 25 78, 38 90, 52 88
             C 48 95, 45 102, 42 108
             C 40 112, 42 116, 48 116
             L 72 116
             C 78 116, 80 112, 78 108
             C 75 102, 72 95, 68 88
             C 82 90, 95 78, 95 60
             C 95 35, 70 25, 60 10 Z"
          fill="url(#spadeGold)"
          stroke="#5C3800"
          strokeWidth="1.5"
        />
        {/* Highlight overlay */}
        <path
          d="M60 10
             C 50 25, 25 35, 25 60
             C 25 78, 38 90, 52 88
             C 48 95, 45 102, 42 108
             L 48 116
             L 55 116
             C 53 110, 50 95, 52 85
             C 40 87, 30 78, 30 60
             C 30 40, 50 28, 60 14 Z"
          fill="url(#spadeHighlight)"
        />
        {/* Inner shine dot */}
        <ellipse cx="48" cy="50" rx="8" ry="12" fill="#FFFFFF" opacity="0.3" transform="rotate(-15 48 50)" />
      </g>
    </svg>
  );
}

// ============================================================================
//  Diamond Ace — Canvas-rendered realistic diamond with light refraction
//  Uses Canvas 2D API to draw faceted diamond with sparkle animation
// ============================================================================
function DiamondAce() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let animId: number;

    const drawDiamond = () => {
      const w = 50, h = 60;
      ctx.clearRect(0, 0, w, h);

      // Diamond geometry — table (top flat), crown, pavilion (bottom point)
      const cx = w / 2;
      const tableTop = 8;
      const tableWidth = 18;
      const girdleY = 22; // widest part
      const girdleWidth = 38;
      const tipY = 54;

      // === Glow halo behind the diamond ===
      const glowGrad = ctx.createRadialGradient(cx, 28, 5, cx, 28, 30);
      glowGrad.addColorStop(0, "rgba(200, 230, 255, 0.25)");
      glowGrad.addColorStop(0.5, "rgba(150, 200, 255, 0.1)");
      glowGrad.addColorStop(1, "rgba(100, 150, 255, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, 28, 24, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // === Diamond body — faceted rendering ===

      // Helper: draw a facet with a gradient
      const drawFacet = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, grad: CanvasGradient) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = "rgba(180, 220, 255, 0.15)";
        ctx.lineWidth = 0.3;
        ctx.stroke();
      };

      // === CROWN facets (top section) ===

      // Left table-to-girdle
      const g1 = ctx.createLinearGradient(cx - tableWidth/2, tableTop, cx - girdleWidth/2, girdleY);
      g1.addColorStop(0, "rgba(220, 240, 255, 0.95)");
      g1.addColorStop(0.5, "rgba(180, 215, 250, 0.85)");
      g1.addColorStop(1, "rgba(150, 195, 240, 0.75)");
      drawFacet(cx - tableWidth/2, tableTop, cx - girdleWidth/2, girdleY, cx, girdleY, g1);

      // Right table-to-girdle
      const g2 = ctx.createLinearGradient(cx + tableWidth/2, tableTop, cx + girdleWidth/2, girdleY);
      g2.addColorStop(0, "rgba(255, 255, 255, 1)");
      g2.addColorStop(0.5, "rgba(210, 235, 255, 0.9)");
      g2.addColorStop(1, "rgba(170, 205, 245, 0.8)");
      drawFacet(cx + tableWidth/2, tableTop, cx + girdleWidth/2, girdleY, cx, girdleY, g2);

      // Far left crown facet
      const g3 = ctx.createLinearGradient(4, 18, cx - tableWidth/2, tableTop);
      g3.addColorStop(0, "rgba(120, 160, 210, 0.7)");
      g3.addColorStop(1, "rgba(190, 220, 250, 0.85)");
      drawFacet(4, 18, cx - tableWidth/2, tableTop, cx - girdleWidth/2, girdleY, g3);

      // Far right crown facet
      const g4 = ctx.createLinearGradient(46, 18, cx + tableWidth/2, tableTop);
      g4.addColorStop(0, "rgba(100, 145, 200, 0.65)");
      g4.addColorStop(1, "rgba(200, 230, 255, 0.9)");
      drawFacet(46, 18, cx + tableWidth/2, tableTop, cx + girdleWidth/2, girdleY, g4);

      // Table (top flat surface)
      const tableGrad = ctx.createLinearGradient(cx - tableWidth/2, tableTop, cx + tableWidth/2, tableTop + 5);
      tableGrad.addColorStop(0, "rgba(240, 250, 255, 0.7)");
      tableGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.95)");
      tableGrad.addColorStop(0.7, "rgba(220, 240, 255, 0.85)");
      tableGrad.addColorStop(1, "rgba(190, 220, 250, 0.7)");
      ctx.beginPath();
      ctx.moveTo(cx - tableWidth/2, tableTop);
      ctx.lineTo(cx + tableWidth/2, tableTop);
      ctx.lineTo(cx + tableWidth/2 - 2, tableTop + 3);
      ctx.lineTo(cx - tableWidth/2 + 2, tableTop + 3);
      ctx.closePath();
      ctx.fillStyle = tableGrad;
      ctx.fill();

      // === PAVILION facets (bottom — tapering to point) ===

      // Left pavilion
      const g5 = ctx.createLinearGradient(cx - girdleWidth/2, girdleY, cx, tipY);
      g5.addColorStop(0, "rgba(160, 200, 240, 0.75)");
      g5.addColorStop(0.5, "rgba(110, 155, 210, 0.65)");
      g5.addColorStop(1, "rgba(80, 120, 180, 0.5)");
      drawFacet(cx - girdleWidth/2, girdleY, cx, tipY, cx, girdleY, g5);

      // Right pavilion
      const g6 = ctx.createLinearGradient(cx + girdleWidth/2, girdleY, cx, tipY);
      g6.addColorStop(0, "rgba(200, 230, 255, 0.85)");
      g6.addColorStop(0.5, "rgba(130, 175, 225, 0.7)");
      g6.addColorStop(1, "rgba(90, 130, 190, 0.55)");
      drawFacet(cx + girdleWidth/2, girdleY, cx, tipY, cx, girdleY, g6);

      // Far left pavilion
      const g7 = ctx.createLinearGradient(4, 18, cx, tipY);
      g7.addColorStop(0, "rgba(90, 130, 190, 0.6)");
      g7.addColorStop(1, "rgba(60, 100, 160, 0.4)");
      drawFacet(4, 18, cx, tipY, cx - girdleWidth/2, girdleY, g7);

      // Far right pavilion
      const g8 = ctx.createLinearGradient(46, 18, cx, tipY);
      g8.addColorStop(0, "rgba(100, 145, 200, 0.55)");
      g8.addColorStop(1, "rgba(70, 110, 170, 0.4)");
      drawFacet(46, 18, cx, tipY, cx + girdleWidth/2, girdleY, g8);

      // === Sparkles (animated white star bursts) ===
      const sparklePositions = [
        { x: 18, y: 15, phase: 0 },
        { x: 35, y: 20, phase: 1.5 },
        { x: 25, y: 35, phase: 3 },
        { x: 15, y: 40, phase: 4.5 },
        { x: 38, y: 42, phase: 2 },
      ];

      sparklePositions.forEach(sp => {
        const t = (frame * 0.03 + sp.phase) % (Math.PI * 2);
        const intensity = Math.max(0, Math.sin(t));
        if (intensity > 0.3) {
          const size = 1 + intensity * 2.5;
          ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.9})`;
          // Star burst — 4-pointed star
          ctx.beginPath();
          ctx.moveTo(sp.x, sp.y - size * 2);
          ctx.lineTo(sp.x + size * 0.4, sp.y - size * 0.4);
          ctx.lineTo(sp.x + size * 2, sp.y);
          ctx.lineTo(sp.x + size * 0.4, sp.y + size * 0.4);
          ctx.lineTo(sp.x, sp.y + size * 2);
          ctx.lineTo(sp.x - size * 0.4, sp.y + size * 0.4);
          ctx.lineTo(sp.x - size * 2, sp.y);
          ctx.lineTo(sp.x - size * 0.4, sp.y - size * 0.4);
          ctx.closePath();
          ctx.fill();
          // Center dot
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
          ctx.fill();
        }
      });

      // === Rainbow refraction (subtle, animated) ===
      const rainbowT = (frame * 0.02) % (Math.PI * 2);
      const rainbowX = cx + Math.sin(rainbowT) * 8;
      const rainbowY = girdleY + Math.cos(rainbowT) * 5;
      const rainbowGrad = ctx.createRadialGradient(rainbowX, rainbowY, 0, rainbowX, rainbowY, 12);
      rainbowGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      rainbowGrad.addColorStop(0.3, "rgba(255, 200, 200, 0.15)");
      rainbowGrad.addColorStop(0.5, "rgba(200, 255, 200, 0.1)");
      rainbowGrad.addColorStop(0.7, "rgba(200, 200, 255, 0.15)");
      rainbowGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = rainbowGrad;
      ctx.beginPath();
      ctx.moveTo(cx - tableWidth/2, tableTop);
      ctx.lineTo(cx + tableWidth/2, tableTop);
      ctx.lineTo(cx + girdleWidth/2, girdleY);
      ctx.lineTo(cx, tipY);
      ctx.lineTo(cx - girdleWidth/2, girdleY);
      ctx.closePath();
      ctx.fill();

      // === Outer edge highlight ===
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - tableWidth/2, tableTop);
      ctx.lineTo(cx + tableWidth/2, tableTop);
      ctx.stroke();

      frame++;
      animId = requestAnimationFrame(drawDiamond);
    };

    drawDiamond();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={ref} width={50} height={60} className="block" />;
}
