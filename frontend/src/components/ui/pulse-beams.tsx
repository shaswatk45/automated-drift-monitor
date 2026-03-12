"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BeamPath {
  path: string;
  gradientConfig: {
    initial: {
      x1: string;
      x2: string;
      y1: string;
      y2: string;
    };
    animate: {
      x1: string | string[];
      x2: string | string[];
      y1: string | string[];
      y2: string | string[];
    };
    transition?: {
      duration?: number;
      repeat?: number;
      repeatType?: "loop" | "reverse" | "mirror";
      ease?: string;
      repeatDelay?: number;
      delay?: number;
    };
  };
  connectionPoints?: Array<{
    cx: number;
    cy: number;
    r: number;
  }>;
}

interface PulseBeamsProps {
  children?: React.ReactNode;
  className?: string;
  background?: React.ReactNode;
  beams?: BeamPath[];
  width?: number;
  height?: number;
  baseColor?: string;
  accentColor?: string;
  gradientColors?: {
    start: string;
    middle: string;
    end: string;
  };
}

export const PulseBeams = ({
  children,
  className,
  background,
  beams = defaultBeams,
  width = 858,
  height = 434,
  baseColor = "var(--slate-800)",
  accentColor = "var(--slate-600)",
  gradientColors,
}: PulseBeamsProps) => {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center antialiased",
        className
      )}
    >
      {background}
      <div className="relative z-10">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <SVGs
          beams={beams}
          width={width}
          height={height}
          baseColor={baseColor}
          accentColor={accentColor}
          gradientColors={gradientColors}
        />
      </div>
    </div>
  );
};

const SVGs = ({ 
  beams, 
  width, 
  height, 
  baseColor, 
  accentColor, 
  gradientColors 
}: { 
  beams: BeamPath[]; 
  width: number; 
  height: number; 
  baseColor: string; 
  accentColor: string; 
  gradientColors?: { start: string; middle: string; end: string; } 
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex flex-shrink-0 overflow-visible"
    >
      {beams.map((beam, index) => (
        <React.Fragment key={index}>
          <path
            d={beam.path}
            stroke={baseColor}
            strokeWidth="0.5"
            strokeOpacity="0.2"
          />
          <path
            d={beam.path}
            stroke={`url(#grad${index})`}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {beam.connectionPoints?.map((point: { cx: number; cy: number; r: number }, pointIndex: number) => (
            <circle
              key={`${index}-${pointIndex}`}
              cx={point.cx}
              cy={point.cy}
              r={point.r}
              fill={baseColor}
              fillOpacity="0.1"
              stroke={accentColor}
              strokeOpacity="0.3"
            />
          ))}
        </React.Fragment>
      ))}

      <defs>
        {beams.map((beam: BeamPath, index: number) => (
          <motion.linearGradient
            key={index}
            id={`grad${index}`}
            gradientUnits="userSpaceOnUse"
            initial={beam.gradientConfig.initial}
            animate={beam.gradientConfig.animate}
            transition={beam.gradientConfig.transition}
          >
            <GradientColors colors={gradientColors} />
          </motion.linearGradient>
        ))}
      </defs>
    </svg>
  );
};

const GradientColors = ({ colors = {
  start: "#18CCFC",
  middle: "#6344F5",
  end: "#AE48FF"
} }) => {
  return (
    <>
      <stop offset="0%" stopColor={colors.start} stopOpacity="0" />
      <stop offset="20%" stopColor={colors.start} stopOpacity="1" />
      <stop offset="50%" stopColor={colors.middle} stopOpacity="1" />
      <stop offset="100%" stopColor={colors.end} stopOpacity="0" />
    </>
  );
};

const defaultBeams: BeamPath[] = [
  {
    path: "M100 0V200H0",
    gradientConfig: {
      initial: { x1: "0%", x2: "0%", y1: "0%", y2: "0%" },
      animate: {
        x1: ["0%", "100%", "100%"],
        x2: ["0%", "80%", "80%"],
        y1: ["0%", "0%", "100%"],
        y2: ["0%", "0%", "80%"]
      },
      transition: { duration: 3, repeat: Infinity, ease: "linear", repeatType: "loop" }
    }
  },
  {
    path: "M758 0V200H858",
    gradientConfig: {
      initial: { x1: "100%", x2: "100%", y1: "0%", y2: "0%" },
      animate: {
        x1: ["100%", "0%", "0%"],
        x2: ["100%", "20%", "20%"],
        y1: ["0%", "0%", "100%"],
        y2: ["0%", "0%", "80%"]
      },
      transition: { duration: 3, repeat: Infinity, ease: "linear", repeatType: "loop", delay: 1.5 }
    }
  }
];
