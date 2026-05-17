import React from 'react';
import { motion } from 'motion/react';
import { TreePine, Cpu, Zap, Microscope, Globe } from 'lucide-react';

export default function About() {
  const pillars = [
    {
      icon: Cpu,
      title: "IoT Intelligence",
      description: "Harnessing real-time sensor arrays for precise environmental monitoring."
    },
    {
      icon: Microscope,
      title: "AI Diagnostics",
      description: "Powered by PlantVillage algorithms for early-stage disease detection."
    },
    {
      icon: Zap,
      title: "Automation",
      description: "Seamless drone dispatch and irrigation triggers for optimized yields."
    },
    {
      icon: Globe,
      title: "Ecosystem",
      description: "A borderless platform bridging technology and traditional farming."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex p-4 bg-primary-green/10 rounded-3xl"
        >
          <TreePine className="text-primary-green w-12 h-12" />
        </motion.div>
        
        <h1 className="text-4xl font-black tracking-tight text-natural-text">
          About Agrinovia
        </h1>
        
        <p className="text-xl text-natural-muted font-medium leading-relaxed max-w-2xl mx-auto italic">
          "Agrinovia is a high-performance ecosystem designed to empower farmers with real-time IoT intelligence, plantvillage AI-driven diagnostics, and seamless automation."
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pillars.map((pillar, idx) => (
          <motion.div 
            key={pillar.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-natural-border shadow-sm hover:shadow-xl hover:border-primary-green/20 transition-all group"
          >
            <div className="w-14 h-14 bg-natural-bg rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <pillar.icon className="text-primary-green" size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2 uppercase tracking-wide text-natural-text">{pillar.title}</h3>
            <p className="text-sm text-natural-muted font-medium leading-relaxed">
              {pillar.description}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-primary-green text-white p-10 rounded-[3rem] text-center space-y-4 shadow-2xl shadow-primary-green/20"
      >
        <h2 className="text-2xl font-black uppercase tracking-[0.2em] mb-4">The Future of Farming</h2>
        <div className="h-px bg-white/20 w-32 mx-auto" />
        <p className="text-sm font-bold text-accent-tan uppercase tracking-widest max-w-lg mx-auto leading-loose opacity-80">
          Equipping the modern agriculturist with the tools of computational biology and remote sensing.
        </p>
      </motion.div>

      <footer className="text-center pt-10 space-y-4">
        <div className="flex justify-center gap-4">
          <a 
            href="https://agritche.vercel.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-6 py-2 bg-natural-bg border border-natural-border rounded-xl text-xs font-bold text-primary-green hover:bg-primary-green hover:text-white transition-all inline-flex items-center gap-2"
          >
            <Globe size={14} />
            Official Website
          </a>
        </div>
        <p className="text-[10px] font-black text-natural-muted uppercase tracking-[0.3em]">
          Agrinovia Systems v1.4.2 // Advanced Bio-Intelligence Unit
        </p>
      </footer>
    </div>
  );
}
