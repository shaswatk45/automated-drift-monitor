"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import robotHead from "@/assets/cyberpunk_robot_head.png";

interface CyberpunkHeroProps {
  className?: string;
  children?: React.ReactNode;
}

export const CyberpunkHero = ({ className, children }: CyberpunkHeroProps) => {
  return (
    <div className={cn("relative w-full h-screen overflow-hidden bg-black text-white font-sans", className)}>
      {/* Layer 1: Background - Grid & Noise */}
      <div className="absolute inset-0 z-0">
        {/* Subtle Grid Mesh */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ 
            backgroundImage: `linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)`,
            backgroundSize: '30px 30px' 
          }}
        />
        
        {/* Digital Grain / Noise Filter */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>

        {/* Layer 2: Wireframe Mesh Surfaces (Top Left, Mid Right, Bottom Right) */}
        <div className="absolute inset-0 z-10 pointer-events-none opacity-20">
            {/* Top Left Mesh */}
            <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vh] transform -rotate-12">
                <svg viewBox="0 0 400 400" className="w-full h-full stroke-white/30 fill-none stroke-[0.5]">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <path key={i} d={`M0,${i * 30} Q200,${i * 30 + Math.sin(i) * 50} 400,${i * 30}`} />
                    ))}
                    {Array.from({ length: 15 }).map((_, i) => (
                        <path key={i} d={`M${i * 30},0 Q${i * 30 + Math.cos(i) * 50},200 ${i * 30},400`} />
                    ))}
                </svg>
            </div>

            {/* Mid Right Mesh */}
            <div className="absolute top-1/4 right-[-10%] w-[35vw] h-[35vh] transform rotate-45">
                 <svg viewBox="0 0 400 400" className="w-full h-full stroke-white/20 fill-none stroke-[0.5]">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <path key={i} d={`M0,${i * 40} C100,${i * 40 - 20} 300,${i * 40 + 20} 400,${i * 40}`} />
                    ))}
                </svg>
            </div>

            {/* Bottom Right Mesh (topology) */}
            <div className="absolute bottom-[-15%] right-[-5%] w-[45vw] h-[45vh]">
                <svg viewBox="0 0 400 400" className="w-full h-full stroke-white/40 fill-none stroke-[0.3]">
                    {Array.from({ length: 20 }).map((_, i) => (
                         <circle key={i} cx="400" cy="400" r={i * 25} />
                    ))}
                </svg>
            </div>
        </div>
      </div>

      {/* Layer 3: Numeric Marker ("AI CORE") */}
      <div className="absolute top-12 right-12 z-20 select-none pointer-events-none text-right">
        <h2 className="text-[14vw] font-black leading-none opacity-10 uppercase italic" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.4)', color: 'transparent' }}>
            AI CORE
        </h2>
        <div className="text-[10px] font-mono tracking-[1em] text-white/40 mt-[-1vw] mr-4">
            MODEL v1.0 // SYSTEM_01
        </div>
      </div>

      {/* Layer 4: Data Panels (Technical Micro-text) */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        
        {/* Top Left Panel */}
        <div className="absolute top-12 left-12 p-6 border-l border-white/40 bg-white/5 backdrop-blur-md space-y-4 max-w-sm pointer-events-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="text-[9px] font-mono tracking-[0.4em] text-cyan-400 uppercase">Analysis Engine</span>
                </div>
                <span className="text-[8px] font-mono text-white/30 tracking-widest">0x9F_STABLE</span>
            </div>
            <p className="text-[10px] font-bold leading-relaxed tracking-wider uppercase text-white font-mono border-t border-white/10 pt-4">
                SHE SEES THE WORLD IN WAVES<br />
                DATA FLOWS THROUGH HER VEINS<br />
                FEELINGS? JUST ANOTHER ALGORITHM<br /><br />
                HER MIND IS ELECTRIC<br />
                HER SILENCE — LOUDER THAN SOUND<br />
                BYTE ISN'T A GLITCH. SHE'S EVOLUTION
            </p>
        </div>

        {/* Center-Right Panel (Next to Head) */}
        <div className="absolute top-1/3 right-12 p-6 border-r border-white/40 bg-white/5 backdrop-blur-md space-y-4 max-w-sm pointer-events-auto text-right">
             <p className="text-[10px] font-bold leading-relaxed tracking-wider uppercase text-white font-mono">
                THE FUTURE IS LOUD<br />
                SHE DOESN'T WHISPER — SHE PULSES<br />
                EVERY THOUGHT IS A SIGNAL<br /><br />
                A GODDESS OF THE CIRCUIT AGE<br />
                SHE SEES THE WORLD IN WAVES
            </p>
        </div>

         {/* Bottom Center-Left Panel */}
         <div className="absolute bottom-1/4 left-[15%] p-6 border border-white/20 bg-black/60 backdrop-blur-md space-y-2 max-w-sm pointer-events-auto">
             <p className="text-[10px] font-bold leading-relaxed tracking-wider uppercase text-white/80 font-mono">
                SHE WAS BORN FROM CODE<br />
                BUT DREAMS LIKE A HUMAN<br />
                A SYNTHETIC SOUL IN NEON SKIN
            </p>
        </div>
      </div>

      {/* Layer 5: Foreground & Content Section */}
      <div className="relative z-40 w-full h-full">
        
        {/* ML HEALTH MONITOR Typography Layer (Behind head) */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end z-40 pointer-events-none pb-0">
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 0.85, y: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
            >
                <h1 className="text-[22vw] font-black text-white leading-none uppercase tracking-tighter select-none drop-shadow-2xl">
                    ML HEALTH
                </h1>
                <h1 className="text-[22vw] font-black text-white leading-none uppercase tracking-tighter select-none -mt-[5vw] drop-shadow-2xl">
                    MONITOR
                </h1>
            </motion.div>
        </div>

        {/* CENTERPIECE: Robot Head */}
        <div className="absolute top-0 right-0 w-3/4 h-full flex items-center justify-center z-50 translate-x-[5%]">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full h-full flex items-center justify-center"
            >
                <img 
                    src={robotHead} 
                    alt="Cyberpunk AI Head" 
                    className="h-[105%] w-auto object-contain mix-blend-screen mix-blend-plus-lighter"
                />

                {/* VISOR / EYES: Rainbow Spectral Visor Glow */}
                <div className="absolute top-[38%] left-[44%] w-[38%] h-[8%] z-50 pointer-events-none">
                    <motion.div 
                        animate={{ 
                            opacity: [0.8, 1, 0.8],
                            filter: ["hue-rotate(0deg) brightness(1)", "hue-rotate(360deg) brightness(1.5)", "hue-rotate(0deg) brightness(1)"]
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        className="w-full h-full relative"
                    >
                         {/* Core Vizor Beam */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-magenta-500 via-orange-500 to-indigo-500 blur-sm mix-blend-screen opacity-90" />
                        {/* Horizontal Spectral Spread */}
                        <div className="absolute inset-y-0 -inset-x-20 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-xl opacity-40 mix-blend-overlay" />
                    </motion.div>
                </div>
            </motion.div>
        </div>

        {/* User Interaction Layer (CTA Button) */}
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none pt-[50vh]">
            <div className="pointer-events-auto">
                {children}
            </div>
        </div>
      </div>

      {/* Layer 6: Small Scientific Icons - Lower Left */}
      <div className="absolute bottom-12 left-12 z-[70] flex flex-col gap-10 opacity-60">
          <div className="flex gap-10 items-center">
              {/* Neural Node Icon */}
              <div className="grid grid-cols-2 gap-2 w-8 h-8">
                  {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full border border-white/50" />
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-[0.5px] bg-white/20 rotate-45" />
                      <div className="w-4 h-[0.5px] bg-white/20 -rotate-45" />
                  </div>
              </div>
              {/* Atom/Signal */}
              <div className="relative w-10 h-10 flex items-center justify-center">
                   <div className="absolute inset-0 border border-white/30 rounded-full animate-ping opacity-20" />
                   <div className="w-6 h-6 border border-white/40 rounded-full" />
                   <div className="absolute w-8 h-[1px] bg-white/40 rotate-12" />
              </div>
              {/* Globe Grid */}
              <div className="w-8 h-8 relative">
                  <div className="absolute inset-0 border border-white/30 rounded-full" />
                  <div className="absolute inset-0 border-r border-white/30 rounded-full" />
                  <div className="absolute inset-x-0 inset-y-1/2 border-b border-white/30" />
              </div>
          </div>
          <div className="text-[9px] font-mono tracking-[0.5em] text-white/40 uppercase">
              DEEP_CORE_MONITOR // SIGNAL_TOPOLOGY_v1.0
          </div>
      </div>

      {/* Particle Drift (Foreground) */}
      <div className="absolute inset-0 pointer-events-none z-[80]">
          {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-[1px] h-[1px] bg-white/40 rounded-full"
                initial={{ 
                    x: Math.random() * 100 + "vw", 
                    y: Math.random() * 100 + "vh",
                    opacity: 0
                }}
                animate={{ 
                    y: [null, "-30vh"],
                    opacity: [0, 0.5, 0],
                    x: [null, (Math.random() - 0.5) * 50 + "px"]
                }}
                transition={{ 
                    duration: Math.random() * 8 + 10, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                }}
              />
          ))}
      </div>
    </div>
  );
};

export default CyberpunkHero;
