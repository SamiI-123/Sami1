import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { 
  TrendingUp, TreePine, Droplets, Thermometer, 
  Map as MapIcon, ChevronRight, Activity, Camera,
  Globe, ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { OFFICIAL_WEBSITE } from '../constants';

const data = [
  { name: 'Mon', wheat: 400, corn: 240, soil: 80 },
  { name: 'Tue', wheat: 300, corn: 139, soil: 82 },
  { name: 'Wed', wheat: 200, corn: 980, soil: 78 },
  { name: 'Thu', wheat: 278, corn: 390, soil: 75 },
  { name: 'Fri', wheat: 189, corn: 480, soil: 85 },
  { name: 'Sat', wheat: 239, corn: 380, soil: 88 },
  { name: 'Sun', wheat: 349, corn: 430, soil: 90 },
];

export default function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Managed Land" 
          value="1,240" 
          unit="Hectares" 
          trend="+5.2%" 
          icon={MapIcon} 
          color="green"
        />
        <StatCard 
          label="Avg Soil Moisture" 
          value="78" 
          unit="%" 
          trend="-2.4%" 
          icon={Droplets} 
          color="tan"
        />
        <StatCard 
          label="Current Health Index" 
          value="94" 
          unit="/100" 
          trend="+1.2%" 
          icon={Activity} 
          color="green"
        />
        <StatCard 
          label="Active Sensors" 
          value="42" 
          unit="Devices" 
          trend="Online" 
          icon={Thermometer} 
          color="tan"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-natural-border shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-bold text-natural-text">Crop Health Analytics</h3>
            <select className="bg-natural-bg border border-natural-border text-xs font-bold uppercase tracking-wider rounded-xl px-4 py-2 outline-none cursor-pointer hover:bg-gray-50 transition-colors">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A6741" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4A6741" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A373" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#D4A373" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0D0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8AA382', fontSize: 10, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#8AA382', fontSize: 10, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: '1px solid #E0E0D0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)', padding: '12px' }}
                />
                <Area type="monotone" dataKey="wheat" stroke="#4A6741" strokeWidth={3} fillOpacity={1} fill="url(#colorGreen)" />
                <Area type="monotone" dataKey="corn" stroke="#D4A373" strokeWidth={3} fillOpacity={1} fill="url(#colorTan)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar / List */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-natural-border shadow-sm">
          <h3 className="text-xl font-bold text-natural-text mb-8">Recent AI Alerts</h3>
          <div className="space-y-6">
            {[
              { title: 'Sector B-12', status: 'Potato Blight', time: 'Sector B-12', color: 'tan' },
              { title: 'Sector A-04', status: 'Water Stress', time: 'Sector A-04', color: 'green' },
              { title: 'Riverside B', status: 'Optimal', time: 'Sector D-01', color: 'green' },
            ].map((report, i) => (
              <div key={i} className="flex items-center gap-5 group cursor-pointer" onClick={() => onNavigate('diagnostics')}>
                <div className={cn(
                  "w-3 h-14 rounded-full transition-all group-hover:scale-y-110",
                  report.color === 'green' ? "bg-primary-green" : "bg-accent-tan"
                )} />
                <div className="flex-1">
                  <p className="font-bold text-natural-text group-hover:text-primary-green transition-colors">{report.title}</p>
                  <p className="text-[10px] text-natural-muted uppercase tracking-widest font-black mt-0.5">{report.status}</p>
                </div>
                <ChevronRight size={18} className="text-natural-border group-hover:text-primary-green transition-transform group-hover:translate-x-1" />
              </div>
            ))}
          </div>

          <div className="mt-10 space-y-3">
            <button 
              onClick={() => onNavigate('diagnostics')}
              className="w-full py-4 rounded-2xl bg-accent-tan text-white text-xs font-black uppercase tracking-widest hover:bg-opacity-90 shadow-lg shadow-accent-tan/20 transition-all flex items-center justify-center gap-2 group"
            >
              <Camera size={16} className="group-hover:rotate-12 transition-transform" />
              Identify Disease
            </button>
            <button className="w-full py-4 rounded-2xl bg-natural-bg border border-natural-border text-xs font-black uppercase tracking-widest text-natural-text hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98]">
              View All Logs
            </button>
            <a 
              href={OFFICIAL_WEBSITE}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-2xl bg-primary-green/5 border border-primary-green/20 text-xs font-black uppercase tracking-widest text-primary-green hover:bg-primary-green/10 transition-all flex items-center justify-center gap-2"
            >
              <Globe size={14} />
              Official Website
              <ExternalLink size={12} className="opacity-50" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, trend, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-natural-border shadow-sm hover:shadow-lg hover:shadow-primary-green/5 transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3",
          color === 'green' ? "bg-[#E9EDC6] text-primary-green" : "bg-[#FFF8F0] text-accent-tan"
        )}>
          <Icon size={28} />
        </div>
        <div className={cn(
          "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full",
          trend.startsWith('+') || trend === 'Online' ? "bg-[#E9EDC6] text-primary-green" : "bg-red-50 text-red-600"
        )}>
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs text-natural-muted font-bold uppercase tracking-wider">{label}</p>
        <h4 className="text-3xl font-bold text-natural-text mt-2 flex items-baseline gap-1">
          {value}<span className="text-sm font-medium opacity-40">{unit}</span>
        </h4>
      </div>
    </div>
  );
}
