"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface Node {
  id: number;
  x: number;
  y: number;
  z: number;
  r: number;
}

interface Connection {
  from: number;
  to: number;
}

export const NeuralSphere = ({ isHovered = false }: { isHovered?: boolean }) => {
  const nodeCount = 40;
  
  // Create a sphere of nodes
  const nodes: Node[] = useMemo(() => {
    const temp: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
        const phi = Math.acos(-1 + (2 * i) / nodeCount);
        const theta = Math.sqrt(nodeCount * Math.PI) * phi;
        
        temp.push({
          id: i,
          x: Math.cos(theta) * Math.sin(phi) * 100,
          y: Math.sin(theta) * Math.sin(phi) * 100,
          z: Math.cos(phi) * 100,
          r: Math.random() * 2 + 1,
        });
    }
    return temp;
  }, []);

  // Create connections between close nodes
  const connections: Connection[] = useMemo(() => {
    const temp: Connection[] = [];
    for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
            const dist = Math.sqrt(
                Math.pow(nodes[i].x - nodes[j].x, 2) +
                Math.pow(nodes[i].y - nodes[j].y, 2) +
                Math.pow(nodes[i].z - nodes[j].z, 2)
            );
            if (dist < 60) {
                temp.push({ from: i, to: j });
            }
        }
    }
    return temp;
  }, [nodes]);

  return (
    <div className="relative w-full h-[400px] md:h-[600px] flex items-center justify-center pointer-events-none select-none">
      <motion.svg
        viewBox="-150 -150 300 300"
        className="w-full h-full max-w-[500px]"
        animate={{
          rotateY: 360,
          rotateZ: [0, 10, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <defs>
          <radialGradient id="nodeGlow">
            <stop offset="0%" stopColor="var(--primary, #3b82f6)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--primary, #3b82f6)" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connections */}
        {connections.map((conn, idx) => (
          <motion.line
            key={`conn-${idx}`}
            x1={nodes[conn.from].x}
            y1={nodes[conn.from].y}
            x2={nodes[conn.to].x}
            y2={nodes[conn.to].y}
            stroke="var(--primary, #3b82f6)"
            strokeWidth="0.5"
            initial={{ opacity: 0.1 }}
            animate={{ 
              opacity: isHovered ? 0.4 : [0.1, 0.2, 0.1],
              strokeWidth: isHovered ? 0.8 : 0.5
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2
            }}
          />
        ))}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={`node-${node.id}`}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill="var(--primary, #3b82f6)"
              animate={{
                opacity: isHovered ? 1 : [0.4, 0.8, 0.4],
                scale: isHovered ? 1.2 : [1, 1.2, 1],
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2
              }}
              filter="url(#glow)"
            />
          </g>
        ))}
      </motion.svg>
      
      {/* Ambient background glow */}
      <div className="absolute inset-0 z-[-1] opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500 rounded-full blur-[100px]" />
      </div>
    </div>
  );
};
