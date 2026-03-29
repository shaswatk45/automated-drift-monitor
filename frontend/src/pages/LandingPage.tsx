"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
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
        buttons={{
            primary: {
                text: "Enter Monitoring Console",
                onClick: () => navigate("/dashboard")
            }
        }}
      >
        {/* Background Typography (Animated) */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 0.1, y: 20 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          className="w-full flex items-center justify-center py-20 translate-y-20"
        >
            <h1 className="text-[15vw] md:text-[25vw] font-black text-white tracking-[-0.05em] uppercase leading-none">
            MONITOR
            </h1>
        </motion.div>
      </AnimatedShaderHero>

      {/* Pulse Beams Layer */}
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
