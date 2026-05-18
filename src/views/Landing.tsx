import React from 'react';
import { motion } from 'motion/react';
import { 
  TreePine, Drone, ShieldCheck, Thermometer, 
  Users, Globe, ArrowRight, CheckCircle2,
  Cpu, Sparkles, Sprout, Satellite
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  const features = [
    {
      icon: Drone,
      title: "Precision Drones",
      description: "Automated aerial surveillance covering thousands of acres in real-time."
    },
    {
      icon: Sparkles,
      title: "AI Diagnostics",
      description: "Proprietary neural networks for instant crop disease classification."
    },
    {
      icon: Cpu,
      title: "IoT Sensor Grids",
      description: "Sub-surface moisture and nutrient monitoring via low-power mesh networks."
    },
    {
      icon: Satellite,
      title: "Remote Monitoring",
      description: "Access your farm's vital signs from anywhere in the world, instantly."
    }
  ];

  return (
    <div className="bg-natural-bg min-h-screen selection:bg-primary-green/20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-natural-border px-6 lg:px-20 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-green rounded-xl flex items-center justify-center shadow-lg group relative overflow-hidden">
            <TreePine className="text-white w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tighter block leading-none text-natural-text uppercase">Agrinovia</span>
            <span className="text-[8px] font-black tracking-[0.2em] uppercase text-primary-green">Bio-Intelligence</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-natural-muted">
          <a href="#features" className="hover:text-primary-green transition-colors">Features</a>
          <a href="#technology" className="hover:text-primary-green transition-colors">Technology</a>
          <a href="#community" className="hover:text-primary-green transition-colors">Community</a>
        </div>

        <button 
          onClick={onStart}
          className="px-6 py-2.5 bg-primary-green text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary-green-dark transition-all shadow-xl shadow-primary-green/20 active:scale-95"
        >
          Launch Platform
        </button>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 lg:px-20 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-green/10 border border-primary-green/20 rounded-full"
            >
              <Sprout className="text-primary-green w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-green">Season 2026 Active</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-8xl font-black text-natural-text leading-[0.9] tracking-tighter"
            >
              Precision <br />
              <span className="text-primary-green">Agriculture</span> <br />
              Redefined.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-natural-muted font-medium max-w-lg leading-relaxed italic"
            >
              "The most advanced ecosystem for high-performance farming. Combining drone surveillance, AI diagnostics, and real-time IoT monitoring into a single orbital dashboard."
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button 
                onClick={onStart}
                className="group px-8 py-4 bg-primary-green text-white rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-primary-green-dark transition-all shadow-2xl shadow-primary-green/40 flex items-center justify-center gap-3"
              >
                Enter Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                className="px-8 py-4 bg-white border border-natural-border text-natural-text rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-natural-bg transition-all"
              >
                Schedule Demo
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-8 pt-8 border-t border-natural-border"
            >
              <div>
                <p className="text-2xl font-black text-natural-text tracking-tight">4.2k+</p>
                <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Active Farms</p>
              </div>
              <div>
                <p className="text-2xl font-black text-natural-text tracking-tight">98.4%</p>
                <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Detection Accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-black text-natural-text tracking-tight">12M+</p>
                <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">Data Points/Day</p>
              </div>
            </motion.div>
          </div>

          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative aspect-square rounded-[4rem] overflow-hidden shadow-2xl skew-y-3"
            >
              <img 
                src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=1000" 
                alt="Smart Farming" 
                className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-green/60 to-transparent" />
              
              {/* Floating UI Elements */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 right-10 bg-white/90 backdrop-blur p-4 rounded-3xl shadow-xl border border-white/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="text-green-600 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-natural-muted">Status</p>
                    <p className="text-xs font-bold text-natural-text">Soil Hydrated</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-10 left-10 bg-primary-green p-4 rounded-3xl shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Drone className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Session</p>
                    <p className="text-xs font-bold text-white">Drone Patrolling</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-green">The Ecosystem</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-natural-text tracking-tighter">Everything your farm needs <br /> to thrive in 2026.</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={feature.title}
                whileHover={{ y: -10 }}
                className="p-8 rounded-[2rem] bg-natural-bg border border-natural-border group hover:border-primary-green/20 transition-all"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:bg-primary-green transition-colors">
                  <feature.icon className="text-primary-green group-hover:text-white transition-colors" size={24} />
                </div>
                <h4 className="text-lg font-bold mb-3 tracking-tight text-natural-text">{feature.title}</h4>
                <p className="text-sm text-natural-muted font-medium leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Call to Action */}
      <section className="py-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto h-[400px] rounded-[4rem] bg-primary-green relative overflow-hidden flex flex-col items-center justify-center text-center p-10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:24px_24px]" />
          </div>
          
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tighter leading-none max-w-2xl">
              Ready to modernize <br /> your agricultural yield?
            </h2>
            <p className="text-accent-tan font-bold uppercase tracking-[0.2em] text-sm opacity-80">
              Join the data-driven revolution today.
            </p>
            <button 
              onClick={onStart}
              className="px-10 py-5 bg-white text-primary-green rounded-2xl text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-2xl active:scale-95"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-natural-border px-6 lg:px-20 text-center">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 grayscale opacity-60">
            <TreePine className="text-natural-text w-5 h-5" />
            <span className="text-sm font-bold tracking-tighter text-natural-text uppercase">Agrinovia Systems</span>
          </div>
          
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-natural-muted">
            <a href="#" className="hover:text-primary-green">Terms</a>
            <a href="#" className="hover:text-primary-green">Privacy</a>
            <a href="#" className="hover:text-primary-green">Contact</a>
            <a href="https://agritche.vercel.com" className="text-primary-green">agritche.vercel.com</a>
          </div>

          <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest opacity-40">
            © 2026 Agrinovia AI Unit. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
