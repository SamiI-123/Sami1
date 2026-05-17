import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Power, ShieldAlert, Users, 
  Waves, Zap, X, ZapOff, Microscope, MessageSquare,
  Globe
} from 'lucide-react';
import { cn } from '../lib/utils';
import { OFFICIAL_WEBSITE } from '../constants';

interface QuickActionsProps {
  userRole?: string;
}

export default function QuickActions({ userRole }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pumpActive, setPumpActive] = useState(false);

  const baseActions = [
    {
      id: 'website',
      label: 'Visit Website',
      icon: Globe,
      color: 'bg-primary-green-light',
      onClick: () => window.open(OFFICIAL_WEBSITE, '_blank')
    },
    { 
      id: 'pump', 
      label: pumpActive ? 'Stop Pump' : 'Start Pump', 
      icon: pumpActive ? ZapOff : Zap, 
      color: pumpActive ? 'bg-red-500' : 'bg-primary-green',
      onClick: () => setPumpActive(!pumpActive) 
    },
    { 
      id: 'post', 
      label: 'New Topic', 
      icon: Users, 
      color: 'bg-natural-text',
      onClick: () => console.log('Posting...') 
    }
  ];

  const actions = [...baseActions];
  
  if (userRole === 'expert') {
    actions.push({ 
      id: 'verify', 
      label: 'Verify Case', 
      icon: Microscope, 
      color: 'bg-blue-600',
      onClick: () => console.log('Expert verify...') 
    });
    actions.push({ 
      id: 'advise', 
      label: 'Send Advice', 
      icon: MessageSquare, 
      color: 'bg-indigo-600',
      onClick: () => console.log('Expert advice...') 
    });
  }

  // Always add Logout
  actions.push({
    id: 'logout',
    label: 'Sign Out',
    icon: Power,
    color: 'bg-red-500',
    onClick: () => {
      import('../lib/firebase').then(m => m.logout());
    }
  });
  
  // Add generic scan for farmers
  if (userRole === 'farmer' || !userRole) {
    actions.push({ 
      id: 'scan', 
      label: 'Rapid Scan', 
      icon: ShieldAlert, 
      color: 'bg-accent-tan',
      onClick: () => console.log('Scanning...') 
    });
  }

  return (
    <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col-reverse items-end gap-3 mb-2">
            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  action.onClick();
                  if (action.id !== 'pump') setIsOpen(false);
                }}
                className="flex items-center gap-3 group"
              >
                <span className="bg-white border border-natural-border px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-natural-text shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all hover:scale-110 active:scale-95",
                  action.color
                )}>
                  <action.icon size={20} />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all shadow-2xl active:scale-90",
          isOpen 
            ? "bg-natural-bg text-natural-text rotate-45 border border-natural-border" 
            : "bg-primary-green text-white"
        )}
      >
        {isOpen ? <X size={28} /> : <Plus size={32} />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-tan rounded-full border-2 border-white animate-bounce" />
        )}
      </button>
    </div>
  );
}
