import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Moon, Sun, Globe, Shield, Database, 
  ChevronRight, Bell, Smartphone, Key, Lock,
  HardDrive, Cloud, AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-bold text-natural-text tracking-tight">System Settings</h2>
        <p className="text-natural-muted font-medium mt-1">Configure platform behavior and security</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'general', label: 'General', icon: Smartphone },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'data', label: 'Data & Backup', icon: Database },
          { id: 'notifications', label: 'Notifications', icon: Bell },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-primary-green text-white shadow-lg shadow-primary-green/20" 
                : "bg-white text-natural-text border border-natural-border hover:bg-natural-bg"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] p-4 border border-natural-border shadow-sm overflow-hidden">
        {activeTab === 'general' && (
          <div className="divide-y divide-natural-bg">
            <ToggleSetting 
              icon={darkMode ? Moon : Sun}
              label="Dark Appearance"
              description="Switch between light and dark visual modes"
              active={darkMode}
              onToggle={() => setDarkMode(!darkMode)}
            />
            <SelectSetting 
              icon={Globe}
              label="Language"
              description="Choose your preferred system language"
              value="English (International)"
              options={["English (International)", "Amharic (Ethiopia)", "Spanish", "French"]}
            />
            <ActionSetting 
              icon={Smartphone}
              label="Mobile Sync"
              description="Last cloud sync: today at 04:30 AM"
              actionLabel="Sync Now"
            />
          </div>
        )}

        {activeTab === 'security' && (
          <div className="divide-y divide-natural-bg">
            <ActionSetting 
              icon={Key}
              label="Change Password"
              description="Regular password updates improve account safety"
              actionLabel="Update"
            />
            <ToggleSetting 
              icon={Shield}
              label="Two-Factor Auth"
              description="Secure your account with OTP verification"
              active={true}
            />
            <ActionSetting 
              icon={Lock}
              label="Active Sessions"
              description="View and manage where you are logged in"
              actionLabel="View All"
            />
          </div>
        )}

        {activeTab === 'data' && (
          <div className="divide-y divide-natural-bg">
            <ActionSetting 
              icon={Cloud}
              label="Cloud Backup"
              description="Automatic backup to decentralized storage"
              actionLabel="Configure"
            />
            <ActionSetting 
              icon={HardDrive}
              label="Export Data"
              description="Download your sensor history and reports in CSV/PDF"
              actionLabel="Download"
            />
            <div className="p-8 group hover:bg-red-50/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-500 shadow-inner">
                    <AlertCircle size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-natural-text">Delete Account</h4>
                    <p className="text-sm text-natural-muted font-medium">Permanently remove all data and association</p>
                  </div>
                </div>
                <button className="text-red-500 font-black uppercase tracking-widest text-[10px] bg-white border border-red-200 px-6 py-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
           <div className="divide-y divide-natural-bg">
              <ToggleSetting 
                icon={Bell}
                label="Critical Alerts"
                description="Immediately notify for server node failures"
                active={true}
              />
              <ToggleSetting 
                icon={Bell}
                label="Mission Updates"
                description="Receive alerts when drone sessions complete"
                active={true}
              />
           </div>
        )}
      </div>
    </div>
  );
}

function ToggleSetting({ icon: Icon, label, description, active, onToggle }: any) {
  return (
    <div className="p-8 flex items-center justify-between group hover:bg-natural-bg/50 transition-colors">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-natural-bg flex items-center justify-center text-primary-green shadow-inner">
          <Icon size={28} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-natural-text">{label}</h4>
          <p className="text-sm text-natural-muted font-medium">{description}</p>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={cn(
          "w-14 h-8 rounded-full p-1 transition-all relative shadow-inner",
          active ? "bg-primary-green" : "bg-natural-border"
        )}
      >
        <div className={cn(
          "w-6 h-6 bg-white rounded-full shadow-lg transition-all transform",
          active ? "translate-x-6" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}

function SelectSetting({ icon: Icon, label, description, value, options }: any) {
  return (
    <div className="p-8 flex items-center justify-between group hover:bg-natural-bg/50 transition-colors">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-natural-bg flex items-center justify-center text-accent-tan shadow-inner">
          <Icon size={28} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-natural-text">{label}</h4>
          <p className="text-sm text-natural-muted font-medium">{description}</p>
        </div>
      </div>
      <div className="bg-natural-bg px-4 py-2 rounded-xl border border-natural-border text-[10px] font-black uppercase tracking-widest text-natural-muted flex items-center gap-2 cursor-pointer hover:text-natural-text">
        {value}
        <ChevronRight size={14} />
      </div>
    </div>
  );
}

function ActionSetting({ icon: Icon, label, description, actionLabel }: any) {
  return (
    <div className="p-8 flex items-center justify-between group hover:bg-natural-bg/50 transition-colors">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-natural-bg flex items-center justify-center text-natural-muted shadow-inner group-hover:text-primary-green transition-colors">
          <Icon size={28} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-natural-text">{label}</h4>
          <p className="text-sm text-natural-muted font-medium">{description}</p>
        </div>
      </div>
      <button className="text-[10px] font-black uppercase tracking-widest bg-white border border-natural-border px-6 py-3 rounded-2xl shadow-sm hover:translate-y-[-2px] transition-transform active:scale-95 group-hover:border-primary-green/30">
        {actionLabel}
      </button>
    </div>
  );
}
