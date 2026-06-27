import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, CloudRain, ShieldAlert, MapPin, 
  Droplets, Thermometer, Wind, Sun, Check, Info, 
  AlertCircle, ShieldCheck, RefreshCw, Radio, Sparkles, 
  CheckCircle2, Bell, Heart, Gauge, Camera
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '../lib/utils';
import { OFFICIAL_WEBSITE } from '../constants';

// Weather data for the atmospheric climate card
const weatherForecast = [
  { day: 'Today', temp: 24, icon: Sun, label: 'Sunny' },
  { day: 'Sun', temp: 25, icon: Sun, label: 'Sunny' },
  { day: 'Mon', temp: 22, icon: CloudRain, label: 'Showers' },
  { day: 'Tue', temp: 20, icon: CloudRain, label: 'Rain' },
  { day: 'Wed', temp: 23, icon: Sun, label: 'Clear' },
];

// Historical soil data for the chart
const soilHistoryData = [
  { name: 'Mon', moisture: 65, nitrogen: 130, temp: 22 },
  { name: 'Tue', moisture: 68, nitrogen: 128, temp: 21 },
  { name: 'Wed', moisture: 62, nitrogen: 135, temp: 24 },
  { name: 'Thu', moisture: 58, nitrogen: 132, temp: 25 },
  { name: 'Fri', moisture: 55, nitrogen: 125, temp: 26 },
  { name: 'Sat', moisture: 60, nitrogen: 138, temp: 23 },
  { name: 'Sun', moisture: 62, nitrogen: 135, temp: 24 },
];

interface AlertItem {
  id: string;
  type: 'critical' | 'warning' | 'stable';
  title: string;
  message: string;
  time: string;
}

interface Recommendation {
  id: string;
  expert: string;
  advice: string;
  formula: string;
  dosage: string;
  status: 'pending' | 'applied';
}

