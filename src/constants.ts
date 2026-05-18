import { LayoutDashboard, Drone, ShieldAlert, Thermometer, Users, Settings, LogOut, ChevronRight, Droplets, MapPin, Wind, Info, ShieldCheck } from 'lucide-react';

export const OFFICIAL_WEBSITE = "https://agritche.vercel.com/";

export const NAV_ITEMS =  [
  { id: 'landing', label: 'Home', icon: LayoutDashboard },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'diagnostics', label: 'Diagnostics', icon: ShieldAlert },
  { id: 'sensors', label: 'Sensors', icon: Thermometer },
  { id: 'expert', label: 'Expert Console', icon: ShieldCheck },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'profile', label: 'Profile', icon: Users },
  { id: 'about', label: 'About', icon: Info },
  { id: 'settings', label: 'Settings', icon: Settings },
];
export const CROP_TYPES = ['Wheat', 'Corn', 'Soybeans', 'Rice', 'Potatoes', 'Tomatoes'];
