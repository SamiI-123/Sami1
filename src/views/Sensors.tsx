import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  Droplets, Thermometer, Wind, CloudRain, 
  RefreshCw, CircleAlert, CheckCircle2,
  Zap, Power, Waves, Activity, Timer, FileDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { exportToCSV, exportToPDF } from '../lib/exportUtils';

const sensorHistory = [
  { time: '00:00', moisture: 65, temp: 18 },
  { time: '04:00', moisture: 68, temp: 16 },
  { time: '08:00', moisture: 62, temp: 22 },
  { time: '12:00', moisture: 58, temp: 28 },
  { time: '16:00', moisture: 55, temp: 26 },
  { time: '20:00', moisture: 60, temp: 20 },
];

export default function Sensors() {
  const [pumpActive, setPumpActive] = useState(false);
  const [lastRun, setLastRun] = useState('2h 15m ago');
  const [history, setHistory] = useState(sensorHistory);

  // Load configuration from localStorage
  const [piDataTunnel] = useState(() => localStorage.getItem('pi_data_tunnel') || 'https://23655e3abc50784a-196-190-62-88.serveousercontent.com/data');
  const [piDataLocal] = useState(() => localStorage.getItem('pi_data_local') || 'http://172.20.10.6:5001/data');
  const [piActiveMode] = useState(() => localStorage.getItem('pi_active_mode') || 'tunnel');
  const [piSensorSync] = useState(() => localStorage.getItem('pi_sensor_sync') === 'true');
  
  const [liveData, setLiveData] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'fetching' | 'success' | 'failed'>('idle');

  const togglePump = () => {
    setPumpActive(!pumpActive);
    if (!pumpActive) {
      setLastRun('Just now');
    }
  };

  // Raspberry Pi Live sensor fetch
  React.useEffect(() => {
    if (!piSensorSync) return;

    const endpoint = piActiveMode === 'tunnel' ? piDataTunnel : piDataLocal;
    
    const fetchPiData = async () => {
      setConnectionStatus('fetching');
      try {
        // Try proxy bypass route to resolve mixed content in a secure environment
        const proxyUrl = `/api/pi-proxy?url=${encodeURIComponent(endpoint)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error("Proxy fetch failed");
        const json = await res.json();
        
        if (json && typeof json === 'object') {
          setLiveData({
            moisture: typeof json.moisture === 'number' ? json.moisture : 62,
            temp: typeof json.temperature === 'number' ? json.temperature : (typeof json.temp === 'number' ? json.temp : 24),
            humidity: typeof json.humidity === 'number' ? json.humidity : 55
          });
          setConnectionStatus('success');
        }
      } catch (err) {
        console.warn("Proxy telemetry route failed; attempting direct query...", err);
        try {
          const res = await fetch(endpoint);
          const json = await res.json();
          if (json && typeof json === 'object') {
            setLiveData({
              moisture: typeof json.moisture === 'number' ? json.moisture : 62,
              temp: typeof json.temperature === 'number' ? json.temperature : (typeof json.temp === 'number' ? json.temp : 24),
              humidity: typeof json.humidity === 'number' ? json.humidity : 55
            });
            setConnectionStatus('success');
          }
        } catch (e) {
          console.error("Direct fetch also failed:", e);
          setConnectionStatus('failed');
        }
      }
    };

    fetchPiData();
    const intervalId = setInterval(fetchPiData, 10000); // refresh every 10s
    return () => clearInterval(intervalId);
  }, [piSensorSync, piActiveMode, piDataTunnel, piDataLocal]);

  // Handle setting active sensor readings on charts history array
  React.useEffect(() => {
    if (liveData) {
      setHistory(prev => {
        const timeKey = 'Now';
        const exists = prev.some(item => item.time === timeKey);
        if (exists) {
          return prev.map(item => item.time === timeKey ? { ...item, moisture: liveData.moisture, temp: liveData.temp } : item);
        } else {
          return [...prev, { time: timeKey, moisture: liveData.moisture, temp: liveData.temp }];
        }
      });
    }
  }, [liveData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Sensor Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SensorNode 
          id={piSensorSync ? "RASPBERRY-PI" : "NODE-24A"} 
          status={piSensorSync ? (connectionStatus === 'success' ? "online" : connectionStatus === 'fetching' ? "syncing" : "offline") : "online"} 
          battery={piSensorSync ? (connectionStatus === 'success' ? "100%" : "—") : "88%"} 
          location={piSensorSync ? "Linked Sensor Hub" : "North Sector"}
          readings={piSensorSync && liveData ? liveData : { moisture: 62, temp: 24, humidity: 55 }}
          isPi={piSensorSync}
        />
        <SensorNode 
          id="NODE-12B" 
          status="online" 
          battery="42%" 
          location="West Orchard"
          readings={{ moisture: 45, temp: 26, humidity: 48 }}
        />
        <IrrigationCard 
          active={pumpActive} 
          onToggle={togglePump} 
          lastRun={lastRun}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] p-10 border border-natural-border shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-natural-text">Moisture Profile</h3>
                <p className="text-[10px] text-natural-muted font-bold uppercase tracking-wider mt-1">Relative Soil Humidity</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => exportToCSV(sensorHistory, 'moisture_history')}
                  className="p-2.5 rounded-xl bg-natural-bg border border-natural-border text-natural-muted hover:text-primary-green transition-all"
                  title="Export CSV"
                >
                  <FileDown size={18} />
                </button>
                <button 
                  onClick={() => exportToPDF(
                    'Soil Moisture History Report',
                    ['Time', 'Moisture Content (%)'],
                    history.map(d => [d.time, `${d.moisture}%`]),
                    'moisture_report'
                  )}
                  className="p-2.5 rounded-xl bg-natural-bg border border-natural-border text-natural-muted hover:text-accent-tan transition-all"
                  title="Export PDF"
                >
                  <FileDown size={18} />
                </button>
                <div className="flex bg-natural-bg p-1 rounded-xl border border-natural-border">
                   <button className="bg-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-lg border border-natural-border shadow-sm">Live</button>
                   <button className="text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-lg text-natural-muted hover:text-natural-text transition-colors">History</button>
                </div>
              </div>
           </div>
           <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0D0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#8AA382', fontWeight: 600}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#8AA382', fontWeight: 600}} />
                    <Tooltip contentStyle={{ borderRadius: '20px', border: '1px solid #E0E0D0', boxShadow: 'none' }} />
                    <Line type="monotone" dataKey="moisture" stroke="#4A6741" strokeWidth={4} dot={{ fill: '#4A6741', strokeWidth: 2, r: 6 }} activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 border border-natural-border shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-natural-text">Thermal Variation</h3>
                <p className="text-[10px] text-natural-muted font-bold uppercase tracking-wider mt-1">Air Temperature Trends</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => exportToPDF(
                    'Thermal Variation Report',
                    ['Time', 'Temperature (°C)'],
                    history.map(d => [d.time, `${d.temp}°C`]),
                    'thermal_report'
                  )}
                  className="p-2.5 rounded-xl bg-natural-bg border border-natural-border text-natural-muted hover:text-accent-tan transition-all"
                  title="Export PDF"
                >
                  <FileDown size={18} />
                </button>
                <RefreshCw className="text-natural-muted hover:text-primary-green cursor-pointer transition-colors" size={20} />
              </div>
           </div>
           <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0D0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#8AA382', fontWeight: 600}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#8AA382', fontWeight: 600}} />
                    <Tooltip cursor={{fill: '#FDFCF9', radius: 10}} contentStyle={{ borderRadius: '20px', border: '1px solid #E0E0D0' }} />
                    <Bar dataKey="temp" fill="#D4A373" radius={[8, 8, 0, 0]} barSize={40} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}

function SensorNode({ id, status, battery, location, readings }: any) {
  const isOnline = status === 'online';

  return (
    <div className={cn(
      "bg-white p-8 rounded-[2.5rem] border transition-all hover:translate-y-[-4px]",
      isOnline ? "border-natural-border shadow-sm" : "border-red-200 bg-red-50/30 shadow-none"
    )}>
      <div className="flex justify-between items-start mb-8">
         <div>
            <h4 className="font-mono text-[10px] font-black text-natural-muted uppercase tracking-widest mb-1">{id}</h4>
            <p className="text-lg font-bold text-natural-text leading-tight">{location}</p>
         </div>
         <div className={cn(
           "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
           isOnline ? "bg-[#E9EDC6] text-primary-green" : "bg-red-100 text-red-600"
         )}>
           {status}
         </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
         <div className="text-center p-3 rounded-2xl bg-natural-bg border border-natural-border">
            <Droplets className="mx-auto mb-2 text-primary-green opacity-60" size={18} />
            <p className="text-xs font-bold text-natural-text">{readings.moisture}%</p>
         </div>
         <div className="text-center p-3 rounded-2xl bg-natural-bg border border-natural-border">
            <Thermometer className="mx-auto mb-2 text-accent-tan" size={18} />
            <p className="text-xs font-bold text-natural-text">{readings.temp}°C</p>
         </div>
         <div className="text-center p-3 rounded-2xl bg-natural-bg border border-natural-border">
            <Wind className="mx-auto mb-2 text-natural-muted" size={18} />
            <p className="text-xs font-bold text-natural-text">{readings.humidity}%</p>
         </div>
      </div>

      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-8 h-4 bg-natural-bg rounded-full border border-natural-border p-0.5 overflow-hidden">
               <div 
                 className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    parseInt(battery) < 20 ? "bg-red-500" : "bg-accent-tan"
                 )}
                 style={{ width: battery }}
               />
            </div>
            <span className="text-[10px] font-black text-natural-muted uppercase tracking-wider">{battery}</span>
         </div>
         {isOnline ? (
           <CheckCircle2 className="text-primary-green" size={20} />
         ) : (
           <CircleAlert className="text-red-400" size={20} />
         )}
      </div>
    </div>
  );
}

function IrrigationCard({ active, onToggle, lastRun }: any) {
  return (
    <div className={cn(
      "bg-white p-8 rounded-[2.5rem] border transition-all relative overflow-hidden",
      active ? "border-primary-green/30 shadow-xl shadow-primary-green/5" : "border-natural-border shadow-sm"
    )}>
      {active && (
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Activity size={80} className="text-primary-green animate-pulse" />
        </div>
      )}

      <div className="flex justify-between items-start mb-8 relative z-10">
         <div>
            <h4 className="font-mono text-[10px] font-black text-natural-muted uppercase tracking-widest mb-1">MTR-CTRL-01</h4>
            <p className="text-lg font-bold text-natural-text leading-tight">Irrigation Pump</p>
         </div>
         <div className={cn(
           "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
           active ? "bg-primary-green text-white" : "bg-natural-bg text-natural-muted border border-natural-border"
         )}>
           <div className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-white animate-pulse" : "bg-natural-border")} />
           {active ? 'Running' : 'Standby'}
         </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8 relative z-10">
         <div className="p-3 rounded-2xl bg-natural-bg border border-natural-border">
            <div className="flex items-center gap-2 mb-1">
              <Waves size={14} className="text-primary-green" />
              <span className="text-[10px] font-black text-natural-muted uppercase tracking-widest">Flow</span>
            </div>
            <p className="text-xs font-bold text-natural-text">{active ? '12.5 L/m' : '0 L/m'}</p>
         </div>
         <div className="p-3 rounded-2xl bg-natural-bg border border-natural-border">
            <div className="flex items-center gap-2 mb-1">
              <Power size={14} className="text-accent-tan" />
              <span className="text-[10px] font-black text-natural-muted uppercase tracking-widest">Input</span>
            </div>
            <p className="text-xs font-bold text-natural-text">{active ? '0.8 kW' : '15 W'}</p>
         </div>
      </div>

      <div className="flex items-center justify-between relative z-10">
         <div className="flex items-center gap-2">
            <Timer size={14} className="text-natural-muted" />
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wider">{lastRun}</span>
         </div>
         <button 
           onClick={onToggle}
           className={cn(
             "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90",
             active 
              ? "bg-red-500 text-white shadow-red-500/20" 
              : "bg-primary-green text-white shadow-primary-green/20"
           )}
         >
           <Power size={24} />
         </button>
      </div>
    </div>
  );
}