export default function Dashboard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  // Core Interactive States
  const [soilMoisture, setSoilMoisture] = useState(62);
  const [selectedParcel, setSelectedParcel] = useState<string>('Parcel B-East');
  const [farmerName] = useState('Samson Abreham');

  // Interactive NPK values
  const [simN, setSimN] = useState(135);
  const [simP, setSimP] = useState(52);
  const [simK, setSimK] = useState(212);

  // Dynamic Alerts Feed
  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: 'al-1', type: 'critical', title: 'Nitrogen Boundary warning', message: 'Nitrogen level measured at low bounds of 125 ppm in East Orchard.', time: '2h ago' },
    { id: 'al-2', type: 'warning', title: 'Sub-soil Water Deficit', message: 'Moisture in Sector B-12 dropped near the 45% stress boundary.', time: '4h ago' },
    { id: 'al-3', type: 'stable', title: 'Climate Cleared', message: 'Severe cloudburst hazard passed safely without leaf foliage damage.', time: '1d ago' }
  ]);

  // Expert Recommendations State
  const [recs, setRecs] = useState<Recommendation[]>([
    {
      id: 'rec-1',
      expert: 'Dr. Helen Kassaye',
      advice: 'Apply copper-hydroxide organic dispersion strictly in dry, windless conditions on Sector C.',
      formula: 'Cu(OH)2 Organic',
      dosage: '2.5 kg/hectare',
      status: 'pending'
    },
    {
      id: 'rec-2',
      expert: 'Dr. Helen Kassaye',
      advice: 'Slight nitrogen deficiency observed. Broadcast slow-release organic compost across East Block.',
      formula: 'N-P-K Organic 4-3-2',
      dosage: '150 kg/hectare',
      status: 'pending'
    }
  ]);

  // Toast System
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyRec = (id: string) => {
    setRecs(prev => prev.map(r => r.id === id ? { ...r, status: 'applied' as const } : r));
    triggerToast('Recommendation applied successfully and logged to field ledger!');
  };

  const handleResetNutrients = () => {
    setSimN(135);
    setSimP(52);
    setSimK(212);
    triggerToast('Soil macronutrients balanced to certified baseline.');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-1 lg:px-4 pb-12">
      {/* Toast Alert System */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 z-50 bg-primary-green text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20 text-xs font-bold font-sans"
          >
            <CheckCircle2 size={16} className="text-accent-tan" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Branding Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-natural-border/30">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-green bg-primary-green/10 px-4 py-1.5 rounded-full inline-block mb-3 border border-primary-green/20 shadow-xs">
            ⚡ UNIFIED FARM DATA
          </span>
          <h2 className="text-3xl font-black text-natural-text tracking-tight flex items-center gap-3">
            Farmer Control Desk
            <span className="text-xs bg-accent-tan/20 text-accent-tan border border-accent-tan/30 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
              North Ridge Hub
            </span>
          </h2>
          <p className="text-natural-muted font-medium italic text-sm mt-1">
            Real-time farm status, live regional weather, active warnings, IoT soil diagnostics, and expert guidelines.
          </p>
        </div>

        {/* Action Link to Official Page */}
        <div className="shrink-0">
          <a 
            href={OFFICIAL_WEBSITE}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-white border border-natural-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-natural-bg/50 transition-colors flex items-center gap-2 shadow-xs"
          >
            <Radio size={14} className="text-primary-green animate-pulse" />
            Launch Server Portal
          </a>
        </div>
      </div>

      {/* Main Single-Screen Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ================= COLUMN 1: FARM STATUS, LOCATION & WEATHER ================= */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Farm General Vigor Status Card */}
          <div className="bg-gradient-to-br from-[#E9EDC6]/40 to-white p-6 rounded-3xl border border-[#E9EDC6] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-primary-green tracking-wider">General Vigor Status</p>
                <h3 className="text-2xl font-black text-natural-text mt-1">Excellent Vigor</h3>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl border border-primary-green/20 flex items-center justify-center text-primary-green">
                <Sprout size={24} />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-natural-border/20 pb-1.5">
                <span className="text-natural-muted font-semibold">Registered Owner</span>
                <span className="text-natural-text font-bold">{farmerName}</span>
              </div>
              <div className="flex justify-between border-b border-natural-border/20 pb-1.5">
                <span className="text-natural-muted font-semibold">Primary Crop</span>
                <span className="text-natural-text font-bold">Sidama Arabica Coffee</span>
              </div>
              <div className="flex justify-between border-b border-natural-border/20 pb-1.5">
                <span className="text-natural-muted font-semibold">Total Area</span>
                <span className="text-natural-text font-bold">1,240 Hectares</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-natural-muted font-semibold">Vigor Coefficient</span>
                <span className="text-primary-green font-bold flex items-center gap-1">
                  <Heart size={12} className="fill-primary-green" /> 94.2%
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Geographic Boundaries */}
          <div className="bg-white border border-natural-border p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-extrabold text-xs text-natural-text uppercase tracking-wider flex items-center gap-2">
                <MapPin size={14} className="text-primary-green" />
                Field Boundaries
              </h4>
              <span className="font-mono text-[9px] text-natural-muted font-bold">7.6744° N, 36.8354° E</span>
            </div>

            {/* Quick mini parcel maps */}
            <p className="text-[11px] text-natural-muted leading-relaxed">
              Select an active parcel area below to inspect soil moisture boundaries and crop diagnostics:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Parcel A-North', label: 'Parcel A (Wheat)', size: '320 Ha' },
                { id: 'Parcel B-East', label: 'Parcel B (Coffee)', size: '480 Ha' },
                { id: 'Parcel C-South', label: 'Parcel C (Barley)', size: '190 Ha' },
                { id: 'Parcel D-Wetlands', label: 'Parcel D (Rice)', size: '250 Ha' },
              ].map((parcel) => (
                <button
                  key={parcel.id}
                  onClick={() => {
                    setSelectedParcel(parcel.id);
                    triggerToast(`Active monitoring focus shifted to ${parcel.id}`);
                  }}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    selectedParcel === parcel.id 
                      ? "border-primary-green bg-primary-green/5 ring-1 ring-primary-green/20" 
                      : "border-natural-border/40 bg-[#FAF9F6] hover:bg-natural-bg/50"
                  )}
                >
                  <p className="text-[10px] font-black text-natural-text leading-tight">{parcel.label}</p>
                  <p className="text-[8px] text-natural-muted font-bold uppercase mt-0.5">{parcel.size}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Atmospheric Weather Widget */}
          <div className="bg-white border border-natural-border p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-extrabold text-xs text-natural-text uppercase tracking-wider flex items-center gap-2">
                <Sun size={14} className="text-accent-tan" />
                Atmospheric Climate
              </h4>
              <span className="text-[9px] font-bold text-primary-green uppercase tracking-wider">LIVE FEED</span>
            </div>

            <div className="flex items-center justify-between bg-natural-bg/50 p-4 rounded-2xl border">
              <div>
                <p className="text-[10px] font-black uppercase text-natural-muted tracking-wider">Current Forecast</p>
                <h3 className="text-2xl font-black text-natural-text mt-0.5">24°C</h3>
                <p className="text-[10px] text-natural-muted font-bold mt-1">12 km/h NW | Humidity 54%</p>
              </div>
              <div className="text-center">
                <Sun size={28} className="text-accent-tan mx-auto animate-spin-slow" />
                <span className="text-[9px] font-bold text-natural-muted block mt-1 uppercase">Clear Sky</span>
              </div>
            </div>

            {/* 5-Day Horizontal Forecast strip */}
            <div className="grid grid-cols-5 gap-1.5 pt-2">
              {weatherForecast.map((w, idx) => (
                <div key={idx} className="bg-[#FAF9F6] p-2 rounded-xl text-center border border-natural-border/30">
                  <p className="text-[9px] font-bold text-natural-muted leading-none mb-1">{w.day}</p>
                  <w.icon size={14} className="text-primary-green/80 mx-auto mb-1" />
                  <p className="text-[10px] font-black text-natural-text leading-none">{w.temp}°C</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ================= COLUMN 2: IoT SENSORS & DECENTRALIZED DATA ================= */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Soil Moisture Interactive Node */}
          <div className="bg-white border border-natural-border p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-natural-muted">Soil Moisture Index</p>
                <h4 className="text-2xl font-black text-natural-text mt-1">{soilMoisture}%</h4>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Droplets size={20} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-natural-muted font-bold">
                <span>Current Status</span>
                <span className="text-blue-600">Stable (Optimum Range)</span>
              </div>
              <div className="w-full bg-natural-bg h-2 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${soilMoisture}%` }} />
              </div>
            </div>

            {/* Quick Action Simulator triggers */}
            <div className="flex gap-2 pt-1">
              <button 
                onClick={() => {
                  setSoilMoisture(prev => Math.min(100, prev + 5));
                  triggerToast('Discharged localized drip-irrigation cycles on focus parcel.');
                }}
                className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all"
              >
                Water Field
              </button>
              <button 
                onClick={() => {
                  setSoilMoisture(prev => Math.max(0, prev - 5));
                  triggerToast('Simulated sun evaporation cycles.');
                }}
                className="flex-1 py-2 bg-neutral-50 hover:bg-neutral-100 text-natural-muted text-[9px] font-bold uppercase tracking-wider rounded-xl transition-all border"
              >
                Evaporate
              </button>
            </div>
          </div>

          {/* NPK Macronutrients & Mineralization */}
          <div className="bg-white border border-natural-border p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-natural-muted">Macronutrient N-P-K Readings</p>
                <h4 className="text-base font-black text-natural-text mt-1">
                  N: <span className="text-primary-green">{simN}</span> | P: <span className="text-accent-tan">{simP}</span> | K: <span className="text-amber-600">{simK}</span> <span className="text-[10px] font-normal text-natural-muted font-sans">ppm</span>
                </h4>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Gauge size={20} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/30">
                <p className="text-[9px] font-bold text-natural-muted">Nitrogen (N)</p>
                <div className="flex justify-center items-center gap-1 mt-1">
                  <button onClick={() => setSimN(prev => Math.max(0, prev - 10))} className="w-4 h-4 bg-white border text-[10px] font-black flex items-center justify-center rounded hover:bg-neutral-50">-</button>
                  <span className="text-[11px] font-black font-mono">{simN}</span>
                  <button onClick={() => setSimN(prev => prev + 10)} className="w-4 h-4 bg-white border text-[10px] font-black flex items-center justify-center rounded hover:bg-neutral-50">+</button>
                </div>
              </div>

              <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/30">
                <p className="text-[9px] font-bold text-natural-muted">Phosphorus (P)</p>
                <div className="flex justify-center items-center gap-1 mt-1">
                  <button onClick={() => setSimP(prev => Math.max(0, prev - 5))} className="w-4 h-4 bg-white border text-[10px] font-black flex items-center justify-center rounded hover:bg-neutral-50">-</button>
                  <span className="text-[11px] font-black font-mono">{simP}</span>
                  <button onClick={() => setSimP(prev => prev + 5)} className="w-4 h-4 bg-white border text-[10px] font-black flex items-center justify-center rounded hover:bg-neutral-50">+</button>
                </div>
              </div>

              <div className="bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/30">
                <p className="text-[9px] font-bold text-natural-muted">Potassium (K)</p>
                <div className="flex justify-center items-center gap-1 mt-1">
                  <button onClick={() => setSimK(prev => Math.max(0, prev - 15))} className="w-4 h-4 bg-white border text-[10px] font-black flex items-center justify-center rounded hover:bg-neutral-50">-</button>
                  <span className="text-[11px] font-black font-mono">{simK}</span>
                  <button onClick={() => setSimK(prev => prev + 15)} className="w-4 h-4 bg-white border text-[10px] font-black flex items-center justify-center rounded hover:bg-neutral-50">+</button>
                </div>
              </div>
            </div>

            <button
              onClick={handleResetNutrients}
              className="w-full text-center py-2 bg-[#FAF9F6] border border-natural-border text-[9px] font-black uppercase tracking-widest text-neutral-800 hover:bg-natural-bg/50 rounded-xl transition-all"
            >
              Recalibrate Macronutrients Balance &larr;
            </button>
          </div>

          {/* Crop Climate Monitoring & Soil Temp / Humidity */}
          <div className="bg-white border border-natural-border p-6 rounded-3xl space-y-4">
            <h4 className="font-extrabold text-xs text-natural-text uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <Thermometer size={14} className="text-primary-green" />
              Sensor Environment Bounds
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-natural-bg/50 rounded-2xl border text-center">
                <Thermometer size={20} className="text-orange-500 mx-auto mb-1.5" />
                <p className="text-[10px] font-bold text-natural-muted uppercase">Soil Temp</p>
                <p className="text-base font-black text-natural-text mt-0.5">22.4 °C</p>
                <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase mt-1 inline-block">OPTIONAL</span>
              </div>

              <div className="p-4 bg-natural-bg/50 rounded-2xl border text-center">
                <Wind size={20} className="text-blue-400 mx-auto mb-1.5" />
                <p className="text-[10px] font-bold text-natural-muted uppercase">Soil Humidity</p>
                <p className="text-base font-black text-natural-text mt-0.5">62% RH</p>
                <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase mt-1 inline-block">STABLE</span>
              </div>
            </div>
          </div>

        </div>

        {/* ================= COLUMN 3: DRONE IMAGES, ALERTS & EXPERTS ================= */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Active Field Alerts System */}
          <div className="bg-white border border-natural-border p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-extrabold text-xs text-natural-text uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert size={14} className="text-red-500 animate-pulse" />
                Alerts & Security
              </h4>
              <span className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded font-mono">
                {alerts.filter(a => a.type === 'critical').length} Urgent
              </span>
            </div>

            <div className="space-y-3 max-h-[160px] overflow-y-auto no-scrollbar">
              {alerts.map((al) => (
                <div 
                  key={al.id}
                  className={cn(
                    "p-3 rounded-xl border bg-white flex items-start gap-2.5 transition-transform hover:-translate-y-0.5",
                    al.type === 'critical' ? "border-red-100" : al.type === 'warning' ? "border-amber-100" : "border-emerald-100"
                  )}
                >
                  <div className={cn(
                    "p-1 rounded-lg shrink-0 mt-0.5",
                    al.type === 'critical' ? "bg-red-50 text-red-600" : al.type === 'warning' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    <AlertCircle size={12} />
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[7px] font-black uppercase tracking-wider text-natural-muted">{al.type}</span>
                      <span className="text-[7px] text-natural-muted/60 font-mono">{al.time}</span>
                    </div>
                    <h5 className="text-[10px] font-extrabold text-neutral-800 leading-tight">{al.title}</h5>
                    <p className="text-[9px] text-natural-muted leading-relaxed truncate">{al.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expert Recommendations Ledger */}
          <div className="bg-white border border-natural-border p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-extrabold text-xs text-natural-text uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={14} className="text-primary-green" />
                Expert Recommendations
              </h4>
              <span className="text-[9px] font-bold bg-[#E9EDC6] text-primary-green px-2 py-0.5 rounded uppercase">Verified</span>
            </div>

            <div className="space-y-3">
              {recs.map((r) => (
                <div key={r.id} className="bg-natural-bg/50 p-4 rounded-2xl border border-natural-border/30 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-neutral-800 leading-none">{r.expert}</p>
                      <p className="text-[8px] text-natural-muted mt-0.5 font-bold uppercase tracking-wider">{r.formula} ({r.dosage})</p>
                    </div>
                    <span className={cn(
                      "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider",
                      r.status === 'applied' ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                    )}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-natural-muted leading-relaxed font-medium italic">
                    "{r.advice}"
                  </p>
                  {r.status === 'pending' && (
                    <button
                      onClick={() => handleApplyRec(r.id)}
                      className="w-full text-center py-1.5 bg-white border hover:bg-natural-bg/30 text-[9px] font-black uppercase tracking-widest text-primary-green rounded-xl transition-all"
                    >
                      Apply Action
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Drone Aerial Health Inspection Frame */}
          <div className="bg-white border border-natural-border p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-extrabold text-xs text-natural-text uppercase tracking-wider flex items-center gap-2">
                <Camera size={14} className="text-primary-green" />
                Aerial Disease Scan
              </h4>
              <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded font-mono">91% Rust rust risk</span>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-video bg-neutral-100 border border-natural-border">
              <img 
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop" 
                alt="Coffee Leaf Scan" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-2 left-2 bg-black/70 text-white text-[8px] font-mono tracking-wider px-2 py-0.5 rounded">
                NDVI SPECTRAL SCAN
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 text-white">
                <p className="text-[10px] font-bold leading-tight">Coffee Leaf Rust (Hemileia vastatrix) suspected</p>
                <p className="text-[8px] opacity-70 mt-0.5">Focus Area: East Orchard Block 12</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Historical chart at the bottom */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-natural-border shadow-xs">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <h4 className="font-bold text-base text-neutral-800">Weekly Environmental Aggregation</h4>
            <p className="text-xs text-natural-muted">Soil moisture trends mapped against nitrogen mineralization limits.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary-green">
              <span className="w-2 h-2 rounded-full bg-primary-green" /> Nitrogen mineral (ppm)
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-accent-tan">
              <span className="w-2 h-2 rounded-full bg-accent-tan" /> Soil moisture index (%)
            </span>
          </div>
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={soilHistoryData}>
              <defs>
                <linearGradient id="colorPrimaryGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4A6741" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#4A6741" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAccentTan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A373" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#D4A373" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0D0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8AA382', fontSize: 10, fontWeight: 600}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#8AA382', fontSize: 10, fontWeight: 600}} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #E0E0D0' }} />
              <Area type="monotone" dataKey="nitrogen" stroke="#4A6741" strokeWidth={3} fillOpacity={1} fill="url(#colorPrimaryGreen)" />
              <Area type="monotone" dataKey="moisture" stroke="#D4A373" strokeWidth={3} fillOpacity={1} fill="url(#colorAccentTan)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
