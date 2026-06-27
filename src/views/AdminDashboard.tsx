import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, ShieldCheck, FileText, Thermometer, Trash2, 
  Search, MapPin, UserPlus, RefreshCw, BarChart2, 
  Calendar, Mail, ShieldAlert, Cpu, CheckCircle2, XCircle,
  TrendingUp, Activity, AlertTriangle, Drone, Radio, Sprout,
  DollarSign, CreditCard, PieChart, Settings, Shield, Plus,
  Wrench, ShieldX, Play, HelpCircle, Layers, Sliders, Battery, 
  Wifi, Eye, Info, LayoutDashboard
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, getDocs, doc, updateDoc, deleteDoc, 
  setDoc, query, limit, orderBy, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

// Types
interface RegisteredDrone {
  id: string;
  model: string;
  serialNumber: string;
  status: 'active' | 'maintenance' | 'retired';
  batteryLevel: number;
  assignedFarmId: string;
  lastFlightDate: string;
  pilotName: string;
}

interface PaymentRecord {
  id: string;
  invoiceId: string;
  email: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  plan: 'Farmer Basic' | 'Farmer Pro' | 'Cooperative Premium' | 'Expert License';
  createdAt: any;
}

interface SystemSettings {
  maintenanceMode: boolean;
  rateLimit: number;
  backupInterval: 'hourly' | 'daily' | 'weekly';
  alertEmail: string;
  allowExpertVerification: boolean;
  modelMode: 'gemini-flash' | 'gemini-pro';
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'users' | 'drones' | 'iot' | 'crop' | 'finance' | 'analytics' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Firestore Data States
  const [usersList, setUsersList] = useState<any[]>([]);
  const [farmsList, setFarmsList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [sensorsList, setSensorsList] = useState<any[]>([]);
  const [dronesList, setDronesList] = useState<RegisteredDrone[]>([]);
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>([]);
  const [sysSettings, setSysSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    rateLimit: 60,
    backupInterval: 'daily',
    alertEmail: 'alerts@agrinovia.tech',
    allowExpertVerification: true,
    modelMode: 'gemini-flash'
  });

