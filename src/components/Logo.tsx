import React from 'react';
import { motion } from 'motion/react';

export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-10 h-10">
        <motion.svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Background Hexagon */}
          <motion.path
            d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary/20"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Stylized 'S' / Mountain */}
          <motion.path
            d="M30 70 L50 30 L70 70 M40 50 L60 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          
          {/* Pulse Dot */}
          <motion.circle
            cx="50"
            cy="30"
            r="4"
            className="fill-primary"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.svg>
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-extrabold tracking-tighter leading-none bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">SUGD AI</span>
        <span className="text-[9px] uppercase tracking-[0.3em] text-indigo-400/80 font-bold">Azam Corp Enterprise</span>
      </div>
    </div>
  );
};
