import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, FileSearch, MessageSquare, ClipboardCheck,
  Microscope, Activity, Server, AlertTriangle, 
  Search, MoreHorizontal, CheckCircle2, XCircle,
  TrendingUp, Thermometer, Droplets, Zap
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

export default function ExpertConsole() {
  const { user } = useAuth();
  const [stats] = useState([
    { label: 'Verified Cases', value: '154', change: '+8 today', icon: ClipboardCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Response Time', value: '42m', change: '-5m', icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Advisories', value: '12', change: 'Live', icon: Server, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Unresolved Alerts', value: '5', change: 'Priority', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]);

  const [pendingReviews] = useState<any[]>([
    { id: '1', crop: 'Wheat', issue: 'Rust Fungus suspected', farmer: 'Abebe B.', severity: 'High', date: '2h ago', location: 'Sector A-12' },
    { id: '2', crop: 'Corn', issue: 'Nitrogen Deficiency', farmer: 'Martha G.', severity: 'Medium', date: '5h ago', location: 'Sector B-04' },
    { id: '3', crop: 'Tomato', issue: 'Possible Late Blight', farmer: 'Kebede S.', severity: 'High', date: '1d ago', location: 'Sector D-09' },
  ]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-natural-text tracking-tight">Expert Analysis Console</h2>
          <p className="text-natural-muted font-medium italic">Empowering diagnostics through expert verification and AI synergy.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white border border-natural-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-natural-bg transition-colors flex items-center gap-2">
            <TrendingUp size={14} />
            Diagnostic Trends
          </button>
          <button className="px-6 py-3 bg-primary-green text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-primary-green/20 flex items-center gap-2">
            <Zap size={14} />
            Publish Advisory
          </button>
        </div>
      </div>

      {/* High-Level Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-natural-border shadow-sm flex items-center gap-5 group hover:border-primary-green/20 transition-all"
          >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform", stat.bg)}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-natural-muted uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-natural-text">{stat.value}</span>
                <span className="text-[10px] font-bold text-green-600">{stat.change}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification Queue */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[2.5rem] border border-natural-border shadow-sm overflow-hidden">
            <div className="p-8 border-b border-natural-border flex items-center justify-between bg-blue-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-natural-border flex items-center justify-center">
                  <Microscope size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-natural-text uppercase tracking-wide">Verification Queue</h3>
                  <p className="text-[10px] text-natural-muted font-bold uppercase tracking-widest">Pending Specialist Approval</p>
                </div>
              </div>
              <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-blue-600/20">3 CRITICAL</span>
            </div>
            
            <div className="divide-y divide-natural-bg">
              {pendingReviews.map((review, idx) => (
                <motion.div 
                  key={review.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (idx * 0.1) }}
                  className="p-8 hover:bg-natural-bg/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                >
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-white rounded-2xl border-2 border-natural-border flex flex-col items-center justify-center shadow-sm group-hover:border-blue-600/30 transition-colors shrink-0">
                      <p className="text-[8px] font-black text-natural-muted uppercase mb-1">CROP</p>
                      <p className="text-xs font-black text-primary-green">{review.crop}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-bold text-lg text-neutral-800">{review.issue}</p>
                        <span className={cn(
                          "text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-tighter",
                          review.severity === 'High' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                        )}>
                          {review.severity}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <p className="text-xs text-natural-muted font-medium flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-blue-600" />
                          Expert Review Req.
                        </p>
                        <p className="text-xs text-natural-muted font-medium">Farmer: {review.farmer}</p>
                        <p className="text-xs text-natural-muted font-medium">Location: {review.location}</p>
                        <p className="text-[10px] text-natural-muted/60 font-black uppercase tracking-widest">{review.date}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button className="px-6 py-3 bg-white border border-natural-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-natural-bg transition-colors">
                      Reject
                    </button>
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                      Verify & Advise
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Expert Discussions / Community Support */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-natural-border shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold flex items-center gap-2 text-natural-text">
                <MessageSquare size={20} className="text-primary-green" />
                Professional Inquiries
              </h3>
              <button className="text-[10px] font-black text-primary-green uppercase tracking-widest hover:underline">View All Tickets</button>
            </div>
            
            <div className="space-y-4">
              {[
                { title: 'Optimizing Irrigation for Potato Blight', sender: 'Farmer Elias', status: 'Priority' },
                { title: 'Soil pH Anomaly in Sector C', sender: 'Field Agent Sarah', status: 'Stable' },
              ].map((msg, i) => (
                <div key={i} className="p-6 bg-natural-bg/30 rounded-3xl border border-natural-border flex items-center justify-between group hover:border-primary-green/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-natural-border flex items-center justify-center font-bold text-primary-green">
                      {msg.sender[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-natural-text group-hover:text-primary-green transition-colors">{msg.title}</p>
                      <p className="text-[10px] text-natural-muted font-bold uppercase tracking-widest">{msg.sender}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-natural-muted" />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="space-y-8">
          <section className="bg-white rounded-[2.5rem] p-8 border border-natural-border shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-8 text-natural-text">
              <Activity size={20} className="text-primary-green" />
              Regional Health Map
            </h3>
            
            <div className="space-y-6">
              {[
                { label: 'Humidity Tolerance', val: 78, color: 'bg-blue-500' },
                { label: 'Pathogen Spread Risk', val: 34, color: 'bg-red-500' },
                { label: 'Soil Nutrient Stability', val: 92, color: 'bg-green-500' },
              ].map(metric => (
                <div key={metric.label}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black text-natural-muted uppercase tracking-widest">{metric.label}</p>
                    <p className="text-xs font-bold text-natural-text">{metric.val}%</p>
                  </div>
                  <div className="h-2 bg-natural-bg rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.val}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={cn("h-full rounded-full", metric.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-primary-green/5 rounded-[2.5rem] p-8 border-2 border-primary-green/10">
            <h4 className="text-sm font-black text-primary-green uppercase tracking-[0.2em] mb-4">Specialist Protocol</h4>
            <ul className="space-y-4">
              <li className="flex gap-3 text-xs text-natural-text font-medium leading-relaxed">
                <CheckCircle2 size={16} className="text-primary-green shrink-0" />
                Cross-reference visual symptoms with sensor arrays before verification.
              </li>
              <li className="flex gap-3 text-xs text-natural-text font-medium leading-relaxed">
                <CheckCircle2 size={16} className="text-primary-green shrink-0" />
                Priority given to High-Severity cases in Sector A.
              </li>
              <li className="flex gap-3 text-xs text-natural-text font-medium leading-relaxed">
                <CheckCircle2 size={16} className="text-primary-green shrink-0" />
                Maintain a professional tone in all farmer advisories.
              </li>
            </ul>
          </section>

          <div className="bg-white rounded-[2.5rem] p-10 border border-natural-border shadow-sm text-center space-y-4">
            <div className="w-16 h-16 bg-natural-bg rounded-2xl mx-auto flex items-center justify-center">
              <Server className="text-primary-green" size={24} />
            </div>
            <h5 className="font-bold text-natural-text">Platform Version: v1.4.2-EXP</h5>
            <p className="text-[10px] text-natural-muted font-bold uppercase tracking-widest">Connected to Bio-Intelligence Node</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