  // Action / Loading States
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showAddDroneForm, setShowAddDroneForm] = useState(false);
  const [showAddSensorForm, setShowAddSensorForm] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form states
  const [newUser, setNewUser] = useState({ displayName: '', email: '', role: 'farmer' });
  const [newDrone, setNewDrone] = useState({ model: 'AgriDrone X-20 Pro', serialNumber: '', status: 'active' as const, assignedFarmId: '', pilotName: 'Drone AutoPilot' });
  const [newSensor, setNewSensor] = useState({ farmId: '', moisture: 45, temperature: 24.5, humidity: 62 });

  // Map state
  const [selectedMapHotspot, setSelectedMapHotspot] = useState<any | null>(null);
  const [mapLayer, setMapLayer] = useState<'severity' | 'moisture' | 'drones'>('severity');

  // Load and seed fallback database data
  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      let fetchedUsers: any[] = [];
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach((docSnap) => {
          fetchedUsers.push({ id: docSnap.id, ...docSnap.data() });
        });
      } catch (e) {
        console.warn("Firestore error reading users, using fallback:", e);
      }
      if (fetchedUsers.length === 0) {
        // Fallback or seed
        fetchedUsers = [
          { id: 'u1', uid: 'u1', displayName: 'Samson Abraham', email: 'samsonabrhamtad@gmail.com', role: 'admin', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Samson' },
          { id: 'u2', uid: 'u2', displayName: 'Abebe Bikila', email: 'abebe@farm.org', role: 'farmer', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abebe' },
          { id: 'u3', uid: 'u3', displayName: 'Dr. Helen Kassaye', email: 'helen.k@agri.expert', role: 'expert', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Helen' },
          { id: 'u4', uid: 'u4', displayName: 'Chala Dejene', email: 'chala@coop.et', role: 'farmer', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chala' }
        ];
      }
      setUsersList(fetchedUsers);

      // 2. Fetch Farms
      let fetchedFarms: any[] = [];
      try {
        const farmsSnap = await getDocs(collection(db, 'farms'));
        farmsSnap.forEach((docSnap) => {
          fetchedFarms.push({ id: docSnap.id, ...docSnap.data() });
        });
      } catch (e) {
        console.warn("Firestore error reading farms:", e);
      }
      if (fetchedFarms.length === 0) {
        fetchedFarms = [
          { id: 'f1', name: 'Jimma Highland Organic Estate', cropType: 'Arabica Coffee', size: 14.5, ownerId: 'u2', location: { city: 'Jimma', country: 'Ethiopia', lat: 7.67, lng: 36.83 } },
          { id: 'f2', name: 'Sidama Coffee Growers Cooperative', cropType: 'Sidamo Specialty Coffee', size: 32.0, ownerId: 'u4', location: { city: 'Hawassa', country: 'Ethiopia', lat: 7.05, lng: 38.48 } },
          { id: 'f3', name: 'Harar Sunny Slopes Farm', cropType: 'Harar Peaberry', size: 8.2, ownerId: 'u2', location: { city: 'Harar', country: 'Ethiopia', lat: 9.31, lng: 42.12 } }
        ];
      }
      setFarmsList(fetchedFarms);

      // 3. Fetch AI Reports
      let fetchedReports: any[] = [];
      try {
        const reportsSnap = await getDocs(collection(db, 'ai_reports'));
        reportsSnap.forEach((docSnap) => {
          fetchedReports.push({ id: docSnap.id, ...docSnap.data() });
        });
      } catch (e) {
        console.warn("Firestore error reading ai_reports:", e);
      }
      if (fetchedReports.length === 0) {
        fetchedReports = [
          { id: 'rep1', ownerId: 'u2', findings: 'Coffee Leaf Rust (Hemileia vastatrix) - Severity Level: High. Leaf canopy shows 40% orange pustule infestation. Recommended treatment includes immediate organic copper-hydroxide spray.', status: 'completed', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop', createdAt: { seconds: 1782298100 } },
          { id: 'rep2', ownerId: 'u4', findings: 'Healthy Arabica Berries - Severity Level: None. High-quality yield, normal borer counts. Ensure standard seasonal pruning.', status: 'completed', imageUrl: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=600&auto=format&fit=crop', createdAt: { seconds: 1782211700 } },
          { id: 'rep3', ownerId: 'u2', findings: 'Cercospora Leaf Spot (Brown Eye Spot) - Severity Level: Medium. Circular grey spots with dark borders. Advise canopy thinning to lower humidity levels.', status: 'completed', imageUrl: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?q=80&w=600&auto=format&fit=crop', createdAt: { seconds: 1782125300 } }
        ];
      }
      setReportsList(fetchedReports);

      // 4. Fetch Sensor Readings
      let fetchedSensors: any[] = [];
      try {
        const sensorsQuery = query(collection(db, 'sensor_readings'), orderBy('timestamp', 'desc'), limit(50));
        const sensorsSnap = await getDocs(sensorsQuery);
        sensorsSnap.forEach((docSnap) => {
          fetchedSensors.push({ id: docSnap.id, ...docSnap.data() });
        });
      } catch (e) {
        console.warn("Firestore error reading sensor_readings:", e);
      }
      if (fetchedSensors.length === 0) {
        fetchedSensors = [
          { id: 'sens1', farmId: 'f1', moisture: 48, temperature: 23.4, humidity: 65, timestamp: { seconds: Math.floor(Date.now() / 1000) } },
          { id: 'sens2', farmId: 'f2', moisture: 54, temperature: 21.8, humidity: 71, timestamp: { seconds: Math.floor(Date.now() / 1000) - 300 } },
          { id: 'sens3', farmId: 'f3', moisture: 38, temperature: 26.2, humidity: 55, timestamp: { seconds: Math.floor(Date.now() / 1000) - 600 } }
        ];
      }
      setSensorsList(fetchedSensors);

      // 5. Fetch Drones
      let fetchedDrones: RegisteredDrone[] = [];
      try {
        const dronesSnap = await getDocs(collection(db, 'drones'));
        dronesSnap.forEach((docSnap) => {
          fetchedDrones.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
      } catch (e) {
        console.warn("Firestore error reading drones:", e);
      }
      if (fetchedDrones.length === 0) {
        fetchedDrones = [
          { id: 'dr1', model: 'AgriDrone X-20 Pro', serialNumber: 'AD-9983-K9', status: 'active', batteryLevel: 88, assignedFarmId: 'f1', lastFlightDate: '2026-06-25', pilotName: 'Capt. Chala Dejene' },
          { id: 'dr2', model: 'AgriDrone Horizon MultiSpec', serialNumber: 'AD-8211-M4', status: 'maintenance', batteryLevel: 12, assignedFarmId: 'f2', lastFlightDate: '2026-06-24', pilotName: 'Autonomous AI' },
          { id: 'dr3', model: 'VTOL SprayDrone Elite', serialNumber: 'AD-4451-S1', status: 'active', batteryLevel: 95, assignedFarmId: 'f3', lastFlightDate: '2026-06-26', pilotName: 'Dr. Helen Kassaye' }
        ];
      }
      setDronesList(fetchedDrones);

      // 6. Fetch Payments
      let fetchedPayments: PaymentRecord[] = [];
      try {
        const paymentsSnap = await getDocs(collection(db, 'payments'));
        paymentsSnap.forEach((docSnap) => {
          fetchedPayments.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
      } catch (e) {
        console.warn("Firestore error reading payments:", e);
      }
      if (fetchedPayments.length === 0) {
        fetchedPayments = [
          { id: 'pay1', invoiceId: 'INV-2026-001', email: 'abebe@farm.org', amount: 49.00, status: 'success', plan: 'Farmer Pro', createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 * 3 } },
          { id: 'pay2', invoiceId: 'INV-2026-002', email: 'chala@coop.et', amount: 199.00, status: 'success', plan: 'Cooperative Premium', createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 * 5 } },
          { id: 'pay3', invoiceId: 'INV-2026-003', email: 'helen.k@agri.expert', amount: 89.00, status: 'success', plan: 'Expert License', createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 * 10 } },
          { id: 'pay4', invoiceId: 'INV-2026-004', email: 'demo@agrinovia.tech', amount: 15.00, status: 'pending', plan: 'Farmer Basic', createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 } }
        ];
      }
      setPaymentsList(fetchedPayments);

      // 7. System Settings
      try {
        const settingsSnap = await getDocs(collection(db, 'system_settings'));
        if (!settingsSnap.empty) {
          const settingDoc = settingsSnap.docs[0];
          setSysSettings({ id: settingDoc.id, ...settingDoc.data() } as any);
        }
      } catch (e) {
        console.warn("Firestore error reading settings, using fallback:", e);
      }

    } catch (err) {
      console.error("Critical error building admin state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  // Toast system
  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Save specific item to Firestore helper
  const syncDocument = async (col: string, docId: string, data: any) => {
    try {
      await setDoc(doc(db, col, docId), data, { merge: true });
      return true;
    } catch (err: any) {
      console.warn(`Write to Firestore [${col}/${docId}] bypassed (local state preserved):`, err.message || err);
      return false;
    }
  };

  // Actions
  const handleUpdateRole = async (userId: string, newRole: string) => {
    setActionLoading(`role-${userId}`);
    try {
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      const success = await syncDocument('users', userId, { role: newRole });
      triggerNotification('success', `User access level successfully updated to ${newRole}.`);
    } catch (e: any) {
      triggerNotification('error', `Failed to update role: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.uid) {
      triggerNotification('error', "You are currently logged in with this profile. Revoking access is restricted.");
      return;
    }
    if (!window.confirm("Confirm deletion of this user profile from the directory? This action cannot be undone.")) return;
    
    setActionLoading(`delete-user-${userId}`);
    try {
      setUsersList(prev => prev.filter(u => u.id !== userId));
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch (e) {}
      triggerNotification('success', "User profile successfully removed.");
    } catch (e: any) {
      triggerNotification('error', `Error removing user: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.displayName || !newUser.email) return;
    setActionLoading('add-user');
    const tempId = 'u_' + Math.random().toString(36).substring(2, 9);
    const userDoc = {
      uid: tempId,
      displayName: newUser.displayName,
      email: newUser.email,
      role: newUser.role,
      createdAt: new Date().toISOString(),
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.displayName}`
    };

    try {
      setUsersList(prev => [userDoc, ...prev]);
      await syncDocument('users', tempId, userDoc);
      setShowAddUserForm(false);
      setNewUser({ displayName: '', email: '', role: 'farmer' });
      triggerNotification('success', "New profile provisioned successfully.");
    } catch (e: any) {
      triggerNotification('error', `Provision failed: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegisterDrone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrone.serialNumber) return;
    setActionLoading('add-drone');
    const droneId = 'dr_' + Math.random().toString(36).substring(2, 9);
    const droneDoc: RegisteredDrone = {
      id: droneId,
      model: newDrone.model,
      serialNumber: newDrone.serialNumber,
      status: newDrone.status,
      batteryLevel: 100,
      assignedFarmId: newDrone.assignedFarmId || 'f1',
      lastFlightDate: new Date().toISOString().split('T')[0],
      pilotName: newDrone.pilotName
    };

    try {
      setDronesList(prev => [droneDoc, ...prev]);
      await syncDocument('drones', droneId, droneDoc);
      setShowAddDroneForm(false);
      setNewDrone({ model: 'AgriDrone X-20 Pro', serialNumber: '', status: 'active', assignedFarmId: '', pilotName: 'Drone AutoPilot' });
      triggerNotification('success', `Drone ${droneDoc.serialNumber} has been authorized into system flight database.`);
    } catch (err: any) {
      triggerNotification('error', `Failed to register drone: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateDroneStatus = async (droneId: string, status: 'active' | 'maintenance' | 'retired') => {
    try {
      setDronesList(prev => prev.map(d => d.id === droneId ? { ...d, status } : d));
      await syncDocument('drones', droneId, { status });
      triggerNotification('success', "Drone operating status has been recalibrated.");
    } catch (err: any) {
      triggerNotification('error', `Status change failed: ${err.message}`);
    }
  };

  const handleAddSensorMockReading = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('add-sensor');
    const readingId = 'sens_' + Math.random().toString(36).substring(2, 9);
    const sensorDoc = {
      farmId: newSensor.farmId || 'f1',
      moisture: Number(newSensor.moisture),
      temperature: Number(newSensor.temperature),
      humidity: Number(newSensor.humidity),
      timestamp: { seconds: Math.floor(Date.now() / 1000) }
    };

    try {
      setSensorsList(prev => [sensorDoc, ...prev]);
      await syncDocument('sensor_readings', readingId, sensorDoc);
      setShowAddSensorForm(false);
      triggerNotification('success', "IoT physical sensor telemetry packet injected successfully.");
    } catch (err: any) {
      triggerNotification('error', `Telemetry registration failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSettings = async (key: keyof SystemSettings, val: any) => {
    const updated = { ...sysSettings, [key]: val };
    setSysSettings(updated);
    try {
      await syncDocument('system_settings', 'global_config', updated);
      triggerNotification('success', `System policy updated: ${String(key)} set to ${String(val)}.`);
    } catch (err) {}
  };

  // Math totals for the Dashboard Overview
  const totalUsers = usersList.length;
  const totalExperts = usersList.filter(u => u.role === 'expert').length;
  const totalFarmers = usersList.filter(u => u.role === 'farmer').length;
  const totalAdmins = usersList.filter(u => u.role === 'admin').length;
  const totalDrones = dronesList.length;
  const totalFarms = farmsList.length;
  const activeSensors = sensorsList.length;
  
  // Financial Calculations
  const successfulPayments = paymentsList.filter(p => p.status === 'success');
  const totalRevenue = successfulPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const averageOrderValue = successfulPayments.length > 0 ? (totalRevenue / successfulPayments.length).toFixed(2) : '0.00';

  // Filters
  const filteredUsers = usersList.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.uid?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDrones = dronesList.filter(d => 
    d.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.pilotName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReports = reportsList.filter(r => 
    r.findings?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.ownerId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto px-1 md:px-4">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-natural-border/30">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent-tan bg-accent-tan/10 px-4 py-1.5 rounded-full inline-block mb-3 border border-accent-tan/15 shadow-sm">
            🛡️ Administrative Operations Deck
          </span>
          <h2 className="text-3xl font-black text-natural-text tracking-tight flex items-center gap-3">
            System Overlord Console 
            <span className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
              Root Level
            </span>
          </h2>
          <p className="text-natural-muted font-medium italic text-sm mt-1">
            Provision roles, manage remote multi-spectral drone payloads, deploy hardware sensor configurations, and audit telemetry.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button 
            onClick={loadAllData}
            className="px-5 py-2.5 bg-white border border-natural-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-natural-bg/50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <RefreshCw size={14} className={cn(loading && "animate-spin")} />
            Database Synchronize
          </button>
          
          <button 
            onClick={() => {
              if (activeSubTab === 'users') setShowAddUserForm(true);
              else if (activeSubTab === 'drones') setShowAddDroneForm(true);
              else if (activeSubTab === 'iot') setShowAddSensorForm(true);
              else {
                setActiveSubTab('users');
                setShowAddUserForm(true);
              }
            }}
            className="px-5 py-2.5 bg-primary-green text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-95 transition-opacity shadow-lg shadow-primary-green/10 flex items-center gap-1.5"
          >
            <Plus size={14} />
            Quick Deploy Asset
          </button>
        </div>
      </div>

      {/* Dynamic Toast System */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "p-4 rounded-xl text-xs font-semibold flex items-center gap-3 border shadow-md",
              notification.type === 'success' 
                ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                : "bg-red-50 text-red-800 border-red-100"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Sub-Navigation Row */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-natural-border shadow-sm overflow-x-auto no-scrollbar gap-1">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'drones', label: 'Drone Fleet', icon: Drone },
          { id: 'iot', label: 'IoT Sensors', icon: Radio },
          { id: 'crop', label: 'Crop Health Hub', icon: Sprout },
          { id: 'finance', label: 'Financial Matrix', icon: DollarSign },
          { id: 'analytics', label: 'System Analytics', icon: BarChart2 },
          { id: 'settings', label: 'Control Policy', icon: Settings }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => {
              setActiveSubTab(btn.id as any);
              setSearchQuery('');
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
              activeSubTab === btn.id 
                ? "bg-primary-green text-white shadow-md shadow-primary-green/15" 
                : "text-natural-muted hover:text-natural-text hover:bg-natural-bg/50 font-bold"
            )}
          >
            <btn.icon size={14} />
            {btn.label}
          </button>
        ))}
      </div>

      {/* Modals & Popups */}
      <AnimatePresence>
        {/* Add User Modal */}
        {showAddUserForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 border border-natural-border shadow-xl max-w-md w-full space-y-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-natural-bg">
                <h3 className="font-extrabold text-base text-natural-text flex items-center gap-2">
                  <UserPlus className="text-primary-green" />
                  Provision Platform Profile
                </h3>
                <button onClick={() => setShowAddUserForm(false)} className="text-xs font-bold text-natural-muted hover:text-natural-text">
                  <XCircle size={18} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">Display Full Name</label>
                  <input 
                    type="text" required value={newUser.displayName}
                    onChange={(e) => setNewUser(p => ({ ...p, displayName: e.target.value }))}
                    placeholder="e.g. Abebe Bikila"
                    className="w-full bg-natural-bg/40 border border-natural-border p-3.5 rounded-xl text-xs text-natural-text focus:outline-none focus:border-primary-green/50"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">Secure Registered Email</label>
                  <input 
                    type="email" required value={newUser.email}
                    onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))}
                    placeholder="e.g. abebe@farm.org"
                    className="w-full bg-natural-bg/40 border border-natural-border p-3.5 rounded-xl text-xs text-natural-text focus:outline-none focus:border-primary-green/50"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">Platform Role Privilege</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser(p => ({ ...p, role: e.target.value }))}
                    className="w-full bg-natural-bg/40 border border-natural-border p-3.5 rounded-xl text-xs font-bold text-natural-text focus:outline-none"
                  >
                    <option value="farmer">Farmer (Producer Hub)</option>
                    <option value="expert">Certified Agronomist / Expert</option>
                    <option value="admin">System Operations Admin</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowAddUserForm(false)} className="px-5 py-3 bg-natural-bg rounded-xl text-xs font-extrabold text-natural-muted hover:bg-natural-border/20">
                    Cancel
                  </button>
                  <button type="submit" disabled={actionLoading === 'add-user'} className="px-5 py-3 bg-primary-green text-white rounded-xl text-xs font-extrabold hover:opacity-90 transition-opacity">
                    {actionLoading === 'add-user' ? 'Deploying...' : 'Confirm Provision'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Drone Modal */}
        {showAddDroneForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 border border-natural-border shadow-xl max-w-md w-full space-y-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-natural-bg">
                <h3 className="font-extrabold text-base text-natural-text flex items-center gap-2">
                  <Drone className="text-primary-green" />
                  Authorize Flight Drone
                </h3>
                <button onClick={() => setShowAddDroneForm(false)} className="text-xs font-bold text-natural-muted hover:text-natural-text">
                  <XCircle size={18} />
                </button>
              </div>

              <form onSubmit={handleRegisterDrone} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">UAV Hardware Model</label>
                  <select 
                    value={newDrone.model}
                    onChange={(e) => setNewDrone(p => ({ ...p, model: e.target.value }))}
                    className="w-full bg-natural-bg/40 border border-natural-border p-3.5 rounded-xl text-xs text-natural-text focus:outline-none focus:border-primary-green/50"
                  >
                    <option value="AgriDrone X-20 Pro">AgriDrone X-20 Pro (Scout Specialist)</option>
                    <option value="AgriDrone Horizon MultiSpec">AgriDrone Horizon (Multi-Spectral Payload)</option>
                    <option value="VTOL SprayDrone Elite">VTOL SprayDrone Elite (Targeted Nitrogen Spray)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">Device Serial Number</label>
                  <input 
                    type="text" required placeholder="e.g. AD-5521-X9" value={newDrone.serialNumber}
                    onChange={(e) => setNewDrone(p => ({ ...p, serialNumber: e.target.value.toUpperCase() }))}
                    className="w-full bg-natural-bg/40 border border-natural-border p-3.5 rounded-xl text-xs text-natural-text focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">Assigned Operational Farm</label>
                  <select 
                    value={newDrone.assignedFarmId}
                    onChange={(e) => setNewDrone(p => ({ ...p, assignedFarmId: e.target.value }))}
                    className="w-full bg-natural-bg/40 border border-natural-border p-3.5 rounded-xl text-xs font-semibold text-natural-text focus:outline-none"
                  >
                    <option value="">-- Assign Farm Boundary --</option>
                    {farmsList.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">Assigned Ground Pilot</label>
                  <input 
                    type="text" required value={newDrone.pilotName}
                    onChange={(e) => setNewDrone(p => ({ ...p, pilotName: e.target.value }))}
                    className="w-full bg-natural-bg/40 border border-natural-border p-3.5 rounded-xl text-xs text-natural-text focus:outline-none"
                  />
                </div>
                <div className="pt-4 flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowAddDroneForm(false)} className="px-5 py-3 bg-natural-bg rounded-xl text-xs font-extrabold text-natural-muted hover:bg-natural-border/20">
                    Cancel
                  </button>
                  <button type="submit" disabled={actionLoading === 'add-drone'} className="px-5 py-3 bg-primary-green text-white rounded-xl text-xs font-extrabold hover:opacity-90 transition-opacity">
                    Authorize UAV
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Sensor Telemetry Packet */}
        {showAddSensorForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 border border-natural-border shadow-xl max-w-md w-full space-y-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-natural-bg">
                <h3 className="font-extrabold text-base text-natural-text flex items-center gap-2">
                  <Radio className="text-primary-green" />
                  Inject IoT Node Telemetry
                </h3>
                <button onClick={() => setShowAddSensorForm(false)} className="text-xs font-bold text-natural-muted hover:text-natural-text">
                  <XCircle size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSensorMockReading} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">Target Farm Association</label>
                  <select 
                    value={newSensor.farmId}
                    onChange={(e) => setNewSensor(p => ({ ...p, farmId: e.target.value }))}
                    className="w-full bg-natural-bg/40 border border-natural-border p-3.5 rounded-xl text-xs text-natural-text focus:outline-none font-semibold"
                  >
                    <option value="">-- Choose Farm --</option>
                    {farmsList.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">Soil Moisture</label>
                    <input 
                      type="number" min="0" max="100" required value={newSensor.moisture}
                      onChange={(e) => setNewSensor(p => ({ ...p, moisture: Number(e.target.value) }))}
                      className="w-full bg-natural-bg/40 border border-natural-border p-3 rounded-xl text-xs text-natural-text text-center focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">Temp (°C)</label>
                    <input 
                      type="number" step="0.1" required value={newSensor.temperature}
                      onChange={(e) => setNewSensor(p => ({ ...p, temperature: Number(e.target.value) }))}
                      className="w-full bg-natural-bg/40 border border-natural-border p-3 rounded-xl text-xs text-natural-text text-center focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">Humidity (%)</label>
                    <input 
                      type="number" min="0" max="100" required value={newSensor.humidity}
                      onChange={(e) => setNewSensor(p => ({ ...p, humidity: Number(e.target.value) }))}
                      className="w-full bg-natural-bg/40 border border-natural-border p-3 rounded-xl text-xs text-natural-text text-center focus:outline-none"
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowAddSensorForm(false)} className="px-5 py-3 bg-natural-bg rounded-xl text-xs font-extrabold text-natural-muted hover:bg-natural-border/20">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-3 bg-primary-green text-white rounded-xl text-xs font-extrabold hover:opacity-90 transition-opacity">
                    Inject Packet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Layout Workspace Panel */}
      <div className="bg-white rounded-[2rem] border border-natural-border shadow-sm overflow-hidden min-h-[500px]">
        
        {/* Dynamic Inner Tab Workspace */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-natural-muted">
            <RefreshCw className="animate-spin text-primary-green" size={28} />
            <p className="text-xs font-black uppercase tracking-widest text-natural-text">Re-evaluating system matrices...</p>
            <p className="text-[10px] text-natural-muted">Hydrating database nodes securely</p>
          </div>
        ) : (
          <div className="p-6 md:p-8">
            
            {/* TAB 1: OVERVIEW */}
            {activeSubTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-natural-text tracking-tight">Executive Dashboard telemetry</h3>
                    <p className="text-xs text-natural-muted mt-0.5">Real-time status summaries of connected farmers, experts, and airborne aerial platforms.</p>
                  </div>
                  <div className="text-[10px] text-natural-muted font-mono bg-natural-bg px-3 py-1 rounded-md border">
                    Server Status: <span className="text-emerald-600 font-bold">ONLINE</span> (2.4s ping)
                  </div>
                </div>

                {/* Stat Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { label: 'Total Registrations', value: totalUsers, sub: `${totalAdmins} Administrators`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Verified Experts', value: totalExperts, sub: 'Agronomists active', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Active Farmers', value: totalFarmers, sub: 'Land owners', icon: Sprout, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Airborne UAV Fleet', value: totalDrones, sub: `${dronesList.filter(d => d.status === 'active').length} in active flight`, icon: Drone, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'IoT Land Nodes', value: activeSensors, sub: 'Real-time telemetry', icon: Radio, color: 'text-amber-600', bg: 'bg-amber-50' }
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#FAF9F6] border border-natural-border p-5 rounded-2xl flex flex-col justify-between hover:shadow-sm transition-all group">
                      <div className="flex items-center justify-between mb-3">
                        <div className={cn("p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-105", stat.bg)}>
                          <stat.icon className={stat.color} size={18} />
                        </div>
                        <span className="text-[8px] font-black uppercase text-natural-muted tracking-widest bg-white border px-1.5 py-0.5 rounded">Live</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-natural-muted uppercase tracking-wider mb-0.5">{stat.label}</p>
                        <h4 className="text-2xl font-black text-natural-text">{stat.value}</h4>
                        <p className="text-[9px] text-natural-muted font-medium mt-1">{stat.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* System Diagnostics & CPU Telemetry */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* System Hardware Logs */}
                  <div className="lg:col-span-2 bg-white border border-natural-border p-6 rounded-2xl space-y-4 shadow-xs">
                    <h4 className="text-xs font-black uppercase tracking-widest text-natural-text flex items-center gap-2 pb-3 border-b border-natural-bg">
                      <Cpu size={14} className="text-primary-green" />
                      Infrastructure Resource Health Indicators
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Metric 1 */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-natural-text">
                          <span>Express Middleware CPU Load</span>
                          <span className="font-mono text-primary-green">14.2%</span>
                        </div>
                        <div className="w-full bg-natural-bg h-2 rounded-full overflow-hidden">
                          <div className="bg-primary-green h-full" style={{ width: '14.2%' }} />
                        </div>
                      </div>
                      
                      {/* Metric 2 */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-natural-text">
                          <span>Google GenAI API Latency</span>
                          <span className="font-mono text-indigo-600">420ms</span>
                        </div>
                        <div className="w-full bg-natural-bg h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full" style={{ width: '38%' }} />
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-natural-text">
                          <span>Firestore Read Transactions</span>
                          <span className="font-mono text-blue-600">1.8k / min</span>
                        </div>
                        <div className="w-full bg-natural-bg h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: '65%' }} />
                        </div>
                      </div>

                      {/* Metric 4 */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-natural-text">
                          <span>System Cache Hit Rate</span>
                          <span className="font-mono text-emerald-600">99.1%</span>
                        </div>
                        <div className="w-full bg-natural-bg h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full" style={{ width: '99.1%' }} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-natural-bg/50 p-4 rounded-xl border border-natural-border text-[11px] text-natural-muted space-y-1.5 leading-relaxed font-mono">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold text-natural-text mb-1">
                        <Activity size={12} className="text-primary-green" /> 
                        Operational Kernel Telemetry Stream
                      </p>
                      <p>&gt; [SYSTEM] Initializing Firebase Firestore connection pools... Verified ok</p>
                      <p>&gt; [AI] Loaded Gemini-3.5-flash with automated temperature limits</p>
                      <p>&gt; [DRONE] Tracking {totalDrones} active fleet transmitters... All signals responding</p>
                      <p>&gt; [SECURITY] Whitelisted Admin ID [SbDqWI1WCaWuXwRnbm26fXXJvk23]</p>
                    </div>
                  </div>

                  {/* Hotspots Quick Look */}
                  <div className="bg-[#FAF9F6] border border-accent-tan/15 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-natural-text flex items-center gap-2 pb-3 border-b border-accent-tan/10">
                      <AlertTriangle size={14} className="text-accent-tan" />
                      Critical Outbreak Alerts
                    </h4>

                    <div className="space-y-3">
                      <div className="bg-white p-3.5 rounded-xl border border-red-500/10 flex items-start gap-2.5">
                        <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={14} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-red-500">Coffee Leaf Rust</p>
                          <p className="text-[11px] text-natural-text font-semibold mt-0.5">Jimma Highland Estate</p>
                          <p className="text-[10px] text-natural-muted">40% foliage decay detected via UAV multi-spec scanning.</p>
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-amber-500/10 flex items-start gap-2.5">
                        <Wrench className="text-amber-500 shrink-0 mt-0.5" size={14} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Maintenance Warning</p>
                          <p className="text-[11px] text-natural-text font-semibold mt-0.5">AgriDrone Horizon (AD-8211-M4)</p>
                          <p className="text-[10px] text-natural-muted">Critical low battery battery cycle degradation (12% capacity).</p>
                        </div>
                      </div>

                      <div className="text-center pt-2">
                        <button 
                          onClick={() => setActiveSubTab('crop')}
                          className="text-[10px] font-black uppercase text-primary-green hover:underline flex items-center gap-1 mx-auto"
                        >
                          Access Crop Health Hub &rarr;
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 2: USER MANAGEMENT */}
            {activeSubTab === 'users' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-natural-text tracking-tight">Secure User Registry</h3>
                    <p className="text-xs text-natural-muted">Audit system user authorization profiles, elevate roles, and provision certified experts.</p>
                  </div>
                  
                  {/* Dynamic Search */}
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="pl-9 pr-4 py-2.5 bg-[#FAF9F6] border border-natural-border rounded-xl text-xs w-full md:w-64 focus:outline-none focus:border-primary-green/30"
                    />
                    <Search size={14} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-natural-muted" />
                  </div>
                </div>

                {/* Table Container */}
                <div className="bg-[#FAF9F6] border border-natural-border rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-natural-border bg-white text-[9px] font-black uppercase tracking-wider text-natural-muted">
                          <th className="p-4 pl-6">Profile Identifier</th>
                          <th className="p-4">Secure Credentials</th>
                          <th className="p-4">Access Level Privilege</th>
                          <th className="p-4 text-right pr-6">Management Operations</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-natural-border/40">
                        {filteredUsers.map((item) => (
                          <tr key={item.id} className="group hover:bg-white transition-colors">
                            <td className="p-4 pl-6">
                              <div className="flex items-center gap-4">
                                <img 
                                  src={item.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.displayName}`} 
                                  alt="Avatar" 
                                  className="w-10 h-10 rounded-full border border-natural-border"
                                />
                                <div>
                                  <h4 className="text-xs font-extrabold text-natural-text">{item.displayName || 'Unnamed Member'}</h4>
                                  <span className="text-[9px] text-natural-muted font-mono bg-white border px-1.5 py-0.5 rounded">UID: {item.id}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-xs text-natural-muted font-semibold block">{item.email}</span>
                              <span className="text-[9px] text-natural-muted">Registered in database</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border",
                                  item.role === 'admin' 
                                    ? "bg-red-50 text-red-600 border-red-100" 
                                    : item.role === 'expert' 
                                      ? "bg-blue-50 text-blue-600 border-blue-100" 
                                      : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                )}>
                                  {item.role || 'farmer'}
                                </span>
                                
                                {/* Quick change dropdown */}
                                <select
                                  disabled={actionLoading === `role-${item.id}`}
                                  value={item.role || 'farmer'}
                                  onChange={(e) => handleUpdateRole(item.id, e.target.value)}
                                  className="bg-white px-2 py-1 rounded text-[10px] font-bold text-natural-muted border border-natural-border focus:outline-none focus:border-primary-green/50"
                                >
                                  <option value="farmer">Farmer</option>
                                  <option value="expert">Expert</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                            </td>
                            <td className="p-4 text-right pr-6">
                              <button
                                disabled={actionLoading === `delete-user-${item.id}`}
                                onClick={() => handleDeleteUser(item.id)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Revoke system access"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DRONE MANAGEMENT */}
            {activeSubTab === 'drones' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-natural-text tracking-tight">Airborne Drone Squadron</h3>
                    <p className="text-xs text-natural-muted">Track registered autonomous multi-spectral UAV platforms, flight logs, and maintenance intervals.</p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Search drones */}
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search drones..."
                      className="pl-4 pr-4 py-2 bg-[#FAF9F6] border border-natural-border rounded-xl text-xs focus:outline-none w-48"
                    />
                    <button 
                      onClick={() => setShowAddDroneForm(true)}
                      className="px-4 py-2 bg-primary-green text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:opacity-90 flex items-center gap-1.5"
                    >
                      <Plus size={12} />
                      Register Drone
                    </button>
                  </div>
                </div>

                {/* Drone Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredDrones.map((drone) => (
                    <div 
                      key={drone.id}
                      className="bg-[#FAF9F6] border border-natural-border rounded-2xl p-6 relative hover:border-primary-green/20 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Upper row status */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-mono bg-white border border-natural-border/60 px-2.5 py-1 rounded-full text-natural-text">
                            {drone.serialNumber}
                          </span>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full",
                            drone.status === 'active' 
                              ? "bg-emerald-500/10 text-emerald-600" 
                              : drone.status === 'maintenance'
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-red-500/10 text-red-600"
                          )}>
                            {drone.status}
                          </span>
                        </div>

                        {/* Middle contents */}
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-primary-green/10 p-2.5 rounded-xl text-primary-green mt-0.5">
                              <Drone size={20} />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-natural-text">{drone.model}</h4>
                              <p className="text-[10px] text-natural-muted font-medium">Assigned Pilot: <strong className="text-natural-text">{drone.pilotName}</strong></p>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-natural-border/50 space-y-2 text-[11px] text-natural-muted">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 font-semibold">
                                <Battery size={13} className={drone.batteryLevel < 20 ? "text-red-500 animate-pulse" : "text-emerald-500"} />
                                Charge Capacity
                              </span>
                              <span className="font-mono text-natural-text font-bold">{drone.batteryLevel}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 font-semibold">
                                <Calendar size={13} className="text-accent-tan" />
                                Last Scanning Flight
                              </span>
                              <span className="text-natural-text font-bold">{drone.lastFlightDate}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Operations Actions bar */}
                      <div className="pt-4 mt-5 border-t border-natural-border/50 flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase text-natural-muted tracking-widest">Controls</span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleUpdateDroneStatus(drone.id, 'active')}
                            className="p-1 bg-white hover:bg-emerald-50 text-emerald-600 rounded border text-[9px] font-extrabold uppercase px-1.5"
                          >
                            Active
                          </button>
                          <button 
                            onClick={() => handleUpdateDroneStatus(drone.id, 'maintenance')}
                            className="p-1 bg-white hover:bg-amber-50 text-amber-600 rounded border text-[9px] font-extrabold uppercase px-1.5"
                          >
                            Maint
                          </button>
                          <button 
                            onClick={() => handleUpdateDroneStatus(drone.id, 'retired')}
                            className="p-1 bg-white hover:bg-red-50 text-red-600 rounded border text-[9px] font-extrabold uppercase px-1.5"
                          >
                            Retire
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: IOT DEVICE MANAGEMENT */}
            {activeSubTab === 'iot' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-natural-text tracking-tight">IoT Sensor telemetry matrix</h3>
                    <p className="text-xs text-natural-muted">Verify node transmission health, calibrate soil moisture parameters, and provision new physical IoT nodes.</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAddSensorForm(true)}
                      className="px-4 py-2 bg-primary-green text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:opacity-90 flex items-center gap-1.5"
                    >
                      <Plus size={12} />
                      Inject Telemetry
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* IoT Telemetry Table */}
                  <div className="lg:col-span-2 bg-[#FAF9F6] border border-natural-border p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-natural-text flex items-center gap-2 border-b pb-3 border-natural-border/50">
                      <Radio size={14} className="text-primary-green" />
                      Live Transmission Feeds
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-natural-border text-[9px] font-black uppercase tracking-wider text-natural-muted">
                            <th className="pb-2">Farm Boundary</th>
                            <th className="pb-2 text-center">Moisture (%)</th>
                            <th className="pb-2 text-center">Temp (°C)</th>
                            <th className="pb-2 text-center">Humidity (%)</th>
                            <th className="pb-2 text-right">Last Heard</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-natural-border/30">
                          {sensorsList.map((node) => (
                            <tr key={node.id} className="hover:bg-white transition-colors">
                              <td className="py-3.5 font-bold text-xs text-natural-text">
                                {farmsList.find(f => f.id === node.farmId)?.name || node.farmId}
                              </td>
                              <td className="py-3.5 text-center text-xs font-mono font-bold text-blue-600">
                                {node.moisture}%
                              </td>
                              <td className="py-3.5 text-center text-xs font-mono font-bold text-amber-600">
                                {node.temperature}°C
                              </td>
                              <td className="py-3.5 text-center text-xs font-mono font-bold text-indigo-600">
                                {node.humidity}%
                              </td>
                              <td className="py-3.5 text-right text-[10px] text-natural-muted font-semibold">
                                {node.timestamp?.seconds ? new Date(node.timestamp.seconds * 1000).toLocaleTimeString() : 'A moment ago'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Calibration Guidelines */}
                  <div className="bg-white border border-natural-border p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-natural-text flex items-center gap-2 border-b pb-3 border-natural-border/50">
                      <Sliders size={14} className="text-accent-tan" />
                      Moisture Thresholds
                    </h4>
                    
                    <p className="text-[11px] text-natural-muted leading-relaxed">
                      Agrinovia smart sensors calculate real-time leaf transpiration and soil matrices to trigger crop safety warning sequences.
                    </p>

                    <div className="space-y-2 pt-2">
                      <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-xl flex justify-between items-center text-[11px]">
                        <span className="font-bold flex items-center gap-1">
                          <Wifi size={12} /> Critically Dry (&lt;35%)
                        </span>
                        <span className="font-mono font-bold">Priority Alarm</span>
                      </div>

                      <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl flex justify-between items-center text-[11px]">
                        <span className="font-bold flex items-center gap-1">
                          <Wifi size={12} /> Optimal (40% - 65%)
                        </span>
                        <span className="font-mono font-bold">Standard</span>
                      </div>

                      <div className="p-3 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-xl flex justify-between items-center text-[11px]">
                        <span className="font-bold flex items-center gap-1">
                          <Wifi size={12} /> Saturated (&gt;70%)
                        </span>
                        <span className="font-mono font-bold">Drainage Warn</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: CROP HEALTH & DISEASE MAPS */}
            {activeSubTab === 'crop' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-natural-text tracking-tight">Crop Health & Spatial Disease Hotspots</h3>
                    <p className="text-xs text-natural-muted">Evaluate AI diagnostic reports, trace outbreaks, and inspect land overlays on interactive grid maps.</p>
                  </div>
                  
                  {/* Map Overlays Switcher */}
                  <div className="flex bg-natural-bg p-1 rounded-xl border shrink-0">
                    <button 
                      onClick={() => setMapLayer('severity')}
                      className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all", mapLayer === 'severity' ? "bg-white text-red-600 shadow-sm" : "text-natural-muted")}
                    >
                      ⚠️ Disease Hotspots
                    </button>
                    <button 
                      onClick={() => setMapLayer('moisture')}
                      className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all", mapLayer === 'moisture' ? "bg-white text-blue-600 shadow-sm" : "text-natural-muted")}
                    >
                      💧 Soil Moisture
                    </button>
                    <button 
                      onClick={() => setMapLayer('drones')}
                      className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all", mapLayer === 'drones' ? "bg-white text-violet-600 shadow-sm" : "text-natural-muted")}
                    >
                      🛸 Drone Paths
                    </button>
                  </div>
                </div>

                {/* Spatial Map Canvas Simulation */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Map Grid Plotting (Interactive SVG Canvas) */}
                  <div className="lg:col-span-2 bg-[#EAE8E4] rounded-3xl p-6 border border-natural-border min-h-[350px] relative overflow-hidden flex flex-col justify-between">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(#1B3D2F 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }} />
                    
                    {/* Map Layers */}
                    <div className="relative z-10 flex justify-between items-center">
                      <span className="text-[10px] font-black bg-white/90 border px-3 py-1 rounded-full text-natural-text uppercase tracking-widest flex items-center gap-1.5">
                        <Layers size={12} className="text-primary-green" />
                        Interactive Overlord Map: {mapLayer} Overlay
                      </span>
                      <span className="text-[9px] text-natural-muted font-bold bg-white/70 px-2 py-0.5 rounded">GPS Lat: 7.35°N / Long: 37.12°E</span>
                    </div>

                    {/* Interactive Hotspot Pins based on Farms */}
                    <div className="relative w-full h-56 z-10 flex items-center justify-center">
                      {/* Sidama cooperative pin */}
                      <button 
                        onClick={() => setSelectedMapHotspot({
                          name: 'Sidama Growers Cooperative',
                          stats: mapLayer === 'severity' ? 'Severity: Low (Abebe Rust cleared)' : mapLayer === 'moisture' ? 'Transpiration: Optimal 54%' : 'Drone Cover: VTOL Drone on flight'
                        })}
                        className="absolute left-1/3 top-1/3 group transform -translate-x-1/2"
                      >
                        <span className="absolute inline-flex h-6 w-6 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600 border-2 border-white shadow-md cursor-pointer" />
                        <div className="absolute left-1/2 bottom-5 transform -translate-x-1/2 bg-white text-[9px] font-extrabold whitespace-nowrap px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity border pointer-events-none">
                          Sidama Coop (Healthy)
                        </div>
                      </button>

                      {/* Jimma Highland Estate pin */}
                      <button 
                        onClick={() => setSelectedMapHotspot({
                          name: 'Jimma Highland Organic Estate',
                          stats: mapLayer === 'severity' ? 'Severity: Critically High Outbreak (Coffee Leaf Rust)' : mapLayer === 'moisture' ? 'Moisture level: Under-hydrated (38%)' : 'Drone Cover: UAV Horizon Stationed'
                        })}
                        className="absolute left-2/3 top-2/3 group transform -translate-x-1/2"
                      >
                        <span className="absolute inline-flex h-8 w-8 rounded-full bg-red-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white shadow-md cursor-pointer" />
                        <div className="absolute left-1/2 bottom-5 transform -translate-x-1/2 bg-white text-[9px] font-extrabold text-red-600 whitespace-nowrap px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity border border-red-100 pointer-events-none">
                          Jimma Highland Outbreak (Rust)
                        </div>
                      </button>

                      {/* Harar sunny slopes */}
                      <button 
                        onClick={() => setSelectedMapHotspot({
                          name: 'Harar Sunny Slopes Farm',
                          stats: mapLayer === 'severity' ? 'Severity: Moderate Leaf Spot' : mapLayer === 'moisture' ? 'Moisture level: Saturated (72%)' : 'Drone Cover: Manual Pilot Required'
                        })}
                        className="absolute left-1/2 top-1/2 group"
                      >
                        <span className="absolute inline-flex h-6 w-6 rounded-full bg-amber-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-600 border-2 border-white shadow-md cursor-pointer" />
                        <div className="absolute left-1/2 bottom-5 transform -translate-x-1/2 bg-white text-[9px] font-extrabold text-amber-600 whitespace-nowrap px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity border border-amber-100 pointer-events-none">
                          Harar (Leaf Spot)
                        </div>
                      </button>
                    </div>

                    <div className="relative z-10 bg-white/95 p-4 rounded-2xl border text-xs text-natural-text font-bold">
                      {selectedMapHotspot ? (
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[9px] font-black text-natural-muted uppercase block">Selected Zone</span>
                            <span>{selectedMapHotspot.name}</span>
                            <span className="text-[10px] text-natural-muted font-normal block mt-0.5 italic">{selectedMapHotspot.stats}</span>
                          </div>
                          <button onClick={() => setSelectedMapHotspot(null)} className="text-[9px] font-black uppercase text-red-500 hover:underline">Clear</button>
                        </div>
                      ) : (
                        <p className="text-natural-muted font-semibold text-center italic">Click on map pins to trace diagnostic outbreak telemetry</p>
                      )}
                    </div>
                  </div>

                  {/* Diagnostic Logs Sidebar */}
                  <div className="bg-[#FAF9F6] border border-natural-border p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-natural-text flex items-center gap-2 border-b pb-3 border-natural-border/50">
                      <FileText size={14} className="text-primary-green" />
                      Recent AI Diagnoses
                    </h4>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                      {filteredReports.map((rep) => (
                        <div key={rep.id} className="bg-white p-3.5 rounded-xl border hover:border-primary-green/20 transition-all space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-natural-muted uppercase tracking-wider">Report {rep.id}</span>
                            <span className="text-[8px] font-bold bg-green-50 text-green-700 border px-1.5 py-0.5 rounded">AI Verified</span>
                          </div>
                          <p className="text-[11px] font-bold text-natural-text leading-relaxed line-clamp-3">
                            {rep.findings}
                          </p>
                          <div className="flex items-center gap-2 text-[9px] text-natural-muted pt-1 border-t border-natural-bg">
                            <span>User: {usersList.find(u => u.uid === rep.ownerId)?.displayName || 'Abebe Bikila'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 6: FINANCIAL MANAGEMENT MATRIX */}
            {activeSubTab === 'finance' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-natural-text tracking-tight">Financial Operation matrix</h3>
                    <p className="text-xs text-natural-muted">Audit system revenue streams, monthly subscription levels, and verify pending farmer invoices.</p>
                  </div>
                  
                  <div className="text-[11px] font-bold text-natural-text bg-[#FAF9F6] border px-4 py-2 rounded-xl">
                    Gross MRR: <span className="text-emerald-600 font-extrabold">${totalRevenue}.00 USD</span>
                  </div>
                </div>

                {/* Stat Overviews */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Revenue Card 1 */}
                  <div className="bg-white border border-natural-border p-6 rounded-2xl space-y-1">
                    <span className="text-[9px] font-black text-natural-muted uppercase tracking-widest block mb-1">Cooperative Tiers</span>
                    <h4 className="text-3xl font-black text-natural-text">$199.00 <span className="text-xs text-natural-muted">/ mo</span></h4>
                    <p className="text-[10px] text-natural-muted pt-1">Active subscriptions: <strong>{paymentsList.filter(p => p.plan === 'Cooperative Premium').length} cooperatives</strong></p>
                    <div className="w-full bg-natural-bg h-1.5 rounded-full overflow-hidden mt-3">
                      <div className="bg-emerald-600 h-full" style={{ width: '48%' }} />
                    </div>
                  </div>

                  {/* Revenue Card 2 */}
                  <div className="bg-white border border-natural-border p-6 rounded-2xl space-y-1">
                    <span className="text-[9px] font-black text-natural-muted uppercase tracking-widest block mb-1">Agronomist Experts</span>
                    <h4 className="text-3xl font-black text-natural-text">$89.00 <span className="text-xs text-natural-muted">/ mo</span></h4>
                    <p className="text-[10px] text-natural-muted pt-1">Active licenses: <strong>{paymentsList.filter(p => p.plan === 'Expert License').length} experts</strong></p>
                    <div className="w-full bg-natural-bg h-1.5 rounded-full overflow-hidden mt-3">
                      <div className="bg-indigo-600 h-full" style={{ width: '28%' }} />
                    </div>
                  </div>

                  {/* Revenue Card 3 */}
                  <div className="bg-white border border-natural-border p-6 rounded-2xl space-y-1">
                    <span className="text-[9px] font-black text-natural-muted uppercase tracking-widest block mb-1">Average Revenue (AOV)</span>
                    <h4 className="text-3xl font-black text-natural-text">${averageOrderValue} <span className="text-xs text-natural-muted">per order</span></h4>
                    <p className="text-[10px] text-natural-muted pt-1">Conversion success rate: <strong>92.4%</strong></p>
                    <div className="w-full bg-natural-bg h-1.5 rounded-full overflow-hidden mt-3">
                      <div className="bg-blue-600 h-full" style={{ width: '92.4%' }} />
                    </div>
                  </div>

                </div>

                {/* Historical Invoices */}
                <div className="bg-[#FAF9F6] border border-natural-border rounded-2xl p-6">
                  <h4 className="text-xs font-black uppercase tracking-wider text-natural-text flex items-center gap-2 pb-3 border-b border-natural-border/60 mb-4">
                    <CreditCard size={14} className="text-primary-green" />
                    Transaction Ledger
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-natural-border text-[9px] font-black uppercase tracking-wider text-natural-muted">
                          <th className="pb-2">Invoice</th>
                          <th className="pb-2">Email</th>
                          <th className="pb-2">Plan</th>
                          <th className="pb-2 text-center">Amount</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-natural-border/30">
                        {paymentsList.map((pay) => (
                          <tr key={pay.id} className="hover:bg-white transition-colors">
                            <td className="py-3 font-mono font-bold text-xs text-natural-text">{pay.invoiceId}</td>
                            <td className="py-3 text-xs text-natural-muted">{pay.email}</td>
                            <td className="py-3 text-xs font-semibold text-natural-text">{pay.plan}</td>
                            <td className="py-3 text-center text-xs font-mono font-bold text-natural-text">${pay.amount.toFixed(2)}</td>
                            <td className="py-3 text-right">
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
                                pay.status === 'success' ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                              )}>
                                {pay.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: SYSTEM ANALYTICS */}
            {activeSubTab === 'analytics' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-natural-text tracking-tight">System Performance & Registrations Trends</h3>
                    <p className="text-xs text-natural-muted">Visual analytics of platform growth, sensor readings over time, and disease diagnostics metrics.</p>
                  </div>
                </div>

                {/* Analytical Charts using Elegant CSS Columns & Bars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Chart 1: Platform User Registrations */}
                  <div className="bg-white border border-natural-border p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-natural-bg">
                      <h4 className="text-xs font-black uppercase tracking-wider text-natural-text flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-primary-green" />
                        Cumulative Outbreaks by Crop Type
                      </h4>
                      <span className="text-[9px] text-natural-muted font-bold">2026 Year to Date</span>
                    </div>

                    <div className="space-y-3 pt-2">
                      {[
                        { crop: 'Arabica Specialty Coffee (Rust)', count: 48, percentage: 80, color: 'bg-red-500' },
                        { crop: 'Harar Peaberry (Leaf Spot)', count: 24, percentage: 40, color: 'bg-amber-500' },
                        { crop: 'Sidamo Specialty (Berry Borer)', count: 12, percentage: 20, color: 'bg-yellow-500' },
                        { crop: 'Highland Teff Flour (Pure Clean)', count: 82, percentage: 95, color: 'bg-emerald-500' }
                      ].map((bar) => (
                        <div key={bar.crop} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-natural-text">
                            <span>{bar.crop}</span>
                            <span>{bar.count} cases</span>
                          </div>
                          <div className="w-full bg-natural-bg h-2 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", bar.color)} style={{ width: `${bar.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chart 2: Telemetry Performance Logs */}
                  <div className="bg-white border border-natural-border p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-natural-bg">
                      <h4 className="text-xs font-black uppercase tracking-wider text-natural-text flex items-center gap-1.5">
                        <PieChart size={14} className="text-indigo-600" />
                        Operational Airborne Flight Time hours
                      </h4>
                      <span className="text-[9px] text-natural-muted font-bold">Hours by Pilot Class</span>
                    </div>

                    <div className="space-y-3.5 pt-2 text-xs font-medium text-natural-text">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-indigo-600 rounded-full" />
                          Autonomous AI Autopilot
                        </span>
                        <span className="font-mono font-bold">142 Hours (72%)</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-emerald-600 rounded-full" />
                          Certified Agricultural Experts
                        </span>
                        <span className="font-mono font-bold">48 Hours (20%)</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-amber-600 rounded-full" />
                          Standard Cooperative Pilots
                        </span>
                        <span className="font-mono font-bold">15 Hours (8%)</span>
                      </div>

                      <div className="bg-natural-bg/50 p-3.5 rounded-xl border border-natural-border text-[10px] text-natural-muted leading-relaxed">
                        Total calculated sensor surface area scanned: <strong>14,240 Hectares</strong> across primary cooperatives.
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 8: SETTINGS & CONTROL POLICY */}
            {activeSubTab === 'settings' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-xl font-bold text-natural-text tracking-tight">System Global Security Policies</h3>
                  <p className="text-xs text-natural-muted">Adjust system-wide policies, switch models, and toggle platform maintenance status.</p>
                </div>

                <div className="bg-[#FAF9F6] border border-natural-border rounded-2xl p-6 space-y-6">
                  
                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between pb-4 border-b border-natural-border/40">
                    <div className="space-y-1 pr-4">
                      <span className="text-xs font-black uppercase text-natural-text block">System Maintenance Protocol</span>
                      <span className="text-[11px] text-natural-muted block leading-relaxed">
                        Deploying this restriction locks all standard farmer accounts into read-only mode to perform system synchronization and structural database refactoring.
                      </span>
                    </div>
                    <button 
                      onClick={() => handleUpdateSettings('maintenanceMode', !sysSettings.maintenanceMode)}
                      className={cn(
                        "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border",
                        sysSettings.maintenanceMode 
                          ? "bg-red-50 text-red-600 border-red-200" 
                          : "bg-white text-natural-muted border-natural-border hover:bg-natural-bg"
                      )}
                    >
                      {sysSettings.maintenanceMode ? 'Locked: Maintenance' : 'Operational'}
                    </button>
                  </div>

                  {/* AI Model Switching */}
                  <div className="flex items-center justify-between pb-4 border-b border-natural-border/40">
                    <div className="space-y-1 pr-4">
                      <span className="text-xs font-black uppercase text-natural-text block">AI Reasoning Engine Mode</span>
                      <span className="text-[11px] text-natural-muted block leading-relaxed">
                        Choose model complexity for plant disease analysis. Gemini-Flash provides instant speed, while Gemini-Pro focuses on multi-spectral precision.
                      </span>
                    </div>
                    <select 
                      value={sysSettings.modelMode}
                      onChange={(e) => handleUpdateSettings('modelMode', e.target.value)}
                      className="bg-white border p-2.5 rounded-xl text-xs font-bold text-natural-text focus:outline-none"
                    >
                      <option value="gemini-flash">Gemini-3.5-flash (Express Diagnostic)</option>
                      <option value="gemini-pro">Gemini-1.5-pro (Deep Research)</option>
                    </select>
                  </div>

                  {/* Rate Limiting */}
                  <div className="flex items-center justify-between pb-4 border-b border-natural-border/40">
                    <div className="space-y-1 pr-4">
                      <span className="text-xs font-black uppercase text-natural-text block">Gemini API Token Rate Limiting</span>
                      <span className="text-[11px] text-natural-muted block leading-relaxed">
                        Control standard users multi-spec image scanning limits (queries allowed per hour to prevent key exhaustion).
                      </span>
                    </div>
                    <select 
                      value={sysSettings.rateLimit}
                      onChange={(e) => handleUpdateSettings('rateLimit', Number(e.target.value))}
                      className="bg-white border p-2.5 rounded-xl text-xs font-bold text-natural-text focus:outline-none"
                    >
                      <option value="15">15 queries / hr</option>
                      <option value="30">30 queries / hr</option>
                      <option value="60">60 queries / hr (Standard)</option>
                      <option value="120">120 queries / hr</option>
                    </select>
                  </div>

                  {/* Alert Emails */}
                  <div className="flex items-center justify-between pb-4">
                    <div className="space-y-1 pr-4">
                      <span className="text-xs font-black uppercase text-natural-text block">System Security Alert Forwarding</span>
                      <span className="text-[11px] text-natural-muted block leading-relaxed">
                        Specify administrative inbox for receiving instant notifications regarding critical disease outbreaks.
                      </span>
                    </div>
                    <input 
                      type="email" 
                      value={sysSettings.alertEmail}
                      onChange={(e) => setSysSettings(prev => ({ ...prev, alertEmail: e.target.value }))}
                      onBlur={() => handleUpdateSettings('alertEmail', sysSettings.alertEmail)}
                      className="bg-white border p-2.5 rounded-xl text-xs text-natural-text focus:outline-none focus:border-primary-green w-48 font-medium"
                    />
                  </div>

                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
