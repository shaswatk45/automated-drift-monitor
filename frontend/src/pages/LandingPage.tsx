"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { NeuralSphere } from "@/components/landing/NeuralSphere";
import AnimatedShaderHero from "@/components/ui/animated-shader-hero";
import { PulseBeams } from "@/components/ui/pulse-beams";
import { cn } from "@/lib/utils";

const ctaBeams = [
  {
    path: "M0 100H200",
    gradientConfig: {
      initial: { x1: "0%", x2: "0%", y1: "0%", y2: "0%" },
    animate: { 
      x1: ["0%", "100%"], 
      x2: ["-10%", "90%"],
      y1: ["0%", "0%"],
      y2: ["0%", "0%"]
    },
      transition: { duration: 2, repeat: Infinity, ease: "linear" }
    }
  },
  {
    path: "M800 100H1000",
    gradientConfig: {
      initial: { x1: "100%", x2: "100%", y1: "0%", y2: "0%" },
    animate: { 
      x1: ["100%", "0%"], 
      x2: ["110%", "10%"],
      y1: ["0%", "0%"],
      y2: ["0%", "0%"]
    },
      transition: { duration: 2, repeat: Infinity, ease: "linear", delay: 1 }
    }
  }
];

export default function LandingPage() {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full bg-[#0b0b0b] text-white overflow-hidden font-sans tracking-tight">
      
      <AnimatedShaderHero
        headline={{
          line1: "ML Health",
          line2: "Monitor"
        }}
        subtitle="Detect data drift. Maintain model health. Real-time observability for production machine learning systems."
        trustBadge={{
            text: "System Ready: 0x4A6B",
            icons: ["✨"]
        }}
        buttons={{
            primary: {
                text: "Enter Monitoring Console",
                onClick: () => navigate("/dashboard")
            }
        }}
      >
        {/* Background Typography (Layered behind Sphere but inside Hero) */}
        <div className="absolute inset-0 flex items-center justify-center z-0 select-none pointer-events-none opacity-40">
            <h1 className="text-[15vw] md:text-[20vw] font-bold text-white/[0.03] tracking-[0.2em] uppercase font-['Syncopate'] leading-none">
            MONITOR
            </h1>
        </div>

        {/* Neural Sphere centerpiece */}
        <div className="relative z-10 w-full mb-[-100px] md:mb-[-150px]">
            <NeuralSphere isHovered={isHovered} />
        </div>
      </AnimatedShaderHero>

      {/* Decorative Overlays */}
      <div className="absolute top-10 left-10 text-[10px] text-blue-500/30 font-mono select-none z-20">
        0x4A6B_SYS_READY
        <br />
        LN_01: NEURAL_NET_STABLE
      </div>
      
      <div className="absolute top-10 right-10 text-[10px] text-blue-500/30 font-mono select-none text-right z-20">
        MONITOR_v1.0.0
        <br />
        CORE_LOAD: 0.04%
      </div>

      {/* Pulse Beams wrapping the bottom section or CTA if needed, 
          but our Hero component already centers the button. 
          Let's add Pulse Beams as an ambient layer at the bottom. */}
      <div className="absolute bottom-0 left-0 w-full h-1/4 z-0 pointer-events-none opacity-30">
        <PulseBeams 
            beams={ctaBeams} 
            width={1000} 
            height={200}
            gradientColors={{
                start: "#3b82f6",
                middle: "#60a5fa",
                end: "#93c5fd"
            }}
        />
      </div>
    </div>
  );
}
