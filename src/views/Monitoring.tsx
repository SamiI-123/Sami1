import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Drone as DroneIcon, Video, Camera, Satellite, 
  MapPin, Battery, Signal, Wind, Cloud, RefreshCw, TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Monitoring() {
  const [activeCam, setActiveCam] = useState('main');
  const [isLaunched, setIsLaunched] = useState(true);
  const [telemetry, setTelemetry] = useState({
    alt: 45.2,
    battery: 75,
    speed: 12,
    temp: 24
  });

  // Raspberry Pi Streaming Settings loaded from localStorage
  const [piStreamTunnel] = useState(() => localStorage.getItem('pi_stream_tunnel') || 'https://23655e3abc50784a-196-190-62-88.serveousercontent.com');
  const [piStreamLocal] = useState(() => localStorage.getItem('pi_stream_local') || 'http://172.20.10.6:5001');
  const [piCameraPath] = useState(() => localStorage.getItem('pi_camera_path') || '/video_feed');
  const [piActiveModeDefault] = useState(() => localStorage.getItem('pi_active_mode') || 'tunnel');
  const [piRenderMode] = useState(() => localStorage.getItem('pi_render_mode') || 'image');

  // Direct active toggler for local/remote testing
  const [streamSourceMode, setStreamSourceMode] = useState<'tunnel' | 'local' | 'demo'>(() => {
    return (piActiveModeDefault as 'tunnel' | 'local') || 'tunnel';
  });

  // Compute stream URL
  const baseStreamUrl = streamSourceMode === 'tunnel' ? piStreamTunnel : piStreamLocal;
  const cleanBase = baseStreamUrl.endsWith('/') ? baseStreamUrl.slice(0, -1) : baseStreamUrl;
  const cleanPath = piCameraPath.startsWith('/') ? piCameraPath : '/' + piCameraPath;
  const finalStreamUrl = streamSourceMode === 'demo' ? '' : (cleanBase + cleanPath);

  // Simulating telemetry updates
  React.useEffect(() => {
    if (!isLaunched) return;
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        alt: +(prev.alt + (Math.random() - 0.5) * 0.2).toFixed(1),
        battery: Math.max(0, prev.battery - 0.05),
        speed: +(prev.speed + (Math.random() - 0.5) * 0.5).toFixed(1)
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [isLaunched]);

  const handleControl = (action: string) => {
    if (action === 'launch') setIsLaunched(true);
    if (action === 'land' || action === 'rtl') setIsLaunched(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative aspect-video bg-natural-text rounded-[3rem] overflow-hidden group shadow-2xl border-8 border-white">
             {/* Simulated or Live Video Feed */}
             {streamSourceMode === 'demo' ? (
                <img 
                  src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2026&auto=format&fit=crop" 
                  alt="Drone Feed" 
                  className={cn(
                    "w-full h-full object-cover transition-all duration-1000",
                    isLaunched ? "opacity-90 brightness-110 scale-105" : "opacity-40 grayscale brightness-50 scale-100"
                  )}
                />
             ) : piRenderMode === 'image' ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <img 
                    src={finalStreamUrl} 
                    alt="Pi Stream Live Feed" 
                    referrerPolicy="no-referrer"
                    className={cn(
                      "w-full h-full object-contain transition-all duration-1000",
                      isLaunched ? "opacity-100 brightness-110" : "opacity-30 grayscale brightness-50"
                    )}
                    onError={(e) => {
                      console.warn("Pi Stream connection failed; resetting image background placeholder.");
                      e.currentTarget.style.display = 'none';
                      const errorText = document.getElementById('pi-stream-err');
                      if (errorText) errorText.style.display = 'flex';
                    }}
                    onLoad={() => {
                      const errorText = document.getElementById('pi-stream-err');
                      if (errorText) errorText.style.display = 'none';
                    }}
                  />
                  <div 
                    id="pi-stream-err" 
                    className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/95 text-white space-y-3 z-10"
                    style={{ display: 'none' }}
                  >
                    <Video size={40} className="text-red-400 animate-pulse" />
                    <p className="text-sm font-black uppercase tracking-widest text-red-400">Stream Connection Offline</p>
                    <p className="text-xs text-zinc-400 font-medium max-w-sm leading-relaxed">
                      Unable to connect to <code className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-mono text-[10px] break-all">{finalStreamUrl}</code>.<br />Check your Python setup or switch pipeline modes above.
                    </p>
                  </div>
                </div>
             ) : (
                <iframe
                  src={finalStreamUrl}
                  title="Pi Camera Stream Embed"
                  referrerPolicy="no-referrer"
                  className={cn(
                    "w-full h-full border-none bg-black transition-all duration-1000",
                    isLaunched ? "opacity-100" : "opacity-30 grayscale"
                  )}
                />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
             
             {/* Mission Status Overlay */}
             {!isLaunched && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-10 rounded-[3rem] border-4 border-accent-tan shadow-2xl text-center max-w-sm"
                  >
                     <div className="w-20 h-20 bg-accent-tan/10 rounded-full flex items-center justify-center mx-auto mb-6 text-accent-tan border border-accent-tan/20">
                        <DroneIcon size={40} className="animate-bounce" />
                     </div>
                     <h4 className="text-2xl font-bold text-natural-text mb-2 tracking-tight">System Standby</h4>
                     <p className="text-sm text-natural-muted font-medium mb-8 leading-relaxed">
                       Drone Pioneer ADV-01 is linked and cleared for departure.
                     </p>
                     <button 
                       onClick={() => handleControl('launch')}
                       className="w-full bg-primary-green hover:bg-primary-green/90 text-white font-black py-5 rounded-2xl shadow-xl shadow-primary-green/20 text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                     >
                       <TrendingUp size={20} />
                       Launch Mission
                     </button>
                  </motion.div>
               </div>
             )}

             {/* Overlay HUD */}
             <div className="absolute top-8 left-8 flex gap-4 z-20">
                <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
                   <div className={cn("w-2 h-2 rounded-full", isLaunched ? "bg-accent-tan animate-pulse" : "bg-red-500")}></div>
                   <span className="text-[10px] font-bold text-white tracking-widest uppercase">
                     {streamSourceMode === 'demo' ? 'DEMO MODE' : isLaunched ? 'CAM_01 LIVE' : 'CAM_01 STANDBY'}
                   </span>
                </div>
                {streamSourceMode !== 'demo' && (
                  <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
                     <Signal size={12} className="text-white" />
                     <span className="text-[10px] font-bold text-white tracking-widest uppercase italic">SIGNAL: {isLaunched ? 'EXCELLENT' : 'LOW'}</span>
                  </div>
                )}
             </div>

             {/* Stream Source Selector HUD */}
             <div className="absolute top-8 right-8 flex gap-1.5 z-20 bg-black/40 backdrop-blur-xl p-1 rounded-full border border-white/20">
                <button
                  type="button"
                  onClick={() => setStreamSourceMode('tunnel')}
                  title="Tunnel URL feed"
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all",
                    streamSourceMode === 'tunnel' ? "bg-primary-green text-white shadow-sm" : "text-white/60 hover:text-white"
                  )}
                >
                  Tunnel
                </button>
                <button
                  type="button"
                  onClick={() => setStreamSourceMode('local')}
                  title="Local Wi-Fi IP stream"
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all",
                    streamSourceMode === 'local' ? "bg-primary-green text-white shadow-sm" : "text-white/60 hover:text-white"
                  )}
                >
                  Local IP
                </button>
                <button
                  type="button"
                  onClick={() => setStreamSourceMode('demo')}
                  title="Simulated preview"
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all",
                    streamSourceMode === 'demo' ? "bg-primary-green text-white shadow-sm" : "text-white/60 hover:text-white"
                  )}
                >
                  Demo
                </button>
             </div>

             <div className="absolute bottom-8 right-8 z-20">
                <div className="bg-black/40 backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-white/20 flex flex-col gap-2 min-w-[200px]">
                   <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Battery Status</span>
                      <span className={cn("text-[9px] font-black uppercase tracking-widest", telemetry.battery < 20 ? "text-red-400" : "text-accent-tan")}>
                        {Math.round(telemetry.battery)}%
                      </span>
                   </div>
                   <div className="flex items-center gap-4">
                      <Battery size={18} className={cn("rotate-90", telemetry.battery < 20 ? "text-red-400" : "text-accent-tan")} />
                      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                         <div 
                           className={cn("h-full transition-all duration-500", telemetry.battery < 20 ? "bg-red-400" : "bg-accent-tan")}
                           style={{ width: `${telemetry.battery}%` }}
                         ></div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="absolute bottom-8 left-8 flex gap-4 z-20">
                <button className="bg-white/20 backdrop-blur-xl hover:bg-white text-white hover:text-primary-green p-4 rounded-2xl transition-all shadow-lg active:scale-90 group relative">
                   <Camera size={24} />
                   <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">EXTRACT PHOTO</span>
                </button>
                <button className="bg-accent-tan hover:bg-accent-tan/80 text-white p-4 rounded-2xl transition-all shadow-lg active:scale-90 group relative">
                   <Video size={24} />
                   <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">RECORD CLOSET</span>
                </button>
             </div>
             
             {/* HUD Brackets */}
             <div className="absolute inset-12 pointer-events-none border-x border-white/10 flex flex-col justify-between py-12">
                <div className="flex justify-between items-start">
                   <div className="w-10 h-1 border-t border-l border-white/40"></div>
                   <div className="w-10 h-1 border-t border-r border-white/40"></div>
                </div>
                <div className="flex justify-between items-end">
                   <div className="w-10 h-1 border-b border-l border-white/40"></div>
                   <div className="w-10 h-1 border-b border-r border-white/40"></div>
                </div>
             </div>

             {/* Crosshair */}
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className={cn(
                  "w-16 h-16 border border-dashed border-accent-tan/40 relative rounded-2xl transition-transform duration-700",
                  isLaunched ? "scale-100 rotate-0" : "scale-150 rotate-45 opacity-20"
                )}>
                   <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-accent-tan"></div>
                   <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-accent-tan"></div>
                   
                   {/* Artificial Horizon (Simulated) */}
                   {isLaunched && (
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-px bg-accent-tan/20 animate-pulse"></div>
                     </div>
                   )}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard 
              icon={Wind} 
              label="Wind Speed" 
              value={isLaunched ? `${telemetry.speed} km/h` : "---"} 
              sub={isLaunched ? (telemetry.speed > 20 ? "CAUTION" : "Stable") : "Ready"} 
            />
            <MetricCard 
              icon={Satellite} 
              label="GPS Status" 
              value={isLaunched ? "18 Lkd" : "0 Lkd"} 
              sub={isLaunched ? "RTK Active" : "Searching..."} 
            />
            <MetricCard 
              icon={MapPin} 
              label="Alt. (AGL)" 
              value={isLaunched ? `${telemetry.alt}m` : "Gnd"} 
              sub={isLaunched ? "Target: 50m" : "Pre-flight"} 
            />
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
           {/* Flight Controls */}
           <div className="bg-white rounded-[2.5rem] p-8 border border-natural-border shadow-sm">
              <h4 className="text-xs font-black text-natural-text mb-6 uppercase tracking-widest">Manual Controls</h4>
              <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => handleControl('rtl')}
                   disabled={!isLaunched}
                   className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-natural-border hover:bg-natural-bg disabled:opacity-30 transition-all font-bold group"
                 >
                    <RefreshCw size={20} className="text-primary-green group-hover:rotate-180 transition-transform duration-700" />
                    <span className="text-[10px] uppercase tracking-wider">RTH</span>
                 </button>
                 <button 
                   onClick={() => handleControl('land')}
                   disabled={!isLaunched}
                   className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-natural-border hover:bg-red-50 hover:border-red-100 disabled:opacity-30 transition-all font-bold group"
                 >
                    <TrendingUp className="text-red-500 rotate-180" size={20} />
                    <span className="text-[10px] uppercase tracking-wider">LAND</span>
                 </button>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-8 border border-natural-border shadow-sm">
              <h4 className="text-lg font-bold text-natural-text mb-6">Mission Map</h4>
              <div className="relative aspect-square bg-natural-bg rounded-3xl border border-natural-border overflow-hidden">
                 <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4A6741 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                 <div className="absolute inset-8 border-2 border-dashed border-primary-green/20 rounded-2xl"></div>
                 {isLaunched && (
                   <motion.div 
                     animate={{ 
                       x: [0, 40, 20, -30, 0],
                       y: [0, -20, 30, 10, 0]
                     }}
                     transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                     className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-accent-tan rounded-full shadow-lg shadow-accent-tan/30 ring-4 ring-accent-tan/10"
                   ></motion.div>
                 )}
              </div>
              <p className="text-[10px] text-natural-muted font-bold text-center mt-4 uppercase tracking-widest">
                {isLaunched ? "Sector B Sweep | 12.5% Complete" : "Mission Staget"}
              </p>
           </div>

           <div className="bg-white rounded-[2.5rem] p-8 border border-natural-border shadow-sm">
              <div className="flex items-center justify-between mb-8">
                  <h4 className="text-sm font-black uppercase tracking-widest text-natural-text">Unit Status</h4>
                  <span className={cn(
                    "text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                    isLaunched ? "bg-primary-green/10 text-primary-green" : "bg-red-100 text-red-500"
                  )}>
                    {isLaunched ? "CONNECTED" : "DISCONNECTED"}
                  </span>
              </div>
              <div className="space-y-4">
                 <DroneItem id="ADV-01" name="Pioneer" status={isLaunched ? "In Flight" : "Ready"} active={isLaunched} />
                 <DroneItem id="ADV-02" name="Scout" status="Charging" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-natural-border flex items-center gap-5 shadow-sm hover:translate-y-[-2px] transition-transform">
       <div className="w-12 h-12 bg-natural-bg rounded-2xl flex items-center justify-center text-primary-green border border-natural-border">
          <Icon size={24} />
       </div>
       <div>
          <p className="text-[10px] uppercase font-black text-natural-muted tracking-widest">{label}</p>
          <p className="text-lg font-bold text-natural-text">{value}</p>
          <p className="text-[10px] font-bold text-primary-green opacity-60">{sub}</p>
       </div>
    </div>
  );
}

function DroneItem({ id, name, status, active }: any) {
  return (
    <div className={cn(
      "p-4 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer group",
      active ? "border-primary-green bg-primary-green/5 ring-1 ring-primary-green/20" : "border-natural-border hover:bg-natural-bg"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
        active ? "bg-primary-green text-white" : "bg-natural-bg text-natural-muted"
      )}>
         <DroneIcon size={20} />
      </div>
      <div className="flex-1">
         <p className={cn("text-xs font-black uppercase tracking-wider", active ? "text-primary-green" : "text-natural-text")}>{id} {name}</p>
         <p className="text-[9px] font-bold text-natural-muted opacity-70 uppercase">{status} • {active ? "LTE-U" : "Wired"}</p>
      </div>
    </div>
  );
}
